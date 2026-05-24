package handlers

import (
	"bytes"
	"claraverse/internal/services"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type ServiceMonitoringHandler struct {
	httpClient *http.Client
}

func NewServiceMonitoringHandler() *ServiceMonitoringHandler {
	return &ServiceMonitoringHandler{
		httpClient: &http.Client{},
	}
}

func (h *ServiceMonitoringHandler) getQdrantCollectionInfo() (map[string]interface{}, error) {
	qdrantSvc := services.GetQdrantService()
	if qdrantSvc == nil {
		return nil, fmt.Errorf("qdrant not initialized")
	}
	resp, err := h.httpClient.Get(qdrantSvc.BaseURL() + "/collections/documents")
	if err != nil {
		return nil, fmt.Errorf("qdrant request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	r, ok := result["result"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected qdrant response format")
	}
	return r, nil
}

// GetStatus returns the status of Docling, Qdrant, and Embedding services
// GET /api/admin/service-monitoring
func (h *ServiceMonitoringHandler) GetStatus(c *fiber.Ctx) error {
	doclingSvc := services.GetDoclingService()
	qdrantSvc := services.GetQdrantService()
	embedSvc := services.GetEmbeddingService()

	status := fiber.Map{}

	// Docling
	if doclingSvc != nil {
		doclingAvailable := doclingSvc.IsAvailable()
		status["docling"] = fiber.Map{
			"available": doclingAvailable,
			"status":    map[bool]string{true: "healthy", false: "unavailable"}[doclingAvailable],
		}
	} else {
		status["docling"] = fiber.Map{
			"available": false,
			"status":    "disabled",
		}
	}

	// Qdrant
	if qdrantSvc != nil {
		qdrantAvailable := qdrantSvc.IsAvailable()
		info := fiber.Map{
			"available": qdrantAvailable,
			"status":    map[bool]string{true: "healthy", false: "unavailable"}[qdrantAvailable],
		}
		if qdrantAvailable {
			colInfo, err := h.getQdrantCollectionInfo()
			if err == nil && colInfo != nil {
				pointsCount, _ := colInfo["points_count"].(float64)
				info["points_count"] = int(pointsCount)
				if vecs, ok := colInfo["indexed_vectors_count"].(float64); ok {
					info["indexed_vectors_count"] = int(vecs)
				}
				info["optimizer_status"] = colInfo["optimizer_status"]
			}
		}
		status["qdrant"] = info
	} else {
		status["qdrant"] = fiber.Map{
			"available": false,
			"status":    "disabled",
		}
	}

	// Embedding
	if embedSvc != nil {
		embedAvailable := embedSvc.IsAvailable()
		info := fiber.Map{
			"available": embedAvailable,
			"model":     embedSvc.Model(),
			"status":    map[bool]string{true: "healthy", false: "unavailable"}[embedAvailable],
		}
		status["embedding"] = info
	} else {
		status["embedding"] = fiber.Map{
			"available": false,
			"status":    "disabled",
		}
	}

	return c.JSON(fiber.Map{
		"success":  true,
		"services": status,
	})
}

// ClearRAGIndex deletes all points from the Qdrant documents collection
// POST /api/admin/service-monitoring/rag/clear
func (h *ServiceMonitoringHandler) ClearRAGIndex(c *fiber.Ctx) error {
	qdrantSvc := services.GetQdrantService()
	if qdrantSvc == nil || !qdrantSvc.IsAvailable() {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Qdrant service not available",
		})
	}

	body := []byte(`{"filter": {}}`)
	req, err := http.NewRequest("POST", qdrantSvc.BaseURL()+"/collections/documents/points/delete", bytes.NewReader(body))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	log.Printf("🗑️ [ADMIN] RAG index cleared by admin")
	return c.JSON(fiber.Map{
		"success": true,
		"message": "RAG index cleared successfully",
		"result":  string(respBody),
	})
}
