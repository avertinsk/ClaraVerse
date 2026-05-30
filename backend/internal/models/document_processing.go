package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	DocStatusPending    = "pending"
	DocStatusProcessing = "processing"
	DocStatusCompleted  = "completed"
	DocStatusFailed     = "failed"
)

// DocumentProcessingJob tracks async document processing via Docling.
type DocumentProcessingJob struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	FileID         string             `bson:"fileId" json:"fileId"`                     // UUID for filecache lookup
	GridFSFileID   primitive.ObjectID `bson:"gridFsFileId,omitempty" json:"-"`          // raw bytes in GridFS
	UserID         string             `bson:"userId" json:"userId"`
	ConversationID string             `bson:"conversationId" json:"conversationId"`
	Filename       string             `bson:"filename" json:"filename"`
	MimeType       string             `bson:"mimeType" json:"mimeType"`
	Size           int64              `bson:"size" json:"size"`
	Status         string             `bson:"status" json:"status"` // pending → processing → completed / failed
	Error          string             `bson:"error,omitempty" json:"error,omitempty"`
	RetryCount     int                `bson:"retryCount" json:"retryCount"`
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// FileInfo is returned to the frontend for the files list.
type FileInfo struct {
	FileID         string `json:"fileId"`
	Filename       string `json:"filename"`
	MimeType       string `json:"mimeType"`
	Size           int64  `json:"size"`
	Status         string `json:"status"` // processing / completed / failed
	Error          string `json:"error,omitempty"`
	ConversationID string `json:"conversationId,omitempty"`
	Preview        string `json:"preview,omitempty"`
	PageCount      int    `json:"pageCount,omitempty"`
	WordCount      int    `json:"wordCount,omitempty"`
	CreatedAt      string `json:"createdAt"`
}
