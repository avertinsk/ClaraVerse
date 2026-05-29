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
		Description: "Performs semantic search across indexed documents. Optionally filter by device_type, section, or tags. Use this to find relevant content from documents by describing what you're looking for.",
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
				"device_type": map[string]interface{}{
					"type":        "string",
					"description": "Optional: filter by device type (e.g., PPKP, izveshatel, controller)",
				},
				"section": map[string]interface{}{
					"type":        "string",
					"description": "Optional: filter by document section (e.g., characteristics, wiring, protocol, certificate)",
				},
				"tags": map[string]interface{}{
					"type":        "array",
					"description": "Optional: filter by tags (any match)",
					"items": map[string]interface{}{
						"type": "string",
					},
				},
			},
			"required": []string{"query"},
		},
		Execute:  executeSearchDocuments,
		Source:   tools.ToolSourceBuiltin,
		Category: "data_sources",
		Keywords: []string{"search", "documents", "semantic", "vector", "rag", "find", "query", "pdf", "content", "bolid"},
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

	// Build optional Qdrant filter
	filter := buildSearchFilter(args)

	var results []qdrantSearchResult
	if filter != nil {
		results, err = qdrantSvc.SearchWithFilter("documents", vec, limit, *filter)
	} else {
		results, err = qdrantSvc.Search("documents", vec, limit)
	}
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

// buildSearchFilter constructs a Qdrant filter from optional search parameters.
// Returns nil if no filters are needed.
func buildSearchFilter(args map[string]interface{}) *map[string]interface{} {
	var must []interface{}

	if dt, ok := args["device_type"].(string); ok && dt != "" {
		must = append(must, map[string]interface{}{
			"key":   "device_type",
			"match": map[string]interface{}{"value": dt},
		})
	}
	if section, ok := args["section"].(string); ok && section != "" {
		must = append(must, map[string]interface{}{
			"key":   "section",
			"match": map[string]interface{}{"value": section},
		})
	}
	if rawTags, ok := args["tags"].([]interface{}); ok && len(rawTags) > 0 {
		var tagStrs []string
		for _, t := range rawTags {
			if s, ok := t.(string); ok {
				tagStrs = append(tagStrs, s)
			}
		}
		if len(tagStrs) > 0 {
			must = append(must, map[string]interface{}{
				"key": "tags",
				"match": map[string]interface{}{
					"any": tagStrs,
				},
			})
		}
	}

	if len(must) == 0 {
		return nil
	}

	filter := map[string]interface{}{
		"must": must,
	}
	return &filter
}

func RegisterSearchTool() {
	registry := tools.GetRegistry()
	_ = registry.Register(NewSearchDocumentsTool())
}
