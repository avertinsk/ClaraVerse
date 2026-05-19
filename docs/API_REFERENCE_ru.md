# Справочник API ClaraVerse

Полная документация REST и WebSocket API для ClaraVerseAI.

## Базовые URL

| Окружение | REST API | WebSocket |
|-----------|----------|-----------|
| Разработка | `http://localhost:3001` | `ws://localhost:3001` |
| Продакшн | `https://api.yourdomain.com` | `wss://api.yourdomain.com` |

## Аутентификация

ClaraVerse использует аутентификацию на основе JWT. Включите токен доступа в запросы:

```
Authorization: Bearer <access_token>
```

Для WebSocket-подключений передайте токен как параметр запроса:
```
ws://localhost:3001/ws/chat?token=<access_token>
```

---

## Эндпоинты аутентификации

### Регистрация

Создать новую учётную запись пользователя.

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Ответ:**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "tier": "free",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

### Вход

Аутентификация и получение токенов.

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Ответ:**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "tier": "pro"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

### Обновление токена

Получить новый токен доступа с помощью refresh-токена.

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

### Выход

Аннулировать refresh-токен.

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Получить текущего пользователя

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "id": "user_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "tier": "pro",
  "preferences": {},
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Эндпоинты агентов

### Список агентов

```http
GET /api/agents
Authorization: Bearer <access_token>
```

**Параметры запроса:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `limit` | int | Результатов на страницу (по умолчанию: 20) |
| `offset` | int | Смещение пагинации |
| `sort` | string | Поле сортировки (created_at, updated_at, name) |

**Ответ:**
```json
{
  "agents": [
    {
      "id": "agent_xyz789",
      "name": "Агент поддержки клиентов",
      "description": "Обрабатывает запросы клиентов",
      "model": "gpt-4o",
      "tools": ["search_web", "send_email"],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-16T14:20:00Z"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

### Создать агента

```http
POST /api/agents
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Мой агент",
  "description": "Описание агента",
  "model": "gpt-4o",
  "system_prompt": "Вы полезный помощник.",
  "tools": ["search_web", "calculate_math"],
  "temperature": 0.7
}
```

### Получить агента

```http
GET /api/agents/:id
Authorization: Bearer <access_token>
```

### Обновить агента

```http
PUT /api/agents/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Обновлённое имя агента",
  "tools": ["search_web", "send_slack"]
}
```

### Удалить агента

```http
DELETE /api/agents/:id
Authorization: Bearer <access_token>
```

### Синхронизировать агента

Загрузить локальный агент на бэкенд.

```http
POST /api/agents/:id/sync
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "agent": { ... },
  "workflow": { ... }
}
```

---

## Эндпоинты рабочих процессов

### Получить рабочий процесс

```http
GET /api/agents/:id/workflow
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "id": "workflow_abc123",
  "agent_id": "agent_xyz789",
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger",
      "position": { "x": 100, "y": 100 },
      "data": { "trigger_type": "manual" }
    },
    {
      "id": "node_2",
      "type": "llm",
      "position": { "x": 300, "y": 100 },
      "data": { "model": "gpt-4o", "prompt": "..." }
    }
  ],
  "edges": [
    { "source": "node_1", "target": "node_2" }
  ],
  "version": 3,
  "updated_at": "2024-01-16T14:20:00Z"
}
```

### Сохранить рабочий процесс

```http
PUT /api/agents/:id/workflow
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "nodes": [...],
  "edges": [...]
}
```

### Сгенерировать рабочий процесс

Генерация рабочего процесса с помощью ИИ из описания.

```http
POST /api/agents/:id/generate-workflow
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "description": "Создать рабочий процесс, который ищет в интернете и суммирует результаты"
}
```

### Список версий рабочего процесса

```http
GET /api/agents/:id/workflow/versions
Authorization: Bearer <access_token>
```

### Восстановить версию рабочего процесса

```http
POST /api/agents/:id/workflow/restore/:version
Authorization: Bearer <access_token>
```

---

## Эндпоинты расписаний

### Создать расписание

```http
POST /api/agents/:id/schedule
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "cron": "0 9 * * *",
  "timezone": "America/New_York",
  "enabled": true,
  "input": { "query": "ежедневные новости" }
}
```

### Получить расписание

```http
GET /api/agents/:id/schedule
Authorization: Bearer <access_token>
```

### Обновить расписание

```http
PUT /api/agents/:id/schedule
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "cron": "0 10 * * MON-FRI",
  "enabled": true
}
```

### Удалить расписание

```http
DELETE /api/agents/:id/schedule
Authorization: Bearer <access_token>
```

### Запустить сейчас

Вручную запустить запланированного агента.

```http
POST /api/agents/:id/schedule/run
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "input": { "override": "value" }
}
```

---

## Эндпоинты выполнений

### Список выполнений (по агенту)

```http
GET /api/agents/:id/executions
Authorization: Bearer <access_token>
```

**Параметры запроса:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `limit` | int | Результатов на страницу (по умолчанию: 20) |
| `offset` | int | Смещение пагинации |
| `status` | string | Фильтр по статусу (pending, running, completed, failed) |

### Список всех выполнений

```http
GET /api/executions
Authorization: Bearer <access_token>
```

### Получить выполнение

```http
GET /api/executions/:id
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "id": "exec_abc123",
  "agent_id": "agent_xyz789",
  "status": "completed",
  "trigger": "schedule",
  "input": { "query": "ежедневные новости" },
  "output": { "summary": "..." },
  "duration_ms": 2500,
  "started_at": "2024-01-16T09:00:00Z",
  "completed_at": "2024-01-16T09:00:02Z",
  "node_results": [...]
}
```

### Получить статистику выполнений

```http
GET /api/agents/:id/executions/stats
Authorization: Bearer <access_token>
```

---

## Эндпоинты памяти

### Список воспоминаний

```http
GET /api/memories
Authorization: Bearer <access_token>
```

**Параметры запроса:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `archived` | bool | Включить архивированные воспоминания |
| `limit` | int | Результатов на страницу |

### Создать воспоминание

```http
POST /api/memories
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Пользователь предпочитает краткие ответы",
  "category": "preference",
  "importance": "high"
}
```

### Получить воспоминание

```http
GET /api/memories/:id
Authorization: Bearer <access_token>
```

### Обновить воспоминание

```http
PUT /api/memories/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Обновлённое содержание воспоминания",
  "importance": "medium"
}
```

### Удалить воспоминание

```http
DELETE /api/memories/:id
Authorization: Bearer <access_token>
```

### Архивировать воспоминание

```http
POST /api/memories/:id/archive
Authorization: Bearer <access_token>
```

### Разархивировать воспоминание

```http
POST /api/memories/:id/unarchive
Authorization: Bearer <access_token>
```

### Получить статистику памяти

```http
GET /api/memories/stats
Authorization: Bearer <access_token>
```

---

## Эндпоинты инструментов

### Список всех инструментов

```http
GET /api/tools
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "tools": [
    {
      "name": "search_web",
      "display_name": "Поиск в интернете",
      "description": "Поиск в интернете через SearXNG",
      "category": "data_sources",
      "icon": "Search",
      "parameters": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "Поисковый запрос" }
        },
        "required": ["query"]
      }
    }
  ]
}
```

### Получить доступные инструменты

Возвращает инструменты, отфильтрованные по настроенным учётным данным пользователя.

```http
GET /api/tools/available
Authorization: Bearer <access_token>
```

### Рекомендовать инструменты

ИИ-рекомендация инструментов на основе описания задачи.

```http
POST /api/tools/recommend
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "task": "Отправлять сводку в Slack каждое утро"
}
```

### Получить реестр инструментов

Возвращает полный реестр инструментов для конструктора рабочих процессов.

```http
GET /api/tools/registry
Authorization: Bearer <access_token>
```

---

## Эндпоинты учётных данных

### Список интеграций

```http
GET /api/integrations
```

**Ответ:**
```json
{
  "integrations": [
    {
      "id": "slack",
      "name": "Slack",
      "description": "Отправка сообщений в каналы Slack",
      "icon": "slack",
      "auth_type": "api_key",
      "fields": [
        { "name": "webhook_url", "type": "string", "required": true }
      ]
    }
  ]
}
```

### Список учётных данных

```http
GET /api/credentials
Authorization: Bearer <access_token>
```

### Создать учётные данные

```http
POST /api/credentials
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "integration_id": "slack",
  "name": "Моё рабочее пространство Slack",
  "credentials": {
    "webhook_url": "https://hooks.slack.com/..."
  }
}
```

### Обновить учётные данные

```http
PUT /api/credentials/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Обновлённое имя",
  "credentials": { ... }
}
```

### Удалить учётные данные

```http
DELETE /api/credentials/:id
Authorization: Bearer <access_token>
```

### Протестировать учётные данные

```http
POST /api/credentials/:id/test
Authorization: Bearer <access_token>
```

---

## Эндпоинты синхронизации чата

Опциональное серверное хранение чата (зашифрованное).

### Синхронизировать все чаты

```http
GET /api/chats/sync
Authorization: Bearer <access_token>
```

### Массовая синхронизация

```http
POST /api/chats/sync
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "chats": [...]
}
```

### Создать/Обновить чат

```http
POST /api/chats
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "id": "chat_local_123",
  "title": "Мой чат",
  "messages": [...],
  "model": "gpt-4o"
}
```

### Получить чат

```http
GET /api/chats/:id
Authorization: Bearer <access_token>
```

### Удалить чат

```http
DELETE /api/chats/:id
Authorization: Bearer <access_token>
```

### Удалить все чаты

Соответствие GDPR — удалить все чаты пользователя.

```http
DELETE /api/chats
Authorization: Bearer <access_token>
```

---

## Эндпоинты API-ключей

Управление API-ключами для внешних триггеров.

### Создать API-ключ

```http
POST /api/keys
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Продакшн-ключ",
  "scopes": ["trigger", "upload"],
  "expires_at": "2025-01-01T00:00:00Z"
}
```

**Ответ:**
```json
{
  "id": "key_abc123",
  "name": "Продакшн-ключ",
  "key": "cv_live_abc123xyz...",
  "scopes": ["trigger", "upload"],
  "created_at": "2024-01-16T10:00:00Z",
  "expires_at": "2025-01-01T00:00:00Z"
}
```

> **Примечание:** Полный ключ показывается только один раз при создании.

### Список API-ключей

```http
GET /api/keys
Authorization: Bearer <access_token>
```

### Отозвать API-ключ

```http
POST /api/keys/:id/revoke
Authorization: Bearer <access_token>
```

### Удалить API-ключ

```http
DELETE /api/keys/:id
Authorization: Bearer <access_token>
```

---

## Эндпоинты триггеров

Внешний API для запуска агентов. Требует аутентификацию API-ключом.

### Запустить агента

```http
POST /api/trigger/:agentId
X-API-Key: cv_live_abc123xyz...
Content-Type: application/json

{
  "input": {
    "message": "Обработать эти данные",
    "data": { ... }
  },
  "webhook_url": "https://your-server.com/webhook"
}
```

**Ответ:**
```json
{
  "execution_id": "exec_xyz789",
  "status": "pending",
  "message": "Выполнение запущено"
}
```

### Получить статус выполнения

```http
GET /api/trigger/status/:executionId
X-API-Key: cv_live_abc123xyz...
```

---

## Эндпоинты загрузки файлов

### Загрузить файл

```http
POST /api/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <binary>
```

**Ответ:**
```json
{
  "id": "file_abc123",
  "filename": "document.pdf",
  "size": 102400,
  "mime_type": "application/pdf",
  "url": "/uploads/file_abc123.pdf",
  "expires_at": "2024-01-17T10:00:00Z"
}
```

### Проверить статус файла

```http
GET /api/upload/:id/status
Authorization: Bearer <access_token>
```

### Удалить загрузку

```http
DELETE /api/upload/:id
Authorization: Bearer <access_token>
```

### Внешняя загрузка

Для загрузки с аутентификацией API-ключом.

```http
POST /api/external/upload
X-API-Key: cv_live_abc123xyz...
Content-Type: multipart/form-data

file: <binary>
```

---

## Эндпоинты администратора

Требуется роль администратора или SUPERADMIN_USER_IDS.

### Получить статус администратора

```http
GET /api/admin/me
Authorization: Bearer <access_token>
```

### Список пользователей

```http
GET /api/admin/users
Authorization: Bearer <access_token>
```

**Параметры запроса:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `limit` | int | Результатов на страницу |
| `offset` | int | Смещение пагинации |
| `search` | string | Поиск по email/имени |
| `tier` | string | Фильтр по тарифу |

### Получить детали пользователя

```http
GET /api/admin/users/:userID
Authorization: Bearer <access_token>
```

### Установить переопределения лимитов

```http
POST /api/admin/users/:userID/overrides
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "messages_per_day": 1000,
  "executions_per_day": 100,
  "storage_mb": 5000
}
```

### Удалить все переопределения

```http
DELETE /api/admin/users/:userID/overrides
Authorization: Bearer <access_token>
```

### Эндпоинты аналитики

```http
GET /api/admin/analytics/overview
GET /api/admin/analytics/providers
GET /api/admin/analytics/chats
GET /api/admin/analytics/models
GET /api/admin/analytics/agents
Authorization: Bearer <access_token>
```

### Управление провайдерами

```http
GET /api/admin/providers
POST /api/admin/providers
PUT /api/admin/providers/:id
DELETE /api/admin/providers/:id
PUT /api/admin/providers/:id/toggle
Authorization: Bearer <access_token>
```

### Управление моделями

```http
GET /api/admin/models
POST /api/admin/models
PUT /api/admin/models/:modelId
DELETE /api/admin/models/:modelId
POST /api/admin/models/:modelId/test/connection
POST /api/admin/models/:modelId/benchmark
Authorization: Bearer <access_token>
```

---

## WebSocket эндпоинты

### WebSocket чата

Потоковый чат в реальном времени.

```
ws://localhost:3001/ws/chat?token=<access_token>
```

**Сообщения Клиент → Сервер:**

```json
{
  "type": "chat",
  "payload": {
    "conversation_id": "conv_123",
    "message": "Привет, как дела?",
    "model": "gpt-4o",
    "tools": ["search_web"],
    "stream": true
  }
}
```

**Сообщения Сервер → Клиент:**

```json
// Потоковый чанк
{
  "type": "stream",
  "payload": {
    "conversation_id": "conv_123",
    "content": "Привет! Я",
    "done": false
  }
}

// Вызов инструмента
{
  "type": "tool_call",
  "payload": {
    "conversation_id": "conv_123",
    "tool": "search_web",
    "arguments": { "query": "погода сегодня" },
    "status": "executing"
  }
}

// Результат инструмента
{
  "type": "tool_result",
  "payload": {
    "conversation_id": "conv_123",
    "tool": "search_web",
    "result": "...",
    "status": "completed"
  }
}

// Поток завершён
{
  "type": "stream",
  "payload": {
    "conversation_id": "conv_123",
    "content": "",
    "done": true,
    "usage": {
      "prompt_tokens": 150,
      "completion_tokens": 200
    }
  }
}

// Ошибка
{
  "type": "error",
  "payload": {
    "conversation_id": "conv_123",
    "error": "Превышен лимит запросов",
    "code": "RATE_LIMIT"
  }
}
```

### WebSocket рабочих процессов

Выполнение рабочих процессов в реальном времени.

```
ws://localhost:3001/ws/workflow?token=<access_token>
```

**Клиент → Сервер:**

```json
{
  "type": "execute",
  "payload": {
    "agent_id": "agent_xyz789",
    "input": { "query": "тест" }
  }
}
```

**Сервер → Клиент:**

```json
// Узел запущен
{
  "type": "node_start",
  "payload": {
    "execution_id": "exec_123",
    "node_id": "node_1",
    "node_type": "llm"
  }
}

// Узел завершён
{
  "type": "node_complete",
  "payload": {
    "execution_id": "exec_123",
    "node_id": "node_1",
    "output": { ... },
    "duration_ms": 1200
  }
}

// Выполнение завершено
{
  "type": "execution_complete",
  "payload": {
    "execution_id": "exec_123",
    "status": "completed",
    "output": { ... },
    "duration_ms": 3500
  }
}
```

### WebSocket MCP

Model Context Protocol bridge.

```
ws://localhost:3001/mcp/connect?token=<access_token>
```

**Клиент → Сервер:**

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Сервер → Клиент:**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [...]
  },
  "id": 1
}
```

---

## Публичные эндпоинты

Эти эндпоинты не требуют аутентификации:

| Эндпоинт | Описание |
|----------|----------|
| `GET /health` | Проверка работоспособности |
| `GET /api/providers` | Список провайдеров |
| `GET /api/models` | Список моделей |
| `GET /api/integrations` | Список интеграций |
| `GET /api/config/recommended-models` | Рекомендуемая конфигурация моделей |
| `GET /api/privacy-policy` | Политика конфиденциальности |
| `GET /api/proxy/image` | Прокси изображений (с ограничением частоты) |

---

## Ответы об ошибках

Все ошибки следуют этому формату:

```json
{
  "error": "Сообщение об ошибке",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

**Распространённые коды ошибок:**

| Код | HTTP статус | Описание |
|-----|-------------|----------|
| `UNAUTHORIZED` | 401 | Токен отсутствует или недействителен |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `NOT_FOUND` | 404 | Ресурс не найден |
| `RATE_LIMIT` | 429 | Слишком много запросов |
| `VALIDATION_ERROR` | 400 | Недействительные данные запроса |
| `INTERNAL_ERROR` | 500 | Ошибка сервера |

---

## Ограничения частоты

| Тип эндпоинта | Лимит по умолчанию | Переменная окружения |
|---------------|-------------------|---------------------|
| Global API | 200/мин | `RATE_LIMIT_GLOBAL_API` |
| Public Read | 120/мин | `RATE_LIMIT_PUBLIC_READ` |
| Authenticated | 60/мин | `RATE_LIMIT_AUTHENTICATED` |
| WebSocket | 20/мин | `RATE_LIMIT_WEBSOCKET` |
| Image Proxy | 60/мин | `RATE_LIMIT_IMAGE_PROXY` |
| Upload | 10/мин | Закодировано |

---

## Связанная документация

- [Руководство по архитектуре](ARCHITECTURE_ru.md) — Дизайн системы
- [Руководство разработчика](DEVELOPER_GUIDE_ru.md) — Локальная настройка
- [Руководство по безопасности](FINAL_SECURITY_INSPECTION_ru.md) — Детали безопасности
- [Руководство администратора](ADMIN_GUIDE_ru.md) — Администрирование
- [Быстрая справка](QUICK_REFERENCE_ru.md) — Распространённые команды
