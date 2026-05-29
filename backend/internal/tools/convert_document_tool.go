package tools

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

type doclingDocument struct {
	Filename     string `json:"filename"`
	MDContent    string `json:"md_content"`
	JSONContent  *json.RawMessage `json:"json_content"`
	HTMLContent  *string          `json:"html_content"`
	TextContent  *string          `json:"text_content"`
	DocTagsContent *string        `json:"doctags_content"`
}

type doclingResponse struct {
	Document       doclingDocument `json:"document"`
	Status         string          `json:"status"`
	Errors         []string        `json:"errors"`
	ProcessingTime float64         `json:"processing_time"`
}

func NewConvertDocumentTool() *Tool {
	return &Tool{
		Name:        "convert_document",
		DisplayName: "Convert Document",
		Description: "Convert a PDF, DOCX, PPTX, or image file to Markdown or plain text using Docling OCR. Supports scanned documents and images with OCR.",
		Icon:        "FileText",
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"file_path": map[string]interface{}{
					"type":        "string",
					"description": "Relative path of the file within the filesystem sidecar data directory",
				},
				"format": map[string]interface{}{
					"type":        "string",
					"enum":        []string{"markdown", "text"},
					"description": "Output format (default: markdown)",
				},
			},
			"required": []string{"file_path"},
		},
		Execute:  executeConvertDocument,
		Source:   ToolSourceBuiltin,
		Category: "data_sources",
		Keywords: []string{"convert", "ocr", "document", "pdf", "docx", "pptx", "image", "scan", "extract", "text", "markdown"},
	}
}

func executeConvertDocument(args map[string]interface{}) (string, error) {
	filePath, _ := args["file_path"].(string)
	if filePath == "" {
		return "", fmt.Errorf("file_path is required")
	}

	format, _ := args["format"].(string)
	if format == "" {
		format = "markdown"
	}
	var doclingFormat string
	switch format {
	case "markdown":
		doclingFormat = "md"
	case "text":
		doclingFormat = "text"
	default:
		return "", fmt.Errorf("format must be 'markdown' or 'text', got %q", format)
	}

	doclingURL := os.Getenv("DOCLING_URL")
	if doclingURL == "" {
		doclingURL = "http://docling:5001"
	}

	// Read file from filesystem sidecar data directory
	dataDir := os.Getenv("FILESYSTEM_DATA_DIR")
	if dataDir == "" {
		dataDir = "/data"
	}
	fullPath := dataDir + "/" + filePath

	data, err := os.ReadFile(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to read file %s: %w", filePath, err)
	}

	log.Printf("📄 [CONVERT-DOCUMENT] Converting %s (%d bytes) via Docling", filePath, len(data))

	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	part, err := w.CreateFormFile("files", filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err := part.Write(data); err != nil {
		return "", fmt.Errorf("failed to write file data: %w", err)
	}

	_ = w.WriteField("do_ocr", "true")
	_ = w.WriteField("to_formats", doclingFormat)
	_ = w.WriteField("pdf_backend", "dlparse_v2")
	_ = w.WriteField("table_mode", "fast")

	if err := w.Close(); err != nil {
		return "", fmt.Errorf("failed to close multipart writer: %w", err)
	}

	client := &http.Client{Timeout: 300 * time.Second}
	resp, err := client.Post(doclingURL+"/v1/convert/file", w.FormDataContentType(), &b)
	if err != nil {
		return "", fmt.Errorf("docling request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read docling response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("docling returned status %d: %s", resp.StatusCode, string(body))
	}

	var docResp doclingResponse
	if err := json.Unmarshal(body, &docResp); err != nil {
		return "", fmt.Errorf("failed to parse docling response: %w", err)
	}

	if docResp.Status != "success" {
		errMsg := fmt.Sprintf("docling returned status %q", docResp.Status)
		if len(docResp.Errors) > 0 {
			errMsg += fmt.Sprintf(": %v", docResp.Errors)
		}
		return "", fmt.Errorf(errMsg)
	}

	var content string
	switch format {
	case "markdown":
		content = docResp.Document.MDContent
	case "text":
		if docResp.Document.TextContent != nil {
			content = *docResp.Document.TextContent
		}
	}
	if content == "" {
		return "", fmt.Errorf("docling returned empty %s content", format)
	}

	log.Printf("✅ [CONVERT-DOCUMENT] Converted %s: %d chars of %s", filePath, len(content), format)
	return content, nil
}
