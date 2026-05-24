package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"claraverse/internal/tools"
)

type sidecarToolDef struct {
	Name        string                 `json:"name"`
	DisplayName string                 `json:"displayName"`
	Description string                 `json:"description"`
	Icon        string                 `json:"icon"`
	Category    string                 `json:"category"`
	Keywords    []string               `json:"keywords"`
	Parameters  map[string]interface{} `json:"parameters"`
}

type sidecarInfo struct {
	URL   string
	Tools []sidecarToolDef
}

type SidecarService struct {
	sidecars []sidecarInfo
	client   *http.Client
	registry *tools.Registry
	mu       sync.RWMutex
}

var (
	globalSidecarService *SidecarService
	sidecarOnce          sync.Once
)

func GetSidecarService() *SidecarService {
	return globalSidecarService
}

func InitSidecarService(registry *tools.Registry) {
	sidecarOnce.Do(func() {
		globalSidecarService = &SidecarService{
			client:   &http.Client{Timeout: 10 * time.Second},
			registry: registry,
		}
		globalSidecarService.discoverSidecars()
	})
}

func (s *SidecarService) discoverSidecars() {
	urlsEnv := os.Getenv("SIDECAR_URLS")
	if urlsEnv == "" {
		log.Printf("ℹ️ [SIDECAR] No sidecars configured (SIDECAR_URLS is empty)")
		return
	}

	urls := strings.Split(urlsEnv, ",")
	for _, u := range urls {
		u = strings.TrimSpace(u)
		if u == "" {
			continue
		}
		info, err := s.fetchSidecarTools(u)
		if err != nil {
			log.Printf("⚠️ [SIDECAR] Failed to fetch tools from %s: %v", u, err)
			continue
		}
		if len(info.Tools) > 0 {
			s.sidecars = append(s.sidecars, info)
			s.registerSidecarTools(info)
			log.Printf("✅ [SIDECAR] Registered %d tools from %s", len(info.Tools), u)
		}
	}
}

func (s *SidecarService) fetchSidecarTools(baseURL string) (sidecarInfo, error) {
	baseURL = strings.TrimRight(baseURL, "/")
	info := sidecarInfo{URL: baseURL}

	resp, err := s.client.Get(baseURL + "/tools")
	if err != nil {
		return info, fmt.Errorf("failed to fetch tools: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return info, fmt.Errorf("failed to read response: %w", err)
	}

	var result struct {
		Tools []sidecarToolDef `json:"tools"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return info, fmt.Errorf("failed to parse tools: %w (body: %s)", err, string(body))
	}

	info.Tools = result.Tools
	return info, nil
}

func (s *SidecarService) registerSidecarTools(info sidecarInfo) {
	for _, t := range info.Tools {
		toolName := t.Name
		baseURL := info.URL

		tool := &tools.Tool{
			Name:        toolName,
			DisplayName: t.DisplayName,
			Description: t.Description,
			Icon:        t.Icon,
			Parameters:  t.Parameters,
			Source:      tools.ToolSourceBuiltin,
			Category:    t.Category,
			Keywords:    t.Keywords,
			Execute: func(args map[string]interface{}) (string, error) {
				return s.executeSidecarTool(baseURL, toolName, args)
			},
		}

		if err := s.registry.Register(tool); err != nil {
			log.Printf("⚠️ [SIDECAR] Failed to register tool %s: %v", toolName, err)
		}
	}
}

func (s *SidecarService) executeSidecarTool(baseURL, toolName string, args map[string]interface{}) (string, error) {
	reqBody := map[string]interface{}{
		"args": args,
	}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	start := time.Now()
	resp, err := s.client.Post(baseURL+"/execute/"+toolName, "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to call sidecar: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read sidecar response: %w", err)
	}

	var result struct {
		Success bool   `json:"success"`
		Result  string `json:"result"`
		Error   string `json:"error"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("invalid sidecar response: %w (body: %s)", err, string(respBody))
	}

	log.Printf("🔧 [SIDECAR] %s executed in %v (success=%v)", toolName, time.Since(start), result.Success)

	if !result.Success {
		return "", fmt.Errorf("%s", result.Error)
	}
	return result.Result, nil
}

func (s *SidecarService) GetSidecarCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.sidecars)
}
