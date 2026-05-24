package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"sync"
	"time"
)

var (
	doclingInstance *DoclingService
	doclingOnce     sync.Once
)

// DoclingResult holds the converted document text from Docling.
type DoclingResult struct {
	Markdown string
	Text     string
	Status   string
}

// DoclingService is a client for the Docling Serve API.
type DoclingService struct {
	baseURL    string
	httpClient *http.Client
	available  bool
	mu         sync.RWMutex
}

// doclingResponse maps the Docling Serve v1 API response for file conversion.
type doclingResponse struct {
	Document *doclingDocument `json:"document"`
	Status   string           `json:"status"`
	Errors   []string         `json:"errors"`
}

type doclingDocument struct {
	Markdown string `json:"md_content"`
	Text     string `json:"text_content"`
}

// GetDoclingService returns the singleton Docling service.
func GetDoclingService() *DoclingService {
	return doclingInstance
}

// InitDoclingService initializes the Docling service with the given base URL.
// If baseURL is empty, the service is disabled.
func InitDoclingService(baseURL string) {
	if baseURL == "" {
		log.Println("[DOCLING] No base URL provided, Docling service disabled")
		return
	}

	doclingOnce.Do(func() {
		doclingInstance = &DoclingService{
			baseURL: baseURL,
			httpClient: &http.Client{
				Timeout: 300 * time.Second,
			},
		}

		// Check availability
		if err := doclingInstance.checkHealth(); err != nil {
			log.Printf("[DOCLING] Health check failed: %v — Docling will be used as fallback only if available", err)
			return
		}
		log.Printf("[DOCLING] Service initialized at %s", baseURL)
	})
}

// ConvertPDF sends a PDF to Docling Serve and returns the extracted text.
// Performs a lazy health check if the service was previously unavailable.
func (s *DoclingService) ConvertPDF(data []byte) (*DoclingResult, error) {
	if s == nil {
		return nil, fmt.Errorf("docling service not initialized")
	}

	// Lazy health check — retry if previously unavailable
	if !s.IsAvailable() {
		if err := s.checkHealth(); err != nil {
			return nil, fmt.Errorf("docling not available: %w", err)
		}
	}

	// Build multipart form
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)

	// Add file
	fw, err := w.CreateFormFile("files", "document.pdf")
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err := fw.Write(data); err != nil {
		return nil, fmt.Errorf("failed to write file data: %w", err)
	}

	// Add options
	_ = w.WriteField("do_ocr", "true")
	_ = w.WriteField("force_ocr", "false")
	_ = w.WriteField("to_formats", "md")
	_ = w.WriteField("to_formats", "text")
	_ = w.WriteField("pdf_backend", "dlparse_v2")
	_ = w.WriteField("table_mode", "fast")

	if err := w.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart form: %w", err)
	}

	// Build request
	req, err := http.NewRequest("POST", s.baseURL+"/v1/convert/file", &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", w.FormDataContentType())

	// Execute
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("docling request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("docling returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var docResp doclingResponse
	if err := json.Unmarshal(body, &docResp); err != nil {
		return nil, fmt.Errorf("failed to parse docling response: %w", err)
	}

	if docResp.Status == "failure" {
		errMsg := "unknown error"
		if len(docResp.Errors) > 0 {
			errMsg = docResp.Errors[0]
		}
		return nil, fmt.Errorf("docling conversion failed: %s", errMsg)
	}

	result := &DoclingResult{
		Markdown: "",
		Text:     "",
		Status:   docResp.Status,
	}

	if docResp.Document != nil {
		result.Markdown = docResp.Document.Markdown
		result.Text = docResp.Document.Text
	}

	return result, nil
}

// IsAvailable returns whether the Docling service is reachable.
func (s *DoclingService) IsAvailable() bool {
	if s == nil {
		return false
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.available
}

// checkHealth pings the Docling health endpoint.
func (s *DoclingService) checkHealth() error {
	resp, err := s.httpClient.Get(s.baseURL + "/health")
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
