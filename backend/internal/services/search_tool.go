package services

import (
	"claraverse/internal/tools"
	"encoding/json"
	"fmt"
	"log"
)

func NewSearchDocumentsTool() *tools.Tool {
	return &tools.Tool{
		Name:        "search_documents",
		DisplayName: "Search Documents",
		Description: "Performs semantic search across uploaded PDF documents. Use this to find relevant content from previously uploaded documents by describing what you're looking for.",
		Icon:        "Search",
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"query": map[string]interface{}{
					"type":        "string",
					"description": "The search query describing what information to find in the documents",
				},
				"limit": map[string]interface{}{
					"type":        "integer",
					"description": "Maximum number of results to return (default 5, max 20)",
					"default":     5,
				},
			},
			"required": []string{"query"},
		},
		Execute:  executeSearchDocuments,
		Source:   tools.ToolSourceBuiltin,
		Category: "data_sources",
		Keywords: []string{"search", "documents", "semantic", "vector", "rag", "find", "query", "pdf", "content"},
	}
}

func executeSearchDocuments(args map[string]interface{}) (string, error) {
	query, ok := args["query"].(string)
	if !ok || query == "" {
		return "", fmt.Errorf("query parameter is required and must be a string")
	}

	limit := 5
	if l, ok := args["limit"].(float64); ok && int(l) > 0 {
		limit = int(l)
		if limit > 20 {
			limit = 20
		}
	}

	embedSvc := GetEmbeddingService()
	qdrantSvc := GetQdrantService()

	if embedSvc == nil || qdrantSvc == nil {
		return "", fmt.Errorf("semantic search is not configured")
	}
	if !embedSvc.IsAvailable() || !qdrantSvc.IsAvailable() {
		return "", fmt.Errorf("semantic search services are not available. Try again later.")
	}

	vec, err := embedSvc.EmbedQuery(query)
	if err != nil {
		log.Printf("❌ [SEARCH-DOCS] Embedding failed: %v", err)
		return "", fmt.Errorf("failed to process search query: %w", err)
	}

	results, err := qdrantSvc.Search("documents", vec, limit)
	if err != nil {
		log.Printf("❌ [SEARCH-DOCS] Search failed: %v", err)
		return "", fmt.Errorf("search failed: %w", err)
	}

	if len(results) == 0 {
		empty, _ := json.Marshal(map[string]interface{}{
			"success": true,
			"results": []interface{}{},
			"message": "No matching documents found. Try a different query.",
		})
		return string(empty), nil
	}

	type searchResult struct {
		Text      string  `json:"text"`
		Source    string  `json:"source"`
		Score     float64 `json:"score"`
		ChunkIdx  int     `json:"chunk_index"`
		WordCount int     `json:"word_count"`
	}

	var hits []searchResult
	for _, r := range results {
		text, _ := r.Payload["text"].(string)
		source, _ := r.Payload["source"].(string)
		chunkIdx, _ := r.Payload["chunk_index"].(float64)
		wordCount, _ := r.Payload["word_count"].(float64)

		log.Printf("🔍 [SEARCH-DOCS] Hit: source=%s score=%.4f chunk=%d", source, r.Score, int(chunkIdx))

		hits = append(hits, searchResult{
			Text:      text,
			Source:    source,
			Score:     r.Score,
			ChunkIdx:  int(chunkIdx),
			WordCount: int(wordCount),
		})
	}

	response := map[string]interface{}{
		"success": true,
		"query":   query,
		"results": hits,
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return "", fmt.Errorf("failed to marshal response: %w", err)
	}

	return string(responseJSON), nil
}

func RegisterSearchTool() {
	registry := tools.GetRegistry()
	_ = registry.Register(NewSearchDocumentsTool())
}
