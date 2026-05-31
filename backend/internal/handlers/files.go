package handlers

import (
	"log"
	"time"

	"claraverse/internal/filecache"
	"claraverse/internal/models"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type FilesHandler struct {
	jobColl    *mongo.Collection
	fileCache  *filecache.Service
	secureFile *SecureDownloadHandler
}

func NewFilesHandler(db *mongo.Database, fileCache *filecache.Service, secureFile *SecureDownloadHandler) *FilesHandler {
	return &FilesHandler{
		jobColl:    db.Collection("document_processing_jobs"),
		fileCache:  fileCache,
		secureFile: secureFile,
	}
}

type FileItem struct {
	FileID         string `json:"fileId"`
	Filename       string `json:"filename"`
	MimeType       string `json:"mimeType"`
	Size           int64  `json:"size"`
	Status         string `json:"status"`
	Error          string `json:"error,omitempty"`
	Source         string `json:"source"` // "document" or "secure"
	ConversationID string `json:"conversationId,omitempty"`
	Indexed        bool   `json:"indexed"`
	ProgressDetail string `json:"progressDetail,omitempty"`
	ProcessedPages int    `json:"processedPages,omitempty"`
	TotalPages     int    `json:"totalPages,omitempty"`
	Preview        string `json:"preview,omitempty"`
	PageCount      int    `json:"pageCount,omitempty"`
	WordCount      int    `json:"wordCount,omitempty"`
	CreatedAt      string `json:"createdAt"`
}

func (h *FilesHandler) ListFiles(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Authentication required"})
	}

	items := make([]FileItem, 0)

	if h.jobColl != nil {
		cursor, err := h.jobColl.Find(c.Context(), bson.M{"userId": userID})
		if err != nil {
			log.Printf("[FILES] Failed to query jobs: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to list files"})
		}
		defer cursor.Close(c.Context())

		for cursor.Next(c.Context()) {
			var job models.DocumentProcessingJob
			if err := cursor.Decode(&job); err != nil {
				continue
			}
			preview := ""
			if f, ok := h.fileCache.Get(job.FileID); ok && f.ExtractedText != nil {
				s := f.ExtractedText.String()
				if len(s) > 200 {
					preview = s[:200]
				} else {
					preview = s
				}
			}
			items = append(items, FileItem{
				FileID:         job.FileID,
				Filename:       job.Filename,
				MimeType:       job.MimeType,
				Size:           job.Size,
				Status:         job.Status,
				Error:          job.Error,
				Indexed:        job.Indexed,
				ProgressDetail: job.ProgressDetail,
				ProcessedPages: job.ProcessedPages,
				TotalPages:     job.TotalPages,
				Source:         "document",
				ConversationID: job.ConversationID,
				Preview:        preview,
				CreatedAt:      job.CreatedAt.Format(time.RFC3339),
			})
		}
	}

	if h.secureFile != nil {
		secureFiles := h.secureFile.secureFileService.ListUserFiles(userID)
		for _, f := range secureFiles {
			items = append(items, FileItem{
				FileID:    f.ID,
				Filename:  f.Filename,
				MimeType:  f.MimeType,
				Size:      f.Size,
				Status:    "available",
				Source:    "secure",
				CreatedAt: f.CreatedAt.Format(time.RFC3339),
			})
		}
	}

	return c.JSON(fiber.Map{"files": items, "count": len(items)})
}

// GetFileStatus returns the current processing status for a document file.
// GET /api/files/:id/status
func (h *FilesHandler) GetFileStatus(c *fiber.Ctx) error {
	fileID := c.Params("id")
	if fileID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "file_id required"})
	}

	if f, ok := h.fileCache.Get(fileID); ok {
		preview := ""
		if f.ExtractedText != nil {
			s := f.ExtractedText.String()
			if len(s) > 200 {
				preview = s[:200]
			} else {
				preview = s
			}
		}
		return c.JSON(fiber.Map{
			"fileId":    fileID,
			"status":    f.ProcessingStatus,
			"preview":   preview,
			"pageCount": f.PageCount,
			"wordCount": f.WordCount,
		})
	}

	if h.jobColl != nil {
		var job models.DocumentProcessingJob
		err := h.jobColl.FindOne(c.Context(), bson.M{"fileId": fileID}).Decode(&job)
		if err == nil {
			return c.JSON(fiber.Map{
				"fileId": job.FileID,
				"status": job.Status,
				"error":  job.Error,
			})
		}
	}

	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "file not found"})
}

// KnowledgeBaseDocument represents a document in the knowledge base.
type KnowledgeBaseDocument struct {
	FileID    string `json:"fileId"`
	Filename  string `json:"filename"`
	MimeType  string `json:"mimeType"`
	Size      int64  `json:"size"`
	PageCount int    `json:"pageCount"`
	WordCount int    `json:"wordCount"`
	Indexed   bool   `json:"indexed"`
	CreatedAt string `json:"createdAt"`
}

// ListKnowledgeBase returns all completed and indexed documents.
// GET /api/knowledge-base
func (h *FilesHandler) ListKnowledgeBase(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Authentication required"})
	}

	docs := make([]KnowledgeBaseDocument, 0)

	if h.jobColl != nil {
		cursor, err := h.jobColl.Find(c.Context(), bson.M{
			"userId": userID,
			"status": models.DocStatusCompleted,
		})
		if err != nil {
			log.Printf("[KNOWLEDGE-BASE] Failed to query jobs: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to list knowledge base"})
		}
		defer cursor.Close(c.Context())

		for cursor.Next(c.Context()) {
			var job models.DocumentProcessingJob
			if err := cursor.Decode(&job); err != nil {
				continue
			}
			// Get pageCount and wordCount from filecache if available
			pageCount := job.TotalPages
			wordCount := 0
			if f, ok := h.fileCache.Get(job.FileID); ok {
				pageCount = f.PageCount
				wordCount = f.WordCount
			}
			docs = append(docs, KnowledgeBaseDocument{
				FileID:    job.FileID,
				Filename:  job.Filename,
				MimeType:  job.MimeType,
				Size:      job.Size,
				PageCount: pageCount,
				WordCount: wordCount,
				Indexed:   job.Indexed,
				CreatedAt: job.CreatedAt.Format(time.RFC3339),
			})
		}
	}

	return c.JSON(fiber.Map{"documents": docs, "count": len(docs)})
}

// DeleteKnowledgeBase removes a document from the knowledge base.
// DELETE /api/knowledge-base/:id
func (h *FilesHandler) DeleteKnowledgeBase(c *fiber.Ctx) error {
	fileID := c.Params("id")
	if fileID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "file_id required"})
	}

	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Authentication required"})
	}

	// Find the job
	var job models.DocumentProcessingJob
	err := h.jobColl.FindOne(c.Context(), bson.M{"fileId": fileID, "userId": userID}).Decode(&job)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Document not found"})
	}

	// Mark as not indexed (removes from knowledge base but keeps file)
	_, err = h.jobColl.UpdateOne(c.Context(), bson.M{"fileId": fileID}, bson.M{
		"$set": bson.M{"indexed": false, "updatedAt": time.Now()},
	})
	if err != nil {
		log.Printf("[KNOWLEDGE-BASE] Failed to update job %s: %v", fileID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to remove from knowledge base"})
	}

	// Update filecache
	if f, ok := h.fileCache.Get(fileID); ok {
		f.Indexed = false
		h.fileCache.Store(f)
	}

	return c.JSON(fiber.Map{"status": "ok"})
}
