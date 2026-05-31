package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

var (
	embeddingInstance *EmbeddingService
	embeddingOnce     sync.Once
)

type EmbeddingService struct {
	baseURL    string
	model      string
	httpClient *http.Client
	available  bool
	mu         sync.RWMutex
}

type ollamaEmbedRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type ollamaEmbedResponse struct {
	Embedding []float64 `json:"embedding"`
}

func GetEmbeddingService() *EmbeddingService {
	return embeddingInstance
}

func InitEmbeddingService(baseURL, model string) {
	if baseURL == "" || model == "" {
		log.Println("[EMBED] No Ollama URL or model provided, embedding service disabled")
		return
	}

	embeddingOnce.Do(func() {
		embeddingInstance = &EmbeddingService{
			baseURL: baseURL,
			model:   model,
			httpClient: &http.Client{
				Timeout: 60 * time.Second,
			},
		}

		if err := embeddingInstance.checkHealth(); err != nil {
			log.Printf("[EMBED] Health check failed: %v — embeddings will retry lazily", err)
			return
		}
		log.Printf("[EMBED] Initialized with model=%s at %s", model, baseURL)
	})
}

func (s *EmbeddingService) Embed(text string) ([]float64, error) {
	if s == nil {
		return nil, fmt.Errorf("embedding service not initialized")
	}

	if !s.IsAvailable() {
		if err := s.checkHealth(); err != nil {
			return nil, fmt.Errorf("ollama not available: %w", err)
		}
	}

	reqBody := ollamaEmbedRequest{
		Model:  s.model,
		Prompt: text,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", s.baseURL+"/api/embeddings", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ollama request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ollama returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var embedResp ollamaEmbedResponse
	if err := json.Unmarshal(respBody, &embedResp); err != nil {
		return nil, fmt.Errorf("failed to parse embedding response: %w", err)
	}

	if len(embedResp.Embedding) == 0 {
		return nil, fmt.Errorf("embedding response contained zero-length vector")
	}

	return embedResp.Embedding, nil
}

func (s *EmbeddingService) EmbedQuery(query string) ([]float64, error) {
	return s.Embed("search_query: " + query)
}

func (s *EmbeddingService) EmbedDocument(text string) ([]float64, error) {
	const maxPromptRunes = 2000
	runes := []rune(text)
	if n := len(runes); n > maxPromptRunes {
		runes = runes[:maxPromptRunes]
		text = string(runes)
		log.Printf("[EMBED] Truncated from %d to %d runes", n, maxPromptRunes)
	}
	return s.Embed("search_document: " + text)
}

func (s *EmbeddingService) VectorSize() int {
	switch s.model {
	case "nomic-embed-text:v1.5":
		return 768
	case "nomic-embed-text-v2-moe:latest":
		return 768
	default:
		return 768
	}
}

func (s *EmbeddingService) IsAvailable() bool {
	if s == nil {
		return false
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.available
}

func (s *EmbeddingService) Model() string {
	if s == nil {
		return ""
	}
	return s.model
}

func (s *EmbeddingService) BaseURL() string {
	if s == nil {
		return ""
	}
	return s.baseURL
}

func (s *EmbeddingService) checkHealth() error {
	url := os.Getenv("OLLAMA_BASE_URL")
	if url == "" {
		url = s.baseURL
	}
	resp, err := s.httpClient.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	s.mu.Lock()
	s.available = resp.StatusCode == http.StatusOK
	s.mu.Unlock()

	if !s.available {
		return fmt.Errorf("health check returned status %d", resp.StatusCode)
	}
	return nil
}
