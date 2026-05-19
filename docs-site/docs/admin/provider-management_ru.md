---
title: Управление провайдерами
sidebar_label: Управление провайдерами
sidebar_position: 3
---

# Управление провайдерами

Провайдеры — это ИИ-сервисы, которые обеспечивают работу ClaraVerse. Управляйте ими через **Панель администратора > Провайдеры**.

## Поддерживаемые типы провайдеров

| Провайдер | Значение type | Требуется API-ключ | Пример базового URL |
|----------|-----------|-----------------|------------------|
| OpenAI | `openai` | Да | `https://api.openai.com/v1` |
| Anthropic | `anthropic` | Да | `https://api.anthropic.com` |
| Google AI | `google` | Да | По умолчанию (endpoint Google) |
| Ollama | `openai` | Нет | `http://localhost:11434/v1` |
| Пользовательский / OpenAI-совместимый | `openai` | Зависит | URL вашего endpoint |

:::tip
Ollama и другие локальные провайдеры используют тип `openai`, потому что они предоставляют OpenAI-совместимый API. Для локальных провайдеров API-ключ не нужен.
:::

## Добавление провайдера

1. Перейдите в **Панель администратора > Провайдеры**.
2. Нажмите **Добавить провайдер**.
3. Заполните детали:

```http
POST /api/admin/providers
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "OpenAI",
  "type": "openai",
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-...",
  "enabled": true
}
```

Для локального экземпляра Ollama:

```json
{
  "name": "Local Ollama",
  "type": "openai",
  "base_url": "http://localhost:11434/v1",
  "api_key": "",
  "enabled": true
}
```

## Обновление провайдера

Измените имя, базовый URL или API-ключ:

```http
PUT /api/admin/providers/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "base_url": "https://new-url.com/v1",
  "enabled": true
}
```

## Включение / отключение провайдеров

Переключайте провайдер вкл/выкл без удаления:

```http
PUT /api/admin/providers/:id/toggle
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "enabled": false
}
```

Отключённые провайдеры скрыты от пользователей. Их модели не будут отображаться в селекторах моделей.

## Получение моделей

После добавления провайдера получите его доступные модели:

```http
POST /api/admin/providers/:providerId/fetch
Authorization: Bearer <access_token>
```

Это запрашивает API провайдера и импортирует обнаруженные модели в ClaraVerse.

## Удаление провайдера

```http
DELETE /api/admin/providers/:id
Authorization: Bearer <access_token>
```

:::warning
Удаление провайдера удаляет все связанные с ним модели. Сначала отключите провайдер и мигрируйте любых агентов или рабочие процессы, которые зависят от его моделей.
:::

## Ключи администратора vs ключи пользователей

- **Ключ администратора** — Настраивается здесь в Панели администратора. Используется всеми пользователями, которые не добавили свой собственный ключ для этого провайдера.
- **Ключ пользователя** — Устанавливается индивидуально пользователями в **Настройки > Провайдеры**. Переопределяет ключ администратора для запросов этого пользователя.

Если ни ключ администратора, ни ключ пользователя не настроены для провайдера, запросы к этому провайдеру завершатся ошибкой.
