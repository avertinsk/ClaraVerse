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
