package services

import (
	"bytes"
	"context"
	"fmt"
	"hash/fnv"
	"log"
	"time"

	"claraverse/internal/filecache"
	"claraverse/internal/models"
	"claraverse/internal/security"
	"claraverse/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/gridfs"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	docProcessorTick     = 5 * time.Second
	docProcessorMaxWait  = 30 * time.Minute
	docProcessorMaxRetry = 3
)

// NotifyFunc is called when a document's processing status changes.
type NotifyFunc func(userID, fileID, status, filename, preview, detail string, processedPages, totalPages int)

// DocumentProcessor handles async document processing via Docling.
type DocumentProcessor struct {
	jobColl   *mongo.Collection
	gridFS    *gridfs.Bucket
	docling   *DoclingService
	fileCache *filecache.Service
	notify    NotifyFunc
}

// NewDocumentProcessor creates a new document processor.
func NewDocumentProcessor(
	db *mongo.Database,
	gridFS *gridfs.Bucket,
	docling *DoclingService,
	fileCache *filecache.Service,
	notify NotifyFunc,
) *DocumentProcessor {
	return &DocumentProcessor{
		jobColl:   db.Collection("document_processing_jobs"),
		gridFS:    gridFS,
		docling:   docling,
		fileCache: fileCache,
		notify:    notify,
	}
}

// Start begins the background processing loop.
func (p *DocumentProcessor) Start(ctx context.Context) {
	log.Println("[DOC-PROC] Background document processor started")
	ticker := time.NewTicker(docProcessorTick)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("[DOC-PROC] Shutting down")
			return
		case <-ticker.C:
			p.processPending(ctx)
		}
	}
}

// EnqueueJob uploads raw bytes to GridFS and creates a pending processing job.
// Returns the fileID (cache key) and any error.
func (p *DocumentProcessor) EnqueueJob(ctx context.Context, userID, conversationID, filename, mimeType string, data []byte) (string, error) {
	gridFSFileID, err := p.gridFS.UploadFromStream(filename, bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("gridfs upload: %w", err)
	}

	fileID := primitive.NewObjectID().Hex()
	now := time.Now()
	job := models.DocumentProcessingJob{
		FileID:         fileID,
		GridFSFileID:   gridFSFileID,
		UserID:         userID,
		ConversationID: conversationID,
		Filename:       filename,
		MimeType:       mimeType,
		Size:           int64(len(data)),
		Status:         models.DocStatusPending,
		RetryCount:     0,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if _, err := p.jobColl.InsertOne(ctx, job); err != nil {
		return "", fmt.Errorf("insert job: %w", err)
	}

	// Placeholder in filecache so GetFileChatContext etc. can find it
	p.fileCache.Store(&filecache.CachedFile{
		FileID:           fileID,
		UserID:           userID,
		ConversationID:   conversationID,
		Filename:         filename,
		MimeType:         mimeType,
		Size:             int64(len(data)),
		ProcessingStatus: models.DocStatusPending,
		UploadedAt:       now,
	})

	log.Printf("[DOC-PROC] Enqueued %s: %s (%s, %d bytes)", fileID, filename, mimeType, len(data))
	return fileID, nil
}

func (p *DocumentProcessor) processPending(ctx context.Context) {
	cursor, err := p.jobColl.Find(ctx, bson.M{
		"status": models.DocStatusPending,
	}, options.Find().SetSort(bson.M{"createdAt": 1}).SetLimit(5))
	if err != nil {
		log.Printf("[DOC-PROC] Find error: %v", err)
		return
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var job models.DocumentProcessingJob
		if err := cursor.Decode(&job); err != nil {
			log.Printf("[DOC-PROC] Decode error: %v", err)
			continue
		}
		p.processJob(ctx, &job)
	}

	// Retry jobs stuck in "processing" for > 15 min
	p.retryStuckJobs(ctx)
}

func (p *DocumentProcessor) retryStuckJobs(ctx context.Context) {
	cutoff := time.Now().Add(-docProcessorMaxWait)
	cursor, err := p.jobColl.Find(ctx, bson.M{
		"status":    models.DocStatusProcessing,
		"updatedAt": bson.M{"$lt": cutoff},
	})
	if err != nil {
		return
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var job models.DocumentProcessingJob
		if err := cursor.Decode(&job); err != nil {
			continue
		}
		if job.RetryCount >= docProcessorMaxRetry {
			p.markFailed(ctx, &job, "processing timeout, max retries reached")
			continue
		}
		log.Printf("[DOC-PROC] Retrying stuck job %s (retry %d)", job.FileID, job.RetryCount)
		p.jobColl.UpdateOne(ctx, bson.M{"_id": job.ID}, bson.M{
			"$set": bson.M{"status": models.DocStatusPending, "updatedAt": time.Now()},
			"$inc": bson.M{"retryCount": 1},
		})
	}
}

func (p *DocumentProcessor) processJob(ctx context.Context, job *models.DocumentProcessingJob) {
	now := time.Now()
	p.jobColl.UpdateOne(ctx, bson.M{"_id": job.ID}, bson.M{
		"$set": bson.M{"status": models.DocStatusProcessing, "updatedAt": now},
	})
	p.updateCacheStatus(job.FileID, models.DocStatusProcessing)
	p.notify(job.UserID, job.FileID, "processing", job.Filename, "", "Начинаю обработку...", 0, 0)

	log.Printf("[DOC-PROC] Processing %s: %s (%s)", job.FileID, job.Filename, job.MimeType)

	var text string
	var pageCount, wordCount int
	var procErr error

	p.notify(job.UserID, job.FileID, "processing", job.Filename, "", "Извлекаю текст...", 0, 0)

	switch job.MimeType {
	case "application/pdf":
		text, pageCount, wordCount, procErr = p.processPDF(ctx, job)
	case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		text, pageCount, wordCount, procErr = p.processDOCX(ctx, job)
	case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
		text, pageCount, wordCount, procErr = p.processPPTX(ctx, job)
	default:
		procErr = fmt.Errorf("unsupported mime type: %s", job.MimeType)
	}

	if procErr != nil {
		p.markFailed(ctx, job, procErr.Error())
		p.notify(job.UserID, job.FileID, models.DocStatusFailed, job.Filename, "", procErr.Error(), 0, 0)
		return
	}

	preview := utils.GetPDFPreview(text, 200)
	totalPages := pageCount

	cachedFile := &filecache.CachedFile{
		FileID:           job.FileID,
		UserID:           job.UserID,
		ConversationID:   job.ConversationID,
		ExtractedText:    security.NewSecureString(text),
		Filename:         job.Filename,
		MimeType:         job.MimeType,
		Size:             job.Size,
		PageCount:        pageCount,
		WordCount:        wordCount,
		TotalPages:       totalPages,
		ProcessedPages:   totalPages,
		ProgressDetail:   "Извлечение завершено",
		ProcessingStatus: models.DocStatusCompleted,
		UploadedAt:       time.Now(),
	}
	p.fileCache.Store(cachedFile)

	p.jobColl.UpdateOne(ctx, bson.M{"_id": job.ID}, bson.M{
		"$set": bson.M{"status": models.DocStatusCompleted, "totalPages": totalPages, "processedPages": totalPages, "progressDetail": "Извлечение завершено", "updatedAt": time.Now()},
	})

	p.notify(job.UserID, job.FileID, "processing", job.Filename, "", "Индексирую в базу знаний...", totalPages, totalPages)

	p.deleteGridFSFile(job)

	p.indexAndNotify(ctx, job, text, preview, cachedFile)

	log.Printf("[DOC-PROC] Completed %s: %s (%d words)", job.FileID, job.Filename, wordCount)
}

func (p *DocumentProcessor) indexAndNotify(ctx context.Context, job *models.DocumentProcessingJob, text, preview string, cachedFile *filecache.CachedFile) {
	p.indexInQdrant(text, job.Filename, job.FileID, job.UserID, cachedFile)

	p.notify(job.UserID, job.FileID, models.DocStatusCompleted, job.Filename, preview, "Готово!", cachedFile.ProcessedPages, cachedFile.TotalPages)
}

func (p *DocumentProcessor) processPDF(ctx context.Context, job *models.DocumentProcessingJob) (string, int, int, error) {
	data, err := p.readGridFS(&job.GridFSFileID)
	if err != nil {
		return "", 0, 0, fmt.Errorf("read gridfs: %w", err)
	}

	meta, err := utils.ExtractPDFText(data)
	if err == nil && meta.WordCount >= 50 {
		return meta.Text, meta.PageCount, meta.WordCount, nil
	}

	if p.docling == nil || !p.docling.IsAvailable() {
		if p.docling != nil {
			p.docling.checkHealth()
		}
		if p.docling == nil || !p.docling.IsAvailable() {
			if err != nil {
				return "", 0, 0, err
			}
			return meta.Text, meta.PageCount, meta.WordCount, nil
		}
	}

	result, dErr := p.docling.ConvertPDF(data)
	if dErr != nil {
		return "", 0, 0, fmt.Errorf("docling: %w", dErr)
	}
	markdown := result.Markdown
	if markdown == "" {
		markdown = result.Text
	}
	wc := utils.CountWords(markdown)
	return markdown, 1, wc, nil
}

func (p *DocumentProcessor) processDOCX(ctx context.Context, job *models.DocumentProcessingJob) (string, int, int, error) {
	data, err := p.readGridFS(&job.GridFSFileID)
	if err != nil {
		return "", 0, 0, fmt.Errorf("read gridfs: %w", err)
	}
	meta, err := utils.ExtractDOCXText(data)
	if err != nil {
		return "", 0, 0, err
	}
	return meta.Text, meta.PageCount, meta.WordCount, nil
}

func (p *DocumentProcessor) processPPTX(ctx context.Context, job *models.DocumentProcessingJob) (string, int, int, error) {
	data, err := p.readGridFS(&job.GridFSFileID)
	if err != nil {
		return "", 0, 0, fmt.Errorf("read gridfs: %w", err)
	}
	meta, err := utils.ExtractPPTXText(data)
	if err != nil {
		return "", 0, 0, err
	}
	return meta.Text, meta.SlideCount, meta.WordCount, nil
}

func (p *DocumentProcessor) readGridFS(fileID *primitive.ObjectID) ([]byte, error) {
	var buf bytes.Buffer
	_, err := p.gridFS.DownloadToStream(*fileID, &buf)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (p *DocumentProcessor) deleteGridFSFile(job *models.DocumentProcessingJob) {
	if job.GridFSFileID.IsZero() {
		return
	}
	if err := p.gridFS.Delete(job.GridFSFileID); err != nil {
		log.Printf("[DOC-PROC] Failed to delete GridFS file %s: %v", job.GridFSFileID.Hex(), err)
	}
}

func (p *DocumentProcessor) markFailed(ctx context.Context, job *models.DocumentProcessingJob, errMsg string) {
	log.Printf("[DOC-PROC] Failed %s: %s — %s", job.FileID, job.Filename, errMsg)
	p.jobColl.UpdateOne(ctx, bson.M{"_id": job.ID}, bson.M{
		"$set": bson.M{"status": models.DocStatusFailed, "error": errMsg, "updatedAt": time.Now()},
	})
	p.updateCacheStatus(job.FileID, models.DocStatusFailed)
}

func (p *DocumentProcessor) updateCacheStatus(fileID, status string) {
	if f, ok := p.fileCache.Get(fileID); ok {
		f.ProcessingStatus = status
		p.fileCache.Store(f)
	}
}

func (p *DocumentProcessor) indexInQdrant(text, filename, fileID, userID string, cachedFile *filecache.CachedFile) {
	ctx, cancel := context.WithTimeout(context.Background(), 1800*time.Second)
	defer cancel()

	embedSvc := GetEmbeddingService()
	qdrantSvc := GetQdrantService()
	if embedSvc == nil || qdrantSvc == nil || !embedSvc.IsAvailable() || !qdrantSvc.IsAvailable() {
		log.Printf("[DOC-PROC] Skipping Qdrant index — services not ready")
		return
	}

	chunks := ChunkDocument(text, filename)
	if len(chunks) == 0 {
		return
	}

	if err := qdrantSvc.EnsureCollection("documents", embedSvc.VectorSize()); err != nil {
		log.Printf("[DOC-PROC] Failed to create Qdrant collection: %v", err)
		return
	}

	for _, chunk := range chunks {
		select {
		case <-ctx.Done():
			return
		default:
		}

		vec, err := embedSvc.EmbedDocument(chunk.Text)
		if err != nil {
			log.Printf("[DOC-PROC] Embedding failed for chunk %d: %v", chunk.Index, err)
			continue
		}

		h := fnv.New64a()
		h.Write([]byte(filename))
		h.Write([]byte{0})
		h.Write([]byte(fmt.Sprintf("%d", chunk.Index)))
		pointID := h.Sum64()

		point := QdrantPoint{
			ID:     pointID,
			Vector: vec,
			Payload: map[string]interface{}{
				"text":        chunk.Text,
				"source":      chunk.Source,
				"chunk_index": chunk.Index,
				"word_count":  chunk.WordCount,
				"file_id":     fileID,
				"user_id":     userID,
			},
		}

		if err := qdrantSvc.UpsertPoints("documents", []QdrantPoint{point}); err != nil {
			log.Printf("[DOC-PROC] Qdrant upsert failed for chunk %d: %v", chunk.Index, err)
		}
	}

	log.Printf("[DOC-PROC] Indexed %d chunks in Qdrant for %s", len(chunks), filename)

	if cachedFile != nil {
		cachedFile.Indexed = true
		p.fileCache.Store(cachedFile)
	}
	if fileID != "" {
		p.jobColl.UpdateOne(context.Background(), bson.M{"fileId": fileID}, bson.M{
			"$set": bson.M{"indexed": true, "progressDetail": "Проиндексировано", "updatedAt": time.Now()},
		})
	}
}
