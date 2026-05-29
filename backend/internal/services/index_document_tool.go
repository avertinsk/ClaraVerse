package services

import (
	"claraverse/internal/tools"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"log"
	"strconv"
)

func NewIndexDocumentTool() *tools.Tool {
	return &tools.Tool{
		Name:        "index_document",
		DisplayName: "Index Document",
		Description: "Chunks text, generates embeddings, and indexes into the Qdrant vector database for semantic search. Use this to index a document's content so it can be found later via search_documents.",
		Icon:        "FileInput",
		Source:      tools.ToolSourceBuiltin,
		Category:    "data_sources",
		Keywords:    []string{"index", "vector", "qdrant", "embed", "chunk", "document", "rag", "knowledge"},
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"text": map[string]interface{}{
					"type":        "string",
					"description": "The full document text to index",
				},
				"source": map[string]interface{}{
					"type":        "string",
					"description": "Source name/label for the document (e.g., filename or device name)",
				},
				"device_article": map[string]interface{}{
					"type":        "string",
					"description": "Optional: device article number (e.g., C2000-ASPT) for filtered search",
				},
				"device_type": map[string]interface{}{
					"type":        "string",
					"description": "Optional: device type (e.g., PPKP, izveshatel) for filtered search",
				},
				"section": map[string]interface{}{
					"type":        "string",
					"description": "Optional: document section (e.g., characteristics, wiring, protocol) for filtered search",
				},
				"tags": map[string]interface{}{
					"type":        "array",
					"description": "Optional: tags for filtering",
					"items": map[string]interface{}{
						"type": "string",
					},
				},
			},
			"required": []string{"text", "source"},
		},
		Execute: executeIndexDocument,
	}
}

func executeIndexDocument(args map[string]interface{}) (string, error) {
	text, ok := args["text"].(string)
	if !ok || text == "" {
		return "", fmt.Errorf("text parameter is required and must be a string")
	}
	source, ok := args["source"].(string)
	if !ok || source == "" {
		return "", fmt.Errorf("source parameter is required and must be a string")
	}

	deviceArticle, _ := args["device_article"].(string)
	deviceType, _ := args["device_type"].(string)
	section, _ := args["section"].(string)

	var tags []string
	if rawTags, ok := args["tags"].([]interface{}); ok {
		for _, t := range rawTags {
			if s, ok := t.(string); ok {
				tags = append(tags, s)
			}
		}
	}

	embedSvc := GetEmbeddingService()
	qdrantSvc := GetQdrantService()

	if embedSvc == nil || qdrantSvc == nil {
		return "", fmt.Errorf("embedding or Qdrant service not configured")
	}
	if !embedSvc.IsAvailable() || !qdrantSvc.IsAvailable() {
		return "", fmt.Errorf("embedding or Qdrant services are not available. Try again later.")
	}

	chunks := ChunkDocument(text, source)
	if len(chunks) == 0 {
		return "", fmt.Errorf("document produced no chunks")
	}

	// Ensure the "documents" collection exists
	vectorSize := embedSvc.VectorSize()
	if err := qdrantSvc.EnsureCollection("documents", vectorSize); err != nil {
		log.Printf("⚠️ [INDEX-DOC] EnsureCollection: %v (may already exist)", err)
	}

	// Build metadata payload base
	meta := map[string]interface{}{
		"source": source,
	}
	if deviceArticle != "" {
		meta["device_article"] = deviceArticle
	}
	if deviceType != "" {
		meta["device_type"] = deviceType
	}
	if section != "" {
		meta["section"] = section
	}
	if len(tags) > 0 {
		meta["tags"] = tags
	}

	// Embed and upsert each chunk
	var points []QdrantPoint
	for _, chunk := range chunks {
		vec, err := embedSvc.EmbedDocument(chunk.Text)
		if err != nil {
			log.Printf("⚠️ [INDEX-DOC] Embedding chunk %d failed: %v", chunk.Index, err)
			continue
		}

		id := generatePointID(source, chunk.Index)
		payload := make(map[string]interface{})
		for k, v := range meta {
			payload[k] = v
		}
		payload["text"] = chunk.Text
		payload["chunk_index"] = chunk.Index
		payload["word_count"] = chunk.WordCount

		points = append(points, QdrantPoint{
			ID:      id,
			Vector:  vec,
			Payload: payload,
		})
	}

	if len(points) == 0 {
		return "", fmt.Errorf("no chunks were successfully embedded")
	}

	if err := qdrantSvc.UpsertPoints("documents", points); err != nil {
		return "", fmt.Errorf("failed to index into Qdrant: %w", err)
	}

	result, _ := json.Marshal(map[string]interface{}{
		"success":      true,
		"chunks_count": len(points),
		"source":       source,
	})

	log.Printf("✅ [INDEX-DOC] Indexed %d chunks from '%s'", len(points), source)
	return string(result), nil
}

func generatePointID(source string, chunkIndex int) uint64 {
	h := fnv.New64a()
	h.Write([]byte(source + "\x00" + strconv.Itoa(chunkIndex)))
	return h.Sum64()
}
