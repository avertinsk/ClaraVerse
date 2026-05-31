package handlers

import (
	"bytes"
	"claraverse/internal/filecache"
	"claraverse/internal/models"
	"claraverse/internal/security"
	"claraverse/internal/services"
	"claraverse/internal/utils"
	"encoding/csv"
	"fmt"
	"hash/fnv"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/mongo/gridfs"
)

// UploadHandler handles file upload requests
type UploadHandler struct {
	uploadDir    string
	maxImageSize int64
	maxPDFSize   int64
	maxDocSize   int64 // For DOCX and PPTX
	allowedTypes map[string]bool
	fileCache    *filecache.Service
	usageLimiter *services.UsageLimiterService
	gridFS       *gridfs.Bucket // for async doc processing
	docProcessor *services.DocumentProcessor
}

// NewUploadHandler creates a new upload handler
func NewUploadHandler(uploadDir string, usageLimiter *services.UsageLimiterService, gridFS *gridfs.Bucket, docProcessor *services.DocumentProcessor) *UploadHandler {
	// Ensure upload directory exists with restricted permissions
	if err := os.MkdirAll(uploadDir, 0700); err != nil {
		log.Printf("⚠️  Warning: Could not create upload directory: %v", err)
	}

	return &UploadHandler{
		uploadDir:    uploadDir,
		maxImageSize: 20 * 1024 * 1024, // 20MB for images
		maxPDFSize:   100 * 1024 * 1024, // 100MB for PDFs
		maxDocSize:   100 * 1024 * 1024, // 100MB for DOCX/PPTX
		usageLimiter: usageLimiter,
		allowedTypes: map[string]bool{
			"image/jpeg":                                                       true,
			"image/jpg":                                                        true,
			"image/png":                                                        true,
			"image/webp":                                                       true,
			"image/gif":                                                        true,
			"application/pdf":                                                  true,
			"text/csv":                                                         true,
			"application/vnd.ms-excel":                                         true, // .xls
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true, // .xlsx
			"application/json":                                                 true,
			"text/plain":                                                       true,
			// Office documents
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document":   true, // .docx
			"application/vnd.openxmlformats-officedocument.presentationml.presentation": true, // .pptx
			// Audio files (for Whisper transcription)
			"audio/mpeg":    true, // .mp3
			"audio/mp3":     true, // .mp3 alternate
			"audio/wav":     true, // .wav
			"audio/x-wav":   true, // .wav alternate
			"audio/wave":    true, // .wav alternate
			"audio/mp4":     true, // .m4a
			"audio/x-m4a":   true, // .m4a alternate
			"audio/webm":    true, // .webm
			"audio/ogg":     true, // .ogg
			"audio/flac":    true, // .flac
		},
		fileCache:    filecache.GetService(),
		gridFS:       gridFS,
		docProcessor: docProcessor,
	}
}

// UploadResponse represents the upload API response
type UploadResponse struct {
	FileID         string      `json:"file_id"`
	Filename       string      `json:"filename"`
	MimeType       string      `json:"mime_type"`
	Size           int64       `json:"size"`
	Hash           string      `json:"hash,omitempty"`
	Status         string      `json:"status,omitempty"` // "processing" for async docs
	PageCount      int         `json:"page_count,omitempty"`
	WordCount      int         `json:"word_count,omitempty"`
	Preview        string      `json:"preview,omitempty"`
	ConversationID string      `json:"conversation_id,omitempty"`
	URL            string      `json:"url,omitempty"` // Deprecated for PDFs - use file_id
	DataPreview    *CSVPreview `json:"data_preview,omitempty"`
}

// CSVPreview represents a preview of CSV/tabular data
type CSVPreview struct {
	Headers  []string   `json:"headers"`
	Rows     [][]string `json:"rows"`
	RowCount int        `json:"row_count"` // Total rows in file
	ColCount int        `json:"col_count"` // Total columns
}

// Upload handles file upload requests
func (h *UploadHandler) Upload(c *fiber.Ctx) error {
	// Check authentication
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" || userID == "anonymous" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Authentication required for file uploads",
		})
	}

	// Check file upload limit
	if h.usageLimiter != nil {
		ctx := c.Context()
		if err := h.usageLimiter.CheckFileUploadLimit(ctx, userID); err != nil {
			if limitErr, ok := err.(*services.LimitExceededError); ok {
				log.Printf("⚠️  [LIMIT] File upload limit exceeded for user %s: %s", userID, limitErr.Message)
				return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
					"error":      limitErr.Message,
					"error_code": limitErr.ErrorCode,
					"limit":      limitErr.Limit,
					"used":       limitErr.Used,
					"reset_at":   limitErr.ResetAt,
					"upgrade_to": limitErr.UpgradeTo,
				})
			}
		}

		// Increment file upload count (check passed) - defer to ensure it runs even if upload fails
		defer func() {
			if err := h.usageLimiter.IncrementFileUploadCount(c.Context(), userID); err != nil {
				log.Printf("⚠️  [LIMIT] Failed to increment file upload count for user %s: %v", userID, err)
			}
		}()
	}

	// Get conversation_id from form or create new one
	conversationID := c.FormValue("conversation_id")
	if conversationID == "" {
		conversationID = uuid.New().String()
	}

	// Get uploaded file
	fileHeader, err := c.FormFile("file")
	if err != nil {
		log.Printf("❌ [UPLOAD] Failed to parse file: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No file provided or invalid file",
		})
	}

	// Open uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		log.Printf("❌ [UPLOAD] Failed to open file: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to process file",
		})
	}
	defer file.Close()

	// Read file data into memory
	fileData, err := io.ReadAll(file)
	if err != nil {
		log.Printf("❌ [UPLOAD] Failed to read file: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read file",
		})
	}

	// Detect content type
	detectedMimeType := h.detectContentTypeFromData(fileData, fileHeader)

	// Strip charset and other parameters from MIME type (e.g., "text/plain; charset=utf-8" -> "text/plain")
	mimeType := strings.Split(detectedMimeType, ";")[0]
	mimeType = strings.TrimSpace(mimeType)

	// Validate content type
	if !h.allowedTypes[mimeType] {
		log.Printf("⚠️  [UPLOAD] Disallowed file type: %s (detected as: %s)", mimeType, detectedMimeType)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("File type not allowed: %s. Allowed types: PNG, JPG, WebP, GIF, PDF, DOCX, PPTX, CSV, Excel, JSON, MP3, WAV, M4A, OGG, FLAC", mimeType),
		})
	}

	// Validate file size based on type
	maxSize := h.maxImageSize
	if mimeType == "application/pdf" {
		maxSize = h.maxPDFSize
	} else if mimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
		mimeType == "application/vnd.openxmlformats-officedocument.presentationml.presentation" {
		// DOCX, PPTX files: 10MB limit
		maxSize = h.maxDocSize
	} else if strings.HasPrefix(mimeType, "text/") || strings.Contains(mimeType, "json") || strings.Contains(mimeType, "spreadsheet") || strings.Contains(mimeType, "excel") {
		// CSV, JSON, Excel files: 100MB limit
		maxSize = 100 * 1024 * 1024
	} else if strings.HasPrefix(mimeType, "audio/") {
		// Audio files: 25MB limit (OpenAI Whisper limit)
		maxSize = 25 * 1024 * 1024
	}

	if fileHeader.Size > maxSize {
		log.Printf("⚠️  [UPLOAD] File too large: %d bytes (max %d)", fileHeader.Size, maxSize)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("File too large. Maximum size is %d MB", maxSize/(1024*1024)),
		})
	}

	// Calculate file hash (before encryption)
	fileHash := security.CalculateDataHash(fileData)

	// Generate unique file ID
	fileID := uuid.New().String()

	// Handle PDF files with secure processing
	if mimeType == "application/pdf" {
		return h.handlePDFUpload(c, fileID, userID, conversationID, fileHeader, fileData, fileHash)
	}

	// Handle DOCX files with secure processing
	if mimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" {
		return h.handleDOCXUpload(c, fileID, userID, conversationID, fileHeader, fileData, fileHash)
	}

	// Handle PPTX files with secure processing
	if mimeType == "application/vnd.openxmlformats-officedocument.presentationml.presentation" {
		return h.handlePPTXUpload(c, fileID, userID, conversationID, fileHeader, fileData, fileHash)
	}

	// Handle CSV/Excel/JSON files for E2B tools
	if strings.HasPrefix(mimeType, "text/csv") || strings.Contains(mimeType, "spreadsheet") || strings.Contains(mimeType, "excel") || mimeType == "application/json" || mimeType == "text/plain" {
		return h.handleDataFileUpload(c, fileID, userID, fileHeader, fileData, mimeType, fileHash)
	}

	// Handle audio files (for Whisper transcription)
	if strings.HasPrefix(mimeType, "audio/") {
		return h.handleAudioUpload(c, fileID, userID, fileHeader, fileData, mimeType, fileHash)
	}

	// Handle image files (existing flow)
	return h.handleImageUpload(c, fileID, userID, fileHeader, fileData, mimeType, fileHash)
}

// handlePDFUpload saves raw bytes to GridFS for async processing.
func (h *UploadHandler) handlePDFUpload(c *fiber.Ctx, fileID, userID, conversationID string, fileHeader *multipart.FileHeader, fileData []byte, fileHash *security.Hash) error {
	log.Printf("📄 [UPLOAD] Enqueuing PDF: %s (user: %s, size: %d bytes)", fileHeader.Filename, userID, len(fileData))

	if err := utils.ValidatePDF(fileData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid or corrupted PDF file"})
	}

	if h.docProcessor == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Document processing not available (MongoDB required)"})
	}

	cacheID, err := h.docProcessor.EnqueueJob(c.Context(), userID, conversationID, fileHeader.Filename, "application/pdf", fileData)
	if err != nil {
		log.Printf("❌ [UPLOAD] Failed to enqueue PDF: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to queue document for processing"})
	}

	return c.Status(fiber.StatusCreated).JSON(UploadResponse{
		FileID:         cacheID,
		Filename:       fileHeader.Filename,
		MimeType:       "application/pdf",
		Size:           fileHeader.Size,
		Hash:           fileHash.String(),
		Status:         models.DocStatusProcessing,
		ConversationID: conversationID,
	})
}

// handleDOCXUpload saves raw bytes to GridFS for async processing.
func (h *UploadHandler) handleDOCXUpload(c *fiber.Ctx, fileID, userID, conversationID string, fileHeader *multipart.FileHeader, fileData []byte, fileHash *security.Hash) error {
	log.Printf("📄 [UPLOAD] Enqueuing DOCX: %s (user: %s, size: %d bytes)", fileHeader.Filename, userID, len(fileData))

	if err := utils.ValidateDOCX(fileData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid or corrupted DOCX file"})
	}

	if h.docProcessor == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Document processing not available (MongoDB required)"})
	}

	cacheID, err := h.docProcessor.EnqueueJob(c.Context(), userID, conversationID, fileHeader.Filename,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileData)
	if err != nil {
		log.Printf("❌ [UPLOAD] Failed to enqueue DOCX: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to queue document for processing"})
	}

	return c.Status(fiber.StatusCreated).JSON(UploadResponse{
		FileID:         cacheID,
		Filename:       fileHeader.Filename,
		MimeType:       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		Size:           fileHeader.Size,
		Hash:           fileHash.String(),
		Status:         models.DocStatusProcessing,
		ConversationID: conversationID,
	})
}

// handlePPTXUpload saves raw bytes to GridFS for async processing.
func (h *UploadHandler) handlePPTXUpload(c *fiber.Ctx, fileID, userID, conversationID string, fileHeader *multipart.FileHeader, fileData []byte, fileHash *security.Hash) error {
	log.Printf("📊 [UPLOAD] Enqueuing PPTX: %s (user: %s, size: %d bytes)", fileHeader.Filename, userID, len(fileData))

	if err := utils.ValidatePPTX(fileData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid or corrupted PPTX file"})
	}

	if h.docProcessor == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Document processing not available (MongoDB required)"})
	}

	cacheID, err := h.docProcessor.EnqueueJob(c.Context(), userID, conversationID, fileHeader.Filename,
		"application/vnd.openxmlformats-officedocument.presentationml.presentation", fileData)
	if err != nil {
		log.Printf("❌ [UPLOAD] Failed to enqueue PPTX: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to queue document for processing"})
	}

	return c.Status(fiber.StatusCreated).JSON(UploadResponse{
		FileID:         cacheID,
		Filename:       fileHeader.Filename,
		MimeType:       "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		Size:           fileHeader.Size,
		Hash:           fileHash.String(),
		Status:         models.DocStatusProcessing,
		ConversationID: conversationID,
	})
}

// handleImageUpload processes image files (existing flow, now with hash)
func (h *UploadHandler) handleImageUpload(c *fiber.Ctx, fileID, userID string, fileHeader *multipart.FileHeader, fileData []byte, mimeType string, fileHash *security.Hash) error {
	// Get conversation_id from form (may be empty)
	conversationID := c.FormValue("conversation_id")

	// Generate filename with extension
	ext := filepath.Ext(fileHeader.Filename)
	if ext == "" {
		ext = h.getExtensionFromMimeType(mimeType)
	}
	savedFilename := fileID + ext
	filePath := filepath.Join(h.uploadDir, savedFilename)

	// Save image to disk with restricted permissions (owner read/write only for security)
	if err := os.WriteFile(filePath, fileData, 0600); err != nil {
		log.Printf("❌ [UPLOAD] Failed to save file: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}

	// Register image in cache for auto-deletion
	cachedFile := &filecache.CachedFile{
		FileID:         fileID,
		UserID:         userID,
		ConversationID: conversationID,
		FileHash:       *fileHash,
		Filename:       fileHeader.Filename,
		MimeType:       mimeType,
		Size:           fileHeader.Size,
		FilePath:       filePath, // Track disk location
		UploadedAt:     time.Now(),
	}
	h.fileCache.Store(cachedFile)

	log.Printf("✅ [UPLOAD] Image uploaded successfully: %s (user: %s, size: %d bytes)", savedFilename, userID, fileHeader.Size)

	// Build file URL
	fileURL := fmt.Sprintf("/uploads/%s", savedFilename)

	return c.Status(fiber.StatusCreated).JSON(UploadResponse{
		FileID:   fileID,
		URL:      fileURL,
		MimeType: mimeType,
		Size:     fileHeader.Size,
		Filename: fileHeader.Filename,
		Hash:     fileHash.String(),
	})
}

// handleDataFileUpload processes CSV/Excel/JSON files for E2B tools
func (h *UploadHandler) handleDataFileUpload(c *fiber.Ctx, fileID, userID string, fileHeader *multipart.FileHeader, fileData []byte, mimeType string, fileHash *security.Hash) error {
	// Get conversation_id from form (may be empty)
	conversationID := c.FormValue("conversation_id")

	// Generate filename with extension
	ext := filepath.Ext(fileHeader.Filename)
	if ext == "" {
		ext = h.getExtensionFromMimeType(mimeType)
	}
	savedFilename := fileID + ext
	filePath := filepath.Join(h.uploadDir, savedFilename)

	// Save file to disk with restricted permissions
	if err := os.WriteFile(filePath, fileData, 0600); err != nil {
		log.Printf("❌ [UPLOAD] Failed to save data file: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}

	// Register file in cache for auto-deletion
	cachedFile := &filecache.CachedFile{
		FileID:         fileID,
		UserID:         userID,
		ConversationID: conversationID,
		FileHash:       *fileHash,
		Filename:       fileHeader.Filename,
		MimeType:       mimeType,
		Size:           fileHeader.Size,
		FilePath:       filePath,
		UploadedAt:     time.Now(),
	}
	h.fileCache.Store(cachedFile)

	// Parse CSV preview if it's a CSV file
	var dataPreview *CSVPreview
	if mimeType == "text/csv" || strings.HasSuffix(strings.ToLower(fileHeader.Filename), ".csv") {
		dataPreview = h.parseCSVPreview(fileData)
	}

	log.Printf("✅ [UPLOAD] Data file uploaded successfully: %s (user: %s, size: %d bytes, type: %s)", savedFilename, userID, fileHeader.Size, mimeType)

	// Build file URL
	fileURL := fmt.Sprintf("/uploads/%s", savedFilename)

	return c.Status(fiber.StatusCreated).JSON(UploadResponse{
		FileID:      fileID,
		URL:         fileURL,
		MimeType:    mimeType,
		Size:        fileHeader.Size,
		Filename:    fileHeader.Filename,
		Hash:        fileHash.String(),
		DataPreview: dataPreview,
	})
}

// handleAudioUpload processes audio files for Whisper transcription
func (h *UploadHandler) handleAudioUpload(c *fiber.Ctx, fileID, userID string, fileHeader *multipart.FileHeader, fileData []byte, mimeType string, fileHash *security.Hash) error {
	// Get conversation_id from form (may be empty)
	conversationID := c.FormValue("conversation_id")

	log.Printf("🎵 [UPLOAD] Processing audio: %s (user: %s, size: %d bytes, type: %s)", fileHeader.Filename, userID, len(fileData), mimeType)

	// Generate filename with extension
	ext := filepath.Ext(fileHeader.Filename)
	if ext == "" {
		ext = h.getExtensionFromMimeType(mimeType)
	}
	savedFilename := fileID + ext
	filePath := filepath.Join(h.uploadDir, savedFilename)

	// Save audio to disk with restricted permissions
	if err := os.WriteFile(filePath, fileData, 0600); err != nil {
		log.Printf("❌ [UPLOAD] Failed to save audio file: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}

	// Register file in cache for auto-deletion
	cachedFile := &filecache.CachedFile{
		FileID:         fileID,
		UserID:         userID,
		ConversationID: conversationID,
		FileHash:       *fileHash,
		Filename:       fileHeader.Filename,
		MimeType:       mimeType,
		Size:           fileHeader.Size,
		FilePath:       filePath,
		UploadedAt:     time.Now(),
	}
	h.fileCache.Store(cachedFile)

	log.Printf("✅ [UPLOAD] Audio file uploaded successfully: %s (user: %s, size: %d bytes)", savedFilename, userID, fileHeader.Size)

	// Build file URL
	fileURL := fmt.Sprintf("/uploads/%s", savedFilename)

	return c.Status(fiber.StatusCreated).JSON(UploadResponse{
		FileID:   fileID,
		URL:      fileURL,
		MimeType: mimeType,
		Size:     fileHeader.Size,
		Filename: fileHeader.Filename,
		Hash:     fileHash.String(),
	})
}

// parseCSVPreview extracts headers and first rows from CSV data
func (h *UploadHandler) parseCSVPreview(data []byte) *CSVPreview {
	reader := csv.NewReader(bytes.NewReader(data))
	reader.LazyQuotes = true
	reader.TrimLeadingSpace = true

	// Read all records to get total count
	allRecords, err := reader.ReadAll()
	if err != nil || len(allRecords) == 0 {
		log.Printf("⚠️  [UPLOAD] Failed to parse CSV preview: %v", err)
		return nil
	}

	// First row is headers
	headers := allRecords[0]
	totalRows := len(allRecords) - 1 // Exclude header row

	// Get first 5 rows for preview (excluding header)
	maxPreviewRows := 5
	if totalRows < maxPreviewRows {
		maxPreviewRows = totalRows
	}

	previewRows := make([][]string, maxPreviewRows)
	for i := 0; i < maxPreviewRows; i++ {
		previewRows[i] = allRecords[i+1] // +1 to skip header
	}

	return &CSVPreview{
		Headers:  headers,
		Rows:     previewRows,
		RowCount: totalRows,
		ColCount: len(headers),
	}
}

// detectContentTypeFromData detects MIME type from byte data
func (h *UploadHandler) detectContentTypeFromData(data []byte, header *multipart.FileHeader) string {
	// Check PDF magic bytes first
	if bytes.HasPrefix(data, []byte("%PDF-")) {
		return "application/pdf"
	}

	// Check for ZIP-based Office formats (DOCX, PPTX, XLSX start with PK)
	// These are ZIP files, so we need to check extension
	if bytes.HasPrefix(data, []byte("PK")) {
		ext := strings.ToLower(filepath.Ext(header.Filename))
		switch ext {
		case ".docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		case ".pptx":
			return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
		case ".xlsx":
			return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		}
	}

	// Use http.DetectContentType for other types
	mimeType := http.DetectContentType(data)

	// Handle fallback for octet-stream or application/zip
	if mimeType == "application/octet-stream" || mimeType == "application/zip" {
		ext := strings.ToLower(filepath.Ext(header.Filename))
		switch ext {
		case ".pdf":
			return "application/pdf"
		case ".jpg", ".jpeg":
			return "image/jpeg"
		case ".png":
			return "image/png"
		case ".gif":
			return "image/gif"
		case ".webp":
			return "image/webp"
		case ".docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		case ".pptx":
			return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
		case ".xlsx":
			return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		// Audio formats
		case ".mp3":
			return "audio/mpeg"
		case ".wav":
			return "audio/wav"
		case ".m4a":
			return "audio/mp4"
		case ".webm":
			return "audio/webm"
		case ".ogg":
			return "audio/ogg"
		case ".flac":
			return "audio/flac"
		}
	}

	return mimeType
}

// detectContentType detects the MIME type of the uploaded file
func (h *UploadHandler) detectContentType(file multipart.File, header *multipart.FileHeader) (string, error) {
	// Read first 512 bytes for content type detection
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return "", err
	}

	// Detect content type
	mimeType := http.DetectContentType(buffer[:n])

	// Handle some edge cases where DetectContentType returns generic types
	if mimeType == "application/octet-stream" {
		// Fall back to extension-based detection
		ext := strings.ToLower(filepath.Ext(header.Filename))
		switch ext {
		case ".jpg", ".jpeg":
			mimeType = "image/jpeg"
		case ".png":
			mimeType = "image/png"
		case ".gif":
			mimeType = "image/gif"
		case ".webp":
			mimeType = "image/webp"
		}
	}

	return mimeType, nil
}

// getExtensionFromMimeType returns file extension for a given MIME type
func (h *UploadHandler) getExtensionFromMimeType(mimeType string) string {
	switch mimeType {
	case "application/pdf":
		return ".pdf"
	case "image/jpeg", "image/jpg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	case "image/webp":
		return ".webp"
	case "text/csv":
		return ".csv"
	case "application/json":
		return ".json"
	case "text/plain":
		return ".txt"
	case "application/vnd.ms-excel":
		return ".xls"
	case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
		return ".xlsx"
	case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		return ".docx"
	case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
		return ".pptx"
	// Audio formats
	case "audio/mpeg", "audio/mp3":
		return ".mp3"
	case "audio/wav", "audio/x-wav", "audio/wave":
		return ".wav"
	case "audio/mp4", "audio/x-m4a":
		return ".m4a"
	case "audio/webm":
		return ".webm"
	case "audio/ogg":
		return ".ogg"
	case "audio/flac":
		return ".flac"
	default:
		return ".bin"
	}
}

// saveFile saves the uploaded file to disk
func (h *UploadHandler) saveFile(src multipart.File, dst string) error {
	// Create destination file
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	// Copy file contents
	_, err = io.Copy(out, src)
	return err
}

// CheckFileStatus checks if a file is still available (not expired)
// This is used by the frontend to validate file references before workflow execution
func (h *UploadHandler) CheckFileStatus(c *fiber.Ctx) error {
	// Get file ID from URL params
	fileID := c.Params("id")
	if fileID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":     "File ID required",
			"available": false,
			"expired":   true,
		})
	}

	// Check if user is authenticated (optional - for ownership validation)
	userID, _ := c.Locals("user_id").(string)

	// Check file cache
	if h.fileCache == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":     "File cache service unavailable",
			"available": false,
			"expired":   false,
		})
	}

	// Try to get file from cache
	var file *filecache.CachedFile
	var err error

	if userID != "" && userID != "anonymous" {
		// If authenticated, verify ownership
		file, err = h.fileCache.GetByUser(fileID, userID)
	} else {
		// If not authenticated, just check existence
		var found bool
		file, found = h.fileCache.Get(fileID)
		if !found {
			err = fmt.Errorf("file not found or expired")
		}
	}

	if err != nil || file == nil {
		// File not found or expired
		log.Printf("⚠️ [UPLOAD] File status check - file not available: %s (user: %s)", fileID, userID)
		return c.JSON(fiber.Map{
			"file_id":   fileID,
			"available": false,
			"expired":   true,
			"error":     "File not found or has expired. Files are only available for 30 minutes after upload.",
		})
	}

	// File is available
	log.Printf("✅ [UPLOAD] File status check - file available: %s (user: %s)", fileID, userID)
	return c.JSON(fiber.Map{
		"file_id":   fileID,
		"available": true,
		"expired":   false,
		"filename":  file.Filename,
		"mime_type": file.MimeType,
		"size":      file.Size,
	})
}

// Delete removes an uploaded file
func (h *UploadHandler) Delete(c *fiber.Ctx) error {
	// Check authentication
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" || userID == "anonymous" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Authentication required",
		})
	}

	// Get file ID from URL params
	fileID := c.Params("id")
	if fileID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File ID required",
		})
	}

	// SECURITY: Validate fileID to prevent path traversal attacks
	if err := security.ValidateFileID(fileID); err != nil {
		log.Printf("⚠️  [UPLOAD] Invalid file ID in delete request: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid file ID format",
		})
	}

	// Find file by ID (try all extensions)
	var filePath string
	extensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	for _, ext := range extensions {
		testPath := filepath.Join(h.uploadDir, fileID+ext)
		if _, err := os.Stat(testPath); err == nil {
			filePath = testPath
			break
		}
	}

	if filePath == "" {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "File not found",
		})
	}

	// Delete file
	if err := os.Remove(filePath); err != nil {
		log.Printf("❌ [UPLOAD] Failed to delete file %s: %v", filePath, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete file",
		})
	}

	log.Printf("🗑️  [UPLOAD] File deleted: %s (user: %s)", filePath, userID)

	return c.JSON(fiber.Map{
		"message": "File deleted successfully",
	})
}

func indexDocumentInQdrant(text, filename string) {
	embedSvc := services.GetEmbeddingService()
	qdrantSvc := services.GetQdrantService()
	if embedSvc == nil || qdrantSvc == nil || !embedSvc.IsAvailable() || !qdrantSvc.IsAvailable() {
		log.Printf("ℹ️ [QDRANT] Skipping index — services not ready")
		return
	}

	chunks := services.ChunkDocument(text, filename)
	if len(chunks) == 0 {
		return
	}

	if err := qdrantSvc.EnsureCollection("documents", embedSvc.VectorSize()); err != nil {
		log.Printf("⚠️ [QDRANT] Failed to create collection: %v", err)
		return
	}

	log.Printf("📊 [QDRANT] Indexing %d chunks from %s", len(chunks), filename)

	for _, chunk := range chunks {
		vec, err := embedSvc.EmbedDocument(chunk.Text)
		if err != nil {
			log.Printf("⚠️ [QDRANT] Embedding failed for chunk %d: %v", chunk.Index, err)
			continue
		}
		// Generate unique uint64 ID from filename + chunk index
		h := fnv.New64a()
		h.Write([]byte(filename))
		h.Write([]byte{0})
		h.Write([]byte(fmt.Sprintf("%d", chunk.Index)))
		pointID := h.Sum64()

		point := services.QdrantPoint{
			ID:     pointID,
			Vector: vec,
			Payload: map[string]interface{}{
				"text":        chunk.Text,
				"source":      chunk.Source,
				"chunk_index": chunk.Index,
				"word_count":  chunk.WordCount,
			},
		}
		if err := qdrantSvc.UpsertPoints("documents", []services.QdrantPoint{point}); err != nil {
			log.Printf("⚠️ [QDRANT] Upsert failed for chunk %d: %v", chunk.Index, err)
		}
	}
	log.Printf("✅ [QDRANT] Finished indexing %s", filename)
}
