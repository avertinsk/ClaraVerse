package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func main() {
	allowedDir := os.Getenv("ALLOWED_DIRECTORY")
	if allowedDir == "" {
		allowedDir = "/data"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "3003"
	}

	absDir, err := filepath.Abs(allowedDir)
	if err != nil {
		log.Fatalf("Invalid ALLOWED_DIRECTORY %q: %v", allowedDir, err)
	}
	if err := os.MkdirAll(absDir, 0755); err != nil {
		log.Fatalf("Cannot create ALLOWED_DIRECTORY %q: %v", absDir, err)
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	mux.HandleFunc("/tools", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"tools": []map[string]interface{}{
				{
					"name":        "filesystem_read",
					"displayName": "Read File",
					"description": "Read the contents of a file from the allowed filesystem directory",
					"icon":        "FileText",
					"category":    "filesystem",
					"keywords":    []string{"read", "file", "cat", "open"},
					"parameters": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"path": map[string]interface{}{
								"type":        "string",
								"description": "Relative path of the file within the allowed directory",
							},
						},
						"required": []string{"path"},
					},
				},
				{
					"name":        "filesystem_write",
					"displayName": "Write File",
					"description": "Write content to a file in the allowed filesystem directory. Creates parent directories if needed.",
					"icon":        "FileEdit",
					"category":    "filesystem",
					"keywords":    []string{"write", "save", "create", "file"},
					"parameters": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"path": map[string]interface{}{
								"type":        "string",
								"description": "Relative path of the file within the allowed directory",
							},
							"content": map[string]interface{}{
								"type":        "string",
								"description": "Text content to write to the file",
							},
						},
						"required": []string{"path", "content"},
					},
				},
				{
					"name":        "filesystem_list",
					"displayName": "List Directory",
					"description": "List files and directories in a directory within the allowed filesystem. Shows name, size, and modification time.",
					"icon":        "FolderOpen",
					"category":    "filesystem",
					"keywords":    []string{"list", "directory", "ls", "dir", "folder", "files"},
					"parameters": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"path": map[string]interface{}{
								"type":        "string",
								"description": "Relative directory path (defaults to root if empty)",
							},
						},
					},
				},
				{
					"name":        "filesystem_search",
					"displayName": "Search Files",
					"description": "Recursively search for files by name pattern (glob) within the allowed directory",
					"icon":        "Search",
					"category":    "filesystem",
					"keywords":    []string{"search", "find", "glob", "pattern"},
					"parameters": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"pattern": map[string]interface{}{
								"type":        "string",
								"description": "Glob pattern (e.g. '*.txt', '**/*.md', 'data/**/*.csv')",
							},
						},
						"required": []string{"pattern"},
					},
				},
				{
					"name":        "filesystem_info",
					"displayName": "File Info",
					"description": "Get metadata about a file or directory: size, modification time, is directory",
					"icon":        "Info",
					"category":    "filesystem",
					"keywords":    []string{"info", "stat", "metadata", "size"},
					"parameters": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"path": map[string]interface{}{
								"type":        "string",
								"description": "Relative path within the allowed directory",
							},
						},
						"required": []string{"path"},
					},
				},
				{
					"name":        "filesystem_delete",
					"displayName": "Delete File",
					"description": "Delete a file or empty directory from the allowed filesystem",
					"icon":        "Trash2",
					"category":    "filesystem",
					"keywords":    []string{"delete", "remove", "rm"},
					"parameters": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"path": map[string]interface{}{
								"type":        "string",
								"description": "Relative path of the file or empty directory to delete",
							},
						},
						"required": []string{"path"},
					},
				},
			},
		})
	})

	mux.HandleFunc("/execute/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		toolName := strings.TrimPrefix(r.URL.Path, "/execute/")
		if toolName == "" {
			http.Error(w, "Missing tool name", http.StatusBadRequest)
			return
		}

		var req struct {
			Args map[string]interface{} `json:"args"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
			return
		}

		result, err := executeTool(toolName, req.Args, absDir)
		resp := map[string]interface{}{"success": err == nil}
		if err != nil {
			resp["error"] = err.Error()
		} else {
			resp["result"] = result
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	log.Printf("📁 MCP Filesystem sidecar starting on :%s (allowed: %s)", port, absDir)
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func safePath(base, rel string) (string, error) {
	if strings.Contains(rel, "..") {
		return "", fmt.Errorf("path traversal not allowed: %s", rel)
	}
	clean := filepath.Clean(rel)
	if strings.HasPrefix(clean, "/") {
		return "", fmt.Errorf("absolute paths not allowed: %s", rel)
	}
	fullPath := filepath.Join(base, clean)
	absPath, err := filepath.Abs(fullPath)
	if err != nil {
		return "", fmt.Errorf("invalid path: %w", err)
	}
	if !strings.HasPrefix(absPath, base) {
		return "", fmt.Errorf("path escapes allowed directory")
	}
	return absPath, nil
}

func executeTool(toolName string, args map[string]interface{}, baseDir string) (string, error) {
	switch toolName {
	case "filesystem_read":
		return executeRead(args, baseDir)
	case "filesystem_write":
		return executeWrite(args, baseDir)
	case "filesystem_list":
		return executeList(args, baseDir)
	case "filesystem_search":
		return executeSearch(args, baseDir)
	case "filesystem_info":
		return executeInfo(args, baseDir)
	case "filesystem_delete":
		return executeDelete(args, baseDir)
	default:
		return "", fmt.Errorf("unknown tool: %s", toolName)
	}
}

func executeRead(args map[string]interface{}, baseDir string) (string, error) {
	relPath, _ := args["path"].(string)
	if relPath == "" {
		return "", fmt.Errorf("path is required")
	}
	fullPath, err := safePath(baseDir, relPath)
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}
	return string(data), nil
}

func executeWrite(args map[string]interface{}, baseDir string) (string, error) {
	relPath, _ := args["path"].(string)
	content, _ := args["content"].(string)
	if relPath == "" {
		return "", fmt.Errorf("path is required")
	}
	fullPath, err := safePath(baseDir, relPath)
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return "", fmt.Errorf("failed to create directories: %w", err)
	}
	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}
	return fmt.Sprintf("Written %d bytes to %s", len(content), relPath), nil
}

type fileEntry struct {
	Name    string `json:"name"`
	Size    int64  `json:"size"`
	IsDir   bool   `json:"is_dir"`
	Mode    string `json:"mode"`
	ModTime string `json:"mod_time"`
}

func executeList(args map[string]interface{}, baseDir string) (string, error) {
	relPath, _ := args["path"].(string)
	targetDir := baseDir
	if relPath != "" {
		var err error
		targetDir, err = safePath(baseDir, relPath)
		if err != nil {
			return "", err
		}
	}
	entries, err := os.ReadDir(targetDir)
	if err != nil {
		return "", fmt.Errorf("failed to list directory: %w", err)
	}
	var files []fileEntry
	for _, e := range entries {
		info, err := e.Info()
		if err != nil {
			continue
		}
		files = append(files, fileEntry{
			Name:    e.Name(),
			Size:    info.Size(),
			IsDir:   e.IsDir(),
			Mode:    info.Mode().String(),
			ModTime: info.ModTime().Format(time.RFC3339),
		})
	}
	relDisplay := relPath
	if relDisplay == "" {
		relDisplay = "."
	}
	result := fmt.Sprintf("📁 %s (%d entries)\n\n", relDisplay, len(files))
	for _, f := range files {
		if f.IsDir {
			result += fmt.Sprintf("📁 %s/\n", f.Name)
		} else {
			result += fmt.Sprintf("📄 %s (%d bytes, %s)\n", f.Name, f.Size, f.ModTime[:10])
		}
	}
	return result, nil
}

func executeSearch(args map[string]interface{}, baseDir string) (string, error) {
	pattern, _ := args["pattern"].(string)
	if pattern == "" {
		return "", fmt.Errorf("pattern is required")
	}
	matches, err := filepath.Glob(filepath.Join(baseDir, pattern))
	if err != nil {
		return "", fmt.Errorf("invalid glob pattern: %w", err)
	}
	if len(matches) == 0 {
		return fmt.Sprintf("No files matching pattern %q", pattern), nil
	}
	var result strings.Builder
	result.WriteString(fmt.Sprintf("Found %d matches for %q:\n\n", len(matches), pattern))
	for _, m := range matches {
		rel, _ := filepath.Rel(baseDir, m)
		info, err := os.Stat(m)
		if err != nil {
			result.WriteString(fmt.Sprintf("  %s\n", rel))
			continue
		}
		if info.IsDir() {
			result.WriteString(fmt.Sprintf("  📁 %s/\n", rel))
		} else {
			result.WriteString(fmt.Sprintf("  📄 %s (%d bytes)\n", rel, info.Size()))
		}
	}
	return result.String(), nil
}

func executeInfo(args map[string]interface{}, baseDir string) (string, error) {
	relPath, _ := args["path"].(string)
	if relPath == "" {
		return "", fmt.Errorf("path is required")
	}
	fullPath, err := safePath(baseDir, relPath)
	if err != nil {
		return "", err
	}
	info, err := os.Stat(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to stat path: %w", err)
	}
	var result strings.Builder
	result.WriteString(fmt.Sprintf("Path: %s\n", relPath))
	result.WriteString(fmt.Sprintf("Size: %d bytes\n", info.Size()))
	result.WriteString(fmt.Sprintf("Is directory: %v\n", info.IsDir()))
	result.WriteString(fmt.Sprintf("Mode: %s\n", info.Mode().String()))
	result.WriteString(fmt.Sprintf("Modified: %s\n", info.ModTime().Format(time.RFC3339)))
	return result.String(), nil
}

func executeDelete(args map[string]interface{}, baseDir string) (string, error) {
	relPath, _ := args["path"].(string)
	if relPath == "" {
		return "", fmt.Errorf("path is required")
	}
	fullPath, err := safePath(baseDir, relPath)
	if err != nil {
		return "", err
	}
	if err := os.RemoveAll(fullPath); err != nil {
		return "", fmt.Errorf("failed to delete: %w", err)
	}
	return fmt.Sprintf("Deleted %s", relPath), nil
}
