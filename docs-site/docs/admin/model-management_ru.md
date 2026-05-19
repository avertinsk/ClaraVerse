---
title: Управление моделями
sidebar_label: Управление моделями
sidebar_position: 4
---

# Управление моделями

Настройте, какие ИИ-модели доступны пользователям, через **Панель администратора > Модели**.

## Список моделей

Просмотрите все зарегистрированные модели с их провайдером, возможностями и статусом видимости:

```http
GET /api/admin/models
Authorization: Bearer <access_token>
```

Каждая запись модели включает:

| Поле | Описание |
|-------|-------------|
| `model_id` | Идентификатор модели провайдера (например, `gpt-4o`) |
| `display_name` | Отображаемое имя, показываемое в селекторах моделей |
| `context_length` | Максимальное окно контекста в токенах |
| `supports_tools` | Поддерживает ли модель вызов функций/инструментов |
| `supports_vision` | Принимает ли модель входные изображения |
| `supports_streaming` | Поддерживает ли модель потоковые ответы |
| `visible` | Могут ли пользователи видеть и выбирать эту модель |
| `agents_enabled` | Можно ли использовать эту модель с агентами Nexus |

## Создание модели

Зарегистрируйте модель вручную, когда автополучение не находит её, или когда нужны пользовательские настройки:

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

## Обновление модели

Измените отображаемое имя, видимость, возможности или доступ агентов:

```http
PUT /api/admin/models/by-id?model_id=<modelId>
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "display_name": "GPT-4o (Latest)",
  "visible": true,
  "agents_enabled": false
}
```

## Массовые операции

Обновите несколько моделей одновременно.

**Переключение доступа агентов для нескольких моделей:**

```http
PUT /api/admin/models/bulk/agents-enabled
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "model_ids": [1, 2, 3],
  "agents_enabled": true
}
```

**Переключение видимости для нескольких моделей:**

```http
PUT /api/admin/models/bulk/visibility
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "model_ids": [1, 2, 3],
  "visible": false
}
```

:::warning
Скрытие моделей влияет на всех пользователей немедленно. Сообщите об изменениях перед массовым отключением популярных моделей.
:::

## Псевдонимы моделей

Псевдонимы дают моделям удобные сокращённые имена. Например, псевдоним `sonnet` для `claude-3-5-sonnet-20241022`.

**Список псевдонимов для модели:**

```http
GET /api/admin/models/by-id/aliases?model_id=<modelId>
```

**Создание псевдонима:**

```http
POST /api/admin/models/by-id/aliases?model_id=<modelId>
Content-Type: application/json

{
  "alias": "gpt4",
  "description": "Сокращение для GPT-4o"
}
```

**Удаление псевдонима:**

```http
DELETE /api/admin/models/by-id/aliases?model_id=<modelId>&alias=<alias>
```

**Импорт псевдонимов массово из JSON:**

```http
POST /api/admin/models/import-aliases
Content-Type: application/json

{
  "aliases": [
    { "model_id": "gpt-4o", "alias": "gpt4" },
    { "model_id": "claude-3-5-sonnet-20241022", "alias": "sonnet" }
  ]
}
```

## Тестирование и бенчмаркинг

**Проверка подключения модели** для подтверждения доступности провайдера и ответа модели:

```http
POST /api/admin/models/by-id/test/connection?model_id=<modelId>
Authorization: Bearer <access_token>
```

**Бенчмаркинг модели** для измерения времени отклика и пропускной способности:

```http
POST /api/admin/models/by-id/benchmark?model_id=<modelId>
Authorization: Bearer <access_token>
```

:::tip
Запустите тест подключения после добавления или обновления провайдера, чтобы рано выявить неправильно настроенные API-ключи или URL.
:::
