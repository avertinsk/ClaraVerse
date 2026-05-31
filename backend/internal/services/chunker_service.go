package services

import (
	"math"
	"strings"
)

const (
	ChunkTargetTokens = 256
	ChunkOverlap      = 25
)

type DocumentChunk struct {
	Text     string `json:"text"`
	Index    int    `json:"chunk_index"`
	Source   string `json:"source"`
	Page     int    `json:"page,omitempty"`
	WordCount int   `json:"word_count"`
}

func approximateTokens(text string) int {
	words := len(strings.Fields(text))
	return int(math.Ceil(float64(words) * 1.3))
}

func ChunkDocument(text, source string) []DocumentChunk {
	words := strings.Fields(text)
	if len(words) == 0 {
		return nil
	}

	var chunks []DocumentChunk
	chunkSize := wordsPerChunk(words)
	overlapSize := int(math.Round(float64(chunkSize) * float64(ChunkOverlap) / float64(ChunkTargetTokens)))
	if overlapSize < 1 {
		overlapSize = 1
	}

	start := 0
	index := 0
	for start < len(words) {
		end := start + chunkSize
		if end > len(words) {
			end = len(words)
		}

		chunkWords := words[start:end]
		chunkText := strings.Join(chunkWords, " ")
		chunks = append(chunks, DocumentChunk{
			Text:      chunkText,
			Index:     index,
			Source:    source,
			WordCount: len(chunkWords),
		})
		index++

		if end >= len(words) {
			break
		}

		start = end - overlapSize
		if start >= len(words) {
			break
		}
	}

	return chunks
}

func wordsPerChunk(words []string) int {
	if len(words) == 0 {
		return ChunkTargetTokens
	}
	targetWords := int(math.Round(float64(ChunkTargetTokens) / 1.3))
	if targetWords < 1 {
		targetWords = 1
	}
	return targetWords
}
