# AGENTS.md

## Developer Commands

**Frontend** (run from `frontend/`):
```
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # tsc -b && vite build
npm run lint         # ESLint, zero warnings allowed (--max-warnings=0)
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier write
npm run type-check   # tsc --noEmit
npm run test         # Vitest watch mode
npm run test:run     # Vitest run once
```

**Backend** (run from `backend/`):
```
go run ./cmd/server                    # Start backend → http://localhost:3001
go test ./...                          # Run all tests
go test -v -race -timeout 60s ./...   # Verbose + race detector
./run-tests.sh                         # Structured test runner (all packages)
```

**Docker Compose** (run from repo root):
```
./dev-docker.sh              # Start full dev env with HMR (frontend + backend + infra)
./dev-docker.sh build        # Rebuild and start
./dev-docker.sh down         # Stop all containers
docker compose -f docker-compose.dev.yml up -d   # Infra services only (MySQL, MongoDB, Redis, SearXNG)
```

## Architecture

- **Frontend**: React 19 + TypeScript + Vite 7 in `frontend/`. Entry: `frontend/src/main.tsx`.
- **Backend**: Go 1.25 + Fiber in `backend/`. Entry: `backend/cmd/server/`.
- **Databases**: MySQL (providers/models), MongoDB (conversations/workflows), Redis (job scheduling + WebSocket pub/sub).
- **Infra**: SearXNG for web search. All bundled in Docker Compose.
- **E2B service**: Optional Python code execution in `backend/e2b-service/`.

## Setup Order

1. Copy `.env.example` to `.env` at repo root. Edit required values.
2. Start infra: `docker compose -f docker-compose.dev.yml up -d`
3. Backend: `cd backend && cp .env.example .env && go run ./cmd/server`
4. Frontend (separate terminal): `cd frontend && cp .env.example .env && npm install && npm run dev`

Or use the shortcut: `./dev-docker.sh` (requires `.env` at root).

## Key Conventions

- **Frontend imports**: Use `@/` path alias (maps to `frontend/src/`). Never use relative `../../` chains.
- **Frontend state**: Zustand stores in `frontend/src/store/` with `devtools()` and `persist()` middleware.
- **Frontend API**: Single client in `frontend/src/services/api.ts`. Base URL from `VITE_API_BASE_URL`.
- **Backend structure**: `internal/handlers/` (HTTP/WebSocket), `internal/services/` (business logic), `internal/models/` (data structs), `internal/middleware/` (auth/CORS).
- **Backend hot reload**: Uses Air (`backend/.air.toml`). Binary outputs to `./tmp/main`.
- **Migrations**: SQL files in `backend/migrations/`, mounted to MySQL init in Docker Compose.
- **License**: AGPL-3.0.

## Testing

- **Frontend**: Vitest. Run `npm run test:run` for CI-style single pass. Coverage: `npm run test:coverage`.
- **Backend**: Standard `go test`. Use `./run-tests.sh` for structured output across all packages (database, models, services, handlers, tools, execution, filecache, audio, vision, preflight, integration).
- **Integration tests** require backing services running (MySQL, MongoDB, Redis).

## CI / Build

- Docker image built on push to `main` and tags `v*` via `.github/workflows/docker-build.yml`.
- Published to `ghcr.io/claraverse-space/claraverse` (linux/amd64 + linux/arm64).
- Before committing frontend changes: run `npm run format` then ensure `npm run lint` and `npm run type-check` pass.

## Gotchas

- Vite dev server proxies `/api` to the backend. Do not add a separate CORS proxy.
- `ALLOWED_ORIGINS` in `.env` must include the frontend dev URL (`http://localhost:5173`).
- Backend reads env from `backend/.env` when run locally; Docker Compose reads from root `.env`.
- `ENCRYPTION_MASTER_KEY` must be set and preserved — losing it means losing all encrypted data.
- First registered user becomes admin. Additional superadmins via `SUPERADMIN_USER_IDS` (comma-separated).
- Root `package.json` only holds shared dependencies — do not add frontend deps there.
- **Redis port**: Host port `6380` maps to container port `6379` in `docker-compose.yml` to avoid conflict with host Redis on 6379. TSO compose uses `6380:6380` directly.
- **Docling timeout**: `DOCLING_SERVE_TIMEOUT=600s`. Lazy health check retries `checkHealth()` before falling back.
- **Max limits**: `MaxPDFPages=2000`, `MaxExtractedTextSize=10MB`, `maxPDFSize/maxDocSize=50MB`.

## Document Processing

- **Async flow**: Upload → GridFS (raw bytes) → MongoDB `document_processing_jobs` → `DocumentProcessor` polls every 5s → `ExtractPDFText` (go-pdf, primary) → Docling fallback (OCR/scans, lazy health check) → filecache → Qdrant `"documents"` collection → WS `document_processed` notify
- **Progress**: `DocumentProcessor` sends WS messages at stages: "Начинаю обработку..." → "Извлекаю текст..." → "Индексирую в базу знаний..." → "Готово!". Frontend shows live progress indicator above CommandCenter.
- **Qdrant indexing**: Async goroutine after extraction. Points store `file_id`, `user_id` in payload. MongDB job + filecache flag set to `indexed: true` on success.
- **Knowledge base API**: `GET /api/knowledge-base` (completed+indexed docs), `DELETE /api/knowledge-base/:id` (remove from KB). Frontend Files page has KB toggle mode.
- **WS message fields**: `document_processed` now includes `fileId`, `detail` (ru), `processedPages`, `totalPages`.

## Key Files

- `backend/internal/services/document_processor.go` — `processJob`, `indexAndNotify`, `indexInQdrant`
- `backend/internal/handlers/files.go` — `ListKnowledgeBase`, `DeleteKnowledgeBase`
- `backend/internal/models/websocket.go:94-97` — `Detail`, `ProcessedPages`, `TotalPages` on `ServerMessage`
- `frontend/src/pages/Chat.tsx` — `processingFiles` state, WS progress handler, indicator UI
- `frontend/src/pages/Files.tsx` — KB toggle, progress display, index/unindex actions
- `frontend/src/store/useFileStore.ts` — `updateFileProgress`, `markFileIndexed`

## Language

- All общение с пользователем должно вестись на **русском языке**. Отвечай только по-русски, если пользователь не попросил иначе.
