package jobs

import (
	"claraverse/internal/database"
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// DocumentCleanupJob finds document processing jobs stuck in "pending" or "processing"
// (e.g., from a server crash or Docling timeout) and marks them as "failed".
type DocumentCleanupJob struct {
	mongoDB    *database.MongoDB
	collection *mongo.Collection
	interval   time.Duration
	maxAge     time.Duration
	lastRun    time.Time
}

func NewDocumentCleanupJob(mongoDB *database.MongoDB, interval, maxAge time.Duration) *DocumentCleanupJob {
	var collection *mongo.Collection
	if mongoDB != nil {
		collection = mongoDB.Database().Collection("document_processing_jobs")
	}
	return &DocumentCleanupJob{
		mongoDB:    mongoDB,
		collection: collection,
		interval:   interval,
		maxAge:     maxAge,
	}
}

func (j *DocumentCleanupJob) Run(ctx context.Context) error {
	j.lastRun = time.Now()

	if j.collection == nil {
		log.Println("⚠️ [DOC-CLEANUP] Skipped: MongoDB not available")
		return nil
	}

	cutoff := time.Now().Add(-j.maxAge)

	filter := bson.M{
		"status": bson.M{"$in": bson.A{"pending", "processing"}},
		"createdAt": bson.M{"$lt": cutoff},
	}

	update := bson.M{
		"$set": bson.M{
			"status":    "failed",
			"error":     "Processing interrupted: server restart or timeout",
			"updatedAt": time.Now(),
		},
	}

	result, err := j.collection.UpdateMany(ctx, filter, update)
	if err != nil {
		log.Printf("❌ [DOC-CLEANUP] Failed to update stuck jobs: %v", err)
		return err
	}

	if result.ModifiedCount > 0 {
		log.Printf("🧹 [DOC-CLEANUP] Cleaned up %d stuck document processing jobs (created before %s)",
			result.ModifiedCount, cutoff.Format(time.RFC3339))
	}

	return nil
}

func (j *DocumentCleanupJob) GetNextRunTime() time.Time {
	if j.lastRun.IsZero() {
		return time.Now().Add(1 * time.Minute)
	}
	return j.lastRun.Add(j.interval)
}
