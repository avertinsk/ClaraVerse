package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
)

var (
	qdrantInstance *QdrantService
	qdrantOnce     sync.Once
)

type QdrantService struct {
	baseURL    string
	httpClient *http.Client
	available  bool
	mu         sync.RWMutex
}

type QdrantPoint struct {
	ID      uint64                 `json:"id"`
	Vector  []float64              `json:"vector"`
	Payload map[string]interface{} `json:"payload"`
}

type qdrantSearchResult struct {
	ID      uint64                 `json:"id"`
	Score   float64                `json:"score"`
	Vector  []float64              `json:"vector,omitempty"`
	Payload map[string]interface{} `json:"payload"`
}

type qdrantSearchRequest struct {
	Vector      []float64               `json:"vector"`
	Limit       int                     `json:"limit"`
	WithPayload bool                    `json:"with_payload"`
	WithVector  bool                    `json:"with_vector"`
	Filter      *map[string]interface{} `json:"filter,omitempty"`
}

type qdrantUpsertRequest struct {
	Points []QdrantPoint `json:"points"`
}

type qdrantCreateCollectionRequest struct {
	Vectors qdrantVectorConfig `json:"vectors"`
}

type qdrantVectorConfig struct {
	Size     int    `json:"size"`
	Distance string `json:"distance"`
}

func GetQdrantService() *QdrantService {
	return qdrantInstance
}

func InitQdrantService(baseURL string) {
	if baseURL == "" {
		log.Println("[QDRANT] No base URL provided, Qdrant service disabled")
		return
	}

	qdrantOnce.Do(func() {
		qdrantInstance = &QdrantService{
			baseURL: baseURL,
			httpClient: &http.Client{
				Timeout: 30 * time.Second,
			},
		}

		if err := qdrantInstance.checkHealth(); err != nil {
			log.Printf("[QDRANT] Health check failed: %v — Qdrant will retry lazily", err)
			return
		}
		log.Printf("[QDRANT] Initialized at %s", baseURL)
	})
}

func (s *QdrantService) IsAvailable() bool {
	if s == nil {
		return false
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.available
}

func (s *QdrantService) BaseURL() string {
	if s == nil {
		return ""
	}
	return s.baseURL
}

func (s *QdrantService) EnsureCollection(name string, vectorSize int) error {
	if name == "" {
		return fmt.Errorf("collection name is required")
	}

	getReq, err := http.NewRequest("GET", s.baseURL+"/collections/"+name, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	getResp, err := s.httpClient.Do(getReq)
	if err != nil {
		return fmt.Errorf("qdrant get collection failed: %w", err)
	}
	getResp.Body.Close()
	if getResp.StatusCode == http.StatusOK {
		return nil
	}

	reqBody := qdrantCreateCollectionRequest{
		Vectors: qdrantVectorConfig{
			Size:     vectorSize,
			Distance: "Cosine",
		},
	}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal collection config: %w", err)
	}

	req, err := http.NewRequest("PUT", s.baseURL+"/collections/"+name, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("qdrant collection request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
		return nil
	}

	respBody, _ := io.ReadAll(resp.Body)
	return fmt.Errorf("qdrant create collection returned %d: %s", resp.StatusCode, string(respBody))
}

func (s *QdrantService) UpsertPoints(collection string, points []QdrantPoint) error {
	if !s.IsAvailable() {
		return fmt.Errorf("qdrant not available")
	}
	reqBody := qdrantUpsertRequest{Points: points}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal upsert request: %w", err)
	}

	req, err := http.NewRequest("PUT", s.baseURL+"/collections/"+collection+"/points", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("qdrant upsert failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
		return nil
	}

	respBody, _ := io.ReadAll(resp.Body)
	return fmt.Errorf("qdrant upsert returned %d: %s", resp.StatusCode, string(respBody))
}

func (s *QdrantService) Search(collection string, vector []float64, limit int) ([]qdrantSearchResult, error) {
	if !s.IsAvailable() {
		return nil, fmt.Errorf("qdrant not available")
	}
	reqBody := qdrantSearchRequest{
		Vector:      vector,
		Limit:       limit,
		WithPayload: true,
		WithVector:  false,
	}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal search request: %w", err)
	}

	req, err := http.NewRequest("POST", s.baseURL+"/collections/"+collection+"/points/search", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("qdrant search failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read search response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("qdrant search returned %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Result []qdrantSearchResult `json:"result"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse search results: %w", err)
	}

	return result.Result, nil
}

func (s *QdrantService) SearchWithFilter(collection string, vector []float64, limit int, filter map[string]interface{}) ([]qdrantSearchResult, error) {
	if !s.IsAvailable() {
		return nil, fmt.Errorf("qdrant not available")
	}
	filterCopy := filter
	reqBody := qdrantSearchRequest{
		Vector:      vector,
		Limit:       limit,
		WithPayload: true,
		WithVector:  false,
		Filter:      &filterCopy,
	}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal search request: %w", err)
	}

	req, err := http.NewRequest("POST", s.baseURL+"/collections/"+collection+"/points/search", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("qdrant search failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read search response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("qdrant search returned %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Result []qdrantSearchResult `json:"result"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse search results: %w", err)
	}

	return result.Result, nil
}

type countResponse struct {
	Result struct {
		Count int `json:"count"`
	} `json:"result"`
}

// PointsExistForFile checks if any Qdrant points exist for the given fileID.
func (s *QdrantService) PointsExistForFile(collection, fileID string) (bool, error) {
	body := map[string]interface{}{
		"exact": true,
		"filter": map[string]interface{}{
			"must": []map[string]interface{}{
				{
					"key":   "file_id",
					"match": map[string]interface{}{"value": fileID},
				},
			},
		},
	}
	data, _ := json.Marshal(body)
	resp, err := s.httpClient.Post(s.baseURL+"/collections/"+collection+"/points/count", "application/json", bytes.NewReader(data))
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("qdrant count request failed: %d", resp.StatusCode)
	}
	var result countResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, err
	}
	return result.Result.Count > 0, nil
}

func (s *QdrantService) checkHealth() error {
	resp, err := s.httpClient.Get(s.baseURL + "/healthz")
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
