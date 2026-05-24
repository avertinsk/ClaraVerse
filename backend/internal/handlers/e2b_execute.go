package handlers

import (
	"claraverse/internal/e2b"
	"context"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

type E2BExecuteHandler struct{}

func NewE2BExecuteHandler() *E2BExecuteHandler {
	return &E2BExecuteHandler{}
}

type e2bExecuteRequest struct {
	Code         string   `json:"code"`
	Timeout      int      `json:"timeout,omitempty"`
	Dependencies []string `json:"dependencies,omitempty"`
}

// Execute runs Python code via the local E2B executor
// POST /api/e2b/execute
func (h *E2BExecuteHandler) Execute(c *fiber.Ctx) error {
	var req e2bExecuteRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "code is required",
		})
	}

	if req.Timeout <= 0 || req.Timeout > 300 {
		req.Timeout = 30
	}

	executor := e2b.GetE2BExecutorService()

	if len(req.Dependencies) > 0 {
		ctx, cancel := context.WithTimeout(c.Context(), time.Duration(req.Timeout+60)*time.Second)
		defer cancel()

		advReq := e2b.AdvancedExecuteRequest{
			Code:         req.Code,
			Timeout:      req.Timeout,
			Dependencies: req.Dependencies,
		}
		result, err := executor.ExecuteAdvanced(ctx, advReq)
		if err != nil {
			log.Printf("❌ [E2B] ExecuteAdvanced failed: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.JSON(result)
	}

	ctx, cancel := context.WithTimeout(c.Context(), time.Duration(req.Timeout+30)*time.Second)
	defer cancel()

	result, err := executor.Execute(ctx, req.Code, req.Timeout)
	if err != nil {
		log.Printf("❌ [E2B] Execute failed: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(result)
}
