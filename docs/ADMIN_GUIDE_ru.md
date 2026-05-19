# Руководство администратора ClaraVerse

Полное руководство для системных администраторов, управляющих ClaraVerseAI.

## Получение прав администратора

### Способ 1: Поле роли (Рекомендуется)

Установите роль пользователя на `admin` в MongoDB:

```javascript
// MongoDB shell
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Способ 2: Переменная окружения (Legacy)

Добавьте ID пользователей в `SUPERADMIN_USER_IDS`:

```bash
# .env
SUPERADMIN_USER_IDS=user-id-1,user-id-2,user-id-3
```

### Учётная запись администратора по умолчанию

При первом запуске создаётся администратор по умолчанию:

```
Email: admin@localhost
Пароль: admin
```

**Измените этот пароль сразу после первого входа.**

---

## Доступ к панели администратора

Доступ к панели администратора:
- **Разработка:** http://localhost:5173/admin
- **Продакшн:** https://yourdomain.com/admin

### Проверка статуса администратора

```http
GET /api/admin/me
Authorization: Bearer <access_token>
```

Ответ:
```json
{
  "is_admin": true,
  "user_id": "user_abc123",
  "email": "admin@example.com"
}
```

---

## Управление пользователями

### Список пользователей

```http
GET /api/admin/users?limit=20&offset=0&search=john
Authorization: Bearer <access_token>
```

**Параметры запроса:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `limit` | int | Результатов на страницу (по умолчанию: 20, макс: 100) |
| `offset` | int | Смещение пагинации |
| `search` | string | Поиск по email или имени |
| `tier` | string | Фильтр по тарифу (free, pro, max, enterprise) |
| `sort` | string | Поле сортировки (created_at, email, tier) |

**Ответ:**
```json
{
  "users": [
    {
      "id": "user_abc123",
      "email": "john@example.com",
      "name": "John Doe",
      "tier": "pro",
      "role": "user",
      "created_at": "2024-01-15T10:30:00Z",
      "last_login": "2024-01-20T14:00:00Z",
      "stats": {
        "agents_count": 5,
        "executions_count": 150,
        "storage_used_mb": 250
      }
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### Получить детали пользователя

```http
GET /api/admin/users/:userID
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "john@example.com",
    "name": "John Doe",
    "tier": "pro",
    "role": "user",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "limits": {
    "messages_per_day": 1000,
    "executions_per_day": 100,
    "storage_mb": 5000,
    "retention_days": 365
  },
  "overrides": {
    "messages_per_day": 2000
  },
  "usage": {
    "messages_today": 450,
    "executions_today": 23,
    "storage_used_mb": 250
  }
}
```

### Установить переопределения лимитов пользователя

Переопределить лимиты тарифа для конкретных пользователей:

```http
POST /api/admin/users/:userID/overrides
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "messages_per_day": 2000,
  "executions_per_day": 200,
  "storage_mb": 10000
}
```

### Удалить все переопределения

```http
DELETE /api/admin/users/:userID/overrides
Authorization: Bearer <access_token>
```

---

## Управление провайдерами

### Список провайдеров

```http
GET /api/admin/providers
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "providers": [
    {
      "id": 1,
      "name": "OpenAI",
      "type": "openai",
      "base_url": "https://api.openai.com/v1",
      "api_key_configured": true,
      "enabled": true,
      "models_count": 15
    },
    {
      "id": 2,
      "name": "Anthropic",
      "type": "anthropic",
      "base_url": "https://api.anthropic.com",
      "api_key_configured": true,
      "enabled": true,
      "models_count": 5
    }
  ]
}
```

### Создать провайдера

```http
POST /api/admin/providers
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Локальный Ollama",
  "type": "openai",
  "base_url": "http://localhost:11434/v1",
  "api_key": "",
  "enabled": true
}
```

### Обновить провайдера

```http
PUT /api/admin/providers/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Обновлённое имя",
  "base_url": "https://new-url.com/v1",
  "enabled": true
}
```

### Переключить провайдера

Включить/отключить провайдера:

```http
PUT /api/admin/providers/:id/toggle
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "enabled": false
}
```

### Удалить провайдера

```http
DELETE /api/admin/providers/:id
Authorization: Bearer <access_token>
```

### Получить модели от провайдера

Обнаружить доступные модели из API провайдера:

```http
POST /api/admin/providers/:providerId/fetch
Authorization: Bearer <access_token>
```

---

## Управление моделями

### Список всех моделей

```http
GET /api/admin/models
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "models": [
    {
      "id": 1,
      "provider_id": 1,
      "model_id": "gpt-4o",
      "display_name": "GPT-4o",
      "context_length": 128000,
      "supports_tools": true,
      "supports_vision": true,
      "supports_streaming": true,
      "visible": true,
      "agents_enabled": true,
      "tier": null
    }
  ]
}
```

### Создать модель

```http
POST /api/admin/models
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "provider_id": 1,
  "model_id": "gpt-4o-mini",
  "display_name": "GPT-4o Mini",
  "context_length": 128000,
  "supports_tools": true,
  "supports_vision": true,
  "supports_streaming": true,
  "visible": true,
  "agents_enabled": true
}
```

### Обновить модель

```http
PUT /api/admin/models/:modelId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "display_name": "Обновлённое имя",
  "visible": true,
  "agents_enabled": false
}
```

### Массовое обновление моделей

Включить/отключить агентов для нескольких моделей:

```http
PUT /api/admin/models/bulk/agents-enabled
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "model_ids": [1, 2, 3],
  "agents_enabled": true
}
```

Обновить видимость:

```http
PUT /api/admin/models/bulk/visibility
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "model_ids": [1, 2, 3],
  "visible": false
}
```

### Проверить подключение модели

```http
POST /api/admin/models/:modelId/test/connection
Authorization: Bearer <access_token>
```

### Запустить бенчмарк модели

```http
POST /api/admin/models/:modelId/benchmark
Authorization: Bearer <access_token>
```

---

## Псевдонимы моделей

Псевдонимы позволяют использовать альтернативные имена для моделей.

### Список псевдонимов

```http
GET /api/admin/models/:modelId/aliases
Authorization: Bearer <access_token>
```

### Создать псевдоним

```http
POST /api/admin/models/:modelId/aliases
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "alias": "gpt4",
  "description": "Сокращение для GPT-4o"
}
```

### Удалить псевдоним

```http
DELETE /api/admin/models/:modelId/aliases/:alias
Authorization: Bearer <access_token>
```

### Импорт псевдонимов из JSON

```http
POST /api/admin/models/import-aliases
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "aliases": [
    { "model_id": "gpt-4o", "alias": "gpt4" },
    { "model_id": "claude-3-5-sonnet-20241022", "alias": "sonnet" }
  ]
}
```

---

## Аналитика

### Общая аналитика

```http
GET /api/admin/analytics/overview
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "total_users": 1500,
  "active_users_today": 350,
  "active_users_week": 800,
  "total_agents": 2500,
  "total_executions": 150000,
  "executions_today": 2500,
  "storage_used_gb": 125.5
}
```

### Аналитика провайдеров

```http
GET /api/admin/analytics/providers
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "providers": [
    {
      "provider_id": 1,
      "provider_name": "OpenAI",
      "total_requests": 50000,
      "requests_today": 1500,
      "tokens_used": 25000000,
      "avg_response_time_ms": 850
    }
  ]
}
```

### Аналитика чатов

```http
GET /api/admin/analytics/chats
Authorization: Bearer <access_token>
```

### Аналитика моделей

```http
GET /api/admin/analytics/models
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "models": [
    {
      "model_id": "gpt-4o",
      "total_requests": 25000,
      "requests_today": 800,
      "avg_tokens_per_request": 500,
      "success_rate": 99.5
    }
  ]
}
```

### Аналитика агентов

```http
GET /api/admin/analytics/agents
Authorization: Bearer <access_token>
```

---

## Системные операции

### Проверка работоспособности

```http
GET /health
```

**Ответ:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": "72h15m30s",
  "services": {
    "mysql": "connected",
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

### Системная статистика (Legacy)

```http
GET /api/admin/stats
Authorization: Bearer <access_token>
```

---

## Фоновые задачи

ClaraVerse запускает запланированные задачи обслуживания:

| Задача | Расписание | Описание |
|--------|------------|----------|
| Очистка хранения | Ежедневно 2:00 UTC | Удаление истёкших данных по тарифу |
| Проверка льготного периода | Ежечасно | Обработка понижений тарифа |
| Истечение промо | Ежечасно | Истечение промо-тарифов |

### Мониторинг задач

Проверьте логи бэкенда для выполнения задач:
```
✅ Планировщик фоновых задач запущен
🕐 Фоновые задачи: очистка хранения (ежедневно 2:00), проверка льготного периода (ежечасно)
```

---

## Операции с базой данных

### Коллекции MongoDB

```javascript
// Пользователи
db.users.find({ tier: "pro" }).count()

// Агенты
db.agents.find({ user_id: "user_abc123" })

// Выполнения
db.executions.find({ 
  created_at: { $gte: ISODate("2024-01-01") } 
}).count()

// Очистка старых выполнений
db.executions.deleteMany({ 
  created_at: { $lt: ISODate("2024-01-01") } 
})
```

### Таблицы MySQL

```sql
-- Список провайдеров
SELECT * FROM providers;

-- Список моделей с провайдером
SELECT m.*, p.name as provider_name 
FROM models m 
JOIN providers p ON m.provider_id = p.id;

-- Статистика использования моделей
SELECT model_id, COUNT(*) as usage_count 
FROM model_usage 
GROUP BY model_id 
ORDER BY usage_count DESC;
```

### Ключи Redis

```bash
# Список ключей планировщика
redis-cli KEYS "scheduler:*"

# Проверка каналов pubsub
redis-cli PUBSUB CHANNELS

# Очистить ограничение частоты для пользователя
redis-cli DEL "ratelimit:user_abc123"
```

---

## Устранение неполадок

### Распространённые проблемы

**Пользователи не могут войти:**
1. Проверьте, что JWT_SECRET установлен
2. Проверьте подключение к MongoDB
3. Проверьте, что пользователь существует: `db.users.findOne({ email: "..." })`

**Модели не отображаются:**
1. Проверьте, что провайдер включён
2. Проверьте видимость модели: `visible: true`
3. Проверьте ограничения тарифа

**Ошибки ограничения частоты:**
1. Проверьте переменные окружения RATE_LIMIT_*
2. Очистите ключи ограничения частоты в Redis
3. При необходимости скорректируйте лимиты

**Отключения WebSocket:**
1. Проверьте RATE_LIMIT_WEBSOCKET
2. Проверьте настройки CORS
3. Проверьте подключение Redis pub/sub

### Логи

```bash
# Логи Docker
docker logs claraverse-backend -f

# Фильтр ошибок
docker logs claraverse-backend 2>&1 | grep "ERROR\|FATAL"

# Фильтр событий безопасности
docker logs claraverse-backend 2>&1 | grep "🚫\|⚠️"
```

---

## Безопасность

### Лучшие практики администратора

1. **Используйте надёжные пароли** для учётных записей администраторов
2. **Ограничьте SUPERADMIN_USER_IDS** только необходимыми пользователями
3. **Аудируйте действия администраторов** через логи
4. **Периодически обновляйте секреты**
5. **Мониторьте аналитику** на аномалии

### Чувствительные операции

Эти операции следует использовать с осторожностью:

| Операция | Риск | Смягчение |
|----------|------|-----------|
| Удаление провайдера | Ломает существующих агентов | Сначала отключить, мигрировать |
| Массовое изменение видимости | Скрывает модели от пользователей | Сообщить об изменениях |
| Переопределения лимитов | Может увеличить расходы | Документировать причины |
| Прямой доступ к БД | Повреждение данных | Сначала сделать резервную копию |

---

## Связанная документация

- [Руководство по архитектуре](ARCHITECTURE_ru.md) — Дизайн системы
- [Справочник API](API_REFERENCE_ru.md) — Документация API
- [Руководство разработчика](DEVELOPER_GUIDE_ru.md) — Локальная настройка
- [Руководство по безопасности](FINAL_SECURITY_INSPECTION_ru.md) — Детали безопасности
- [Быстрая справка](QUICK_REFERENCE_ru.md) — Распространённые команды
