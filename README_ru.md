<div align="center">

<img src="docs/images/image-banner.png" alt="ClaraVerse - Ваше приватное ИИ-пространство" width="800" />

### **Ваше приватное ИИ-пространство**

*Создано сообществом для сообщества. Приватный ИИ, уважающий вашу свободу.*

<p>

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/claraverse-space/ClaraVerse?style=social)](https://github.com/claraverse-space/ClaraVerse/stargazers)
[![Docker Pulls](https://img.shields.io/docker/pulls/claraverseoss/claraverse?color=blue)](https://hub.docker.com/r/claraverseoss/claraverse)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da?logo=discord&logoColor=white)](https://discord.com/invite/j633fsrAne)

[Веб-сайт](https://claraverse.space) · [Документация](#документация) · [Быстрый старт](#быстрый-старт) · [Сообщество](#сообщество) · [Участие в проекте](#участие-в-проекте)

</p>
</div>

## Что такое ClaraVerse?

ClaraVerse — это приватное ИИ-пространство, объединяющее чат, визуальные рабочие процессы, долгосрочные задачи и интеграцию с Telegram в одном приложении. Поручайте Кларе задачи по исследованию, программированию или автоматизации и отслеживайте всё на доске. Используйте OpenAI, Claude, Gemini или локальные модели, такие как Ollama — с хранением данных в браузере, которое сохраняет конфиденциальность ваших переписок.

Если у вас запущен **Ollama** или **LM Studio**, ClaraVerse автоматически обнаружит их и импортирует все ваши модели — без дополнительной настройки.

---

## Быстрый старт

### Установка одной командой (Linux / macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/claraverse-space/ClaraVerse/main/cli/install.sh | bash && claraverse init
```

### Docker Compose

```bash
git clone https://github.com/claraverse-space/ClaraVerse.git
cd ClaraVerse
docker compose -f docker-compose.production.yml up -d
```

Откройте **http://localhost:3000** — зарегистрируйте свой аккаунт (первый пользователь становится администратором) и начните общение.

> **Запущен Ollama?** ClaraVerse автоматически обнаружит его и импортирует все ваши модели. Настройка не требуется.
> Убедитесь, что Ollama слушает на `0.0.0.0` (установите `OLLAMA_HOST=0.0.0.0` в конфигурации Ollama).

<details>
<summary><b>Docker run (одной командой)</b></summary>

```bash
docker run -d \
  --name claraverse \
  -p 3000:3000 \
  -v claraverse-data:/app/data \
  -v claraverse-uploads:/app/uploads \
  --add-host=host.docker.internal:host-gateway \
  ghcr.io/claraverse-space/claraverse:latest
```

Запускает ClaraVerse в одном контейнере. Для полного стека с MySQL, MongoDB, Redis и SearXNG используйте настройку Docker Compose выше.

</details>

<details>
<summary><b>Расширенная конфигурация</b></summary>

### Требования

- Docker и Docker Compose v2+
- 4 ГБ ОЗУ минимум (8 ГБ рекомендуется)
- Ollama, LM Studio или любой OpenAI-совместимый API

### Переменные окружения

Переопределите значения по умолчанию, создав файл `.env` рядом с `docker-compose.production.yml`:

```bash
# Порт (по умолчанию 3000)
CLARAVERSE_PORT=8080

# Указать собственный URL Ollama или LM Studio
OLLAMA_BASE_URL=http://host.docker.internal:11434
LMSTUDIO_BASE_URL=http://host.docker.internal:1234
```

### Автоматическое обнаружение локального ИИ

ClaraVerse автоматически обнаруживает локальные ИИ-провайдеры, работающие на вашем хосте:

| Провайдер         | URL по умолчанию                      | Что происходит                                    |
| ----------------- | ------------------------------------- | ------------------------------------------------- |
| **Ollama**    | `http://host.docker.internal:11434` | Модели импортированы, провайдер создан, видимость установлена |
| **LM Studio** | `http://host.docker.internal:1234`  | Модели импортированы через OpenAI-совместимый API |

Обнаружение запускается каждые 2 минуты. Когда провайдер переходит в офлайн, он автоматически отключается. Когда возвращается — модели импортируются заново.

**Совет по настройке Ollama:** Ollama по умолчанию использует `127.0.0.1`, который недоступен из Docker-контейнеров. Установите `OLLAMA_HOST=0.0.0.0`:

```bash
# Если используете systemd:
sudo systemctl edit ollama
# Добавьте в раздел [Service]:
# Environment="OLLAMA_HOST=0.0.0.0"
sudo systemctl restart ollama
```

### Устранение неполадок

```bash
# Просмотр логов
docker compose -f docker-compose.production.yml logs -f claraverse

# Перезапуск
docker compose -f docker-compose.production.yml restart

# Полный сброс (удаляет все данные)
docker compose -f docker-compose.production.yml down -v && docker compose -f docker-compose.production.yml up -d
```

</details>

---

## Основные возможности

### Nexus — Ваш ИИ-командный центр

Поручайте Кларе долгосрочные задачи: исследование, программирование, анализ. Отслеживайте всё на Канбан-доске — вы всегда знаете, над чем она работает и почему. Никакого чёрного ящика.

<p align="center">
  <img src="docs/images/nexus.gif" alt="Nexus - Управление ИИ-задачами" width="80%" />
</p>

### Навыки в чате

Клара использует навыки прямо во время разговора — контекстно-зависимые инструменты, которые активируются по мере необходимости. Поиск в интернете, генерация изображений, анализ данных — всё не выходя из чата.

<p align="center">
  <img src="docs/images/skills.png" alt="Навыки в чате" width="80%" />
</p>

### Каналы — Интеграция с Telegram

Общайтесь с Кларой из Telegram, когда вы не в приложении. Настраивайте расписания, которые запускаются по графику и отправляют отчёты на ваш телефон.

<p align="center">
  <img src="docs/images/channels.png" alt="Каналы - Интеграция с Telegram" width="80%" />
</p>

### 150+ интеграций и инструментов из коробки

Slack, GitHub, Jira, Google Sheets, Notion, Discord, Telegram, HubSpot и многие другие — встроены, MCP не требуется. Все интеграции используются совместно в Чате, Рабочих процессах, Nexus и Расписаниях. Подключите один раз — используйте везде.

<p align="center">
  <img src="docs/images/integration.png" alt="150+ интеграций" width="80%" />
</p>

### Интерактивные артефакты

Все ваши творения в одном месте — изображения, графики, игры, приложения и многое другое.

<p align="center">
  <img src="https://github.com/user-attachments/assets/d525fc67-6792-4083-9549-1d6b0e770e9e" width="80%" />
</p>

### ИИ-документы

Встроенные инструменты для PPT, PDF, CSV и многого другого.

<p align="center">
  <img src="https://github.com/user-attachments/assets/ce881510-b7f2-4262-a3c9-f02e7c9e8e1f" width="80%" />
</p>

### Интерактивный чат (Человек в цикле)

ИИ задаёт визуальные вопросы, когда ему нужен ваш ввод.

<p align="center">
  <img src="https://github.com/user-attachments/assets/bbd5444d-2031-4193-ba6a-96ab7c96768d" width="80%" />
</p>

### Рабочие процессы — Визуальная автоматизация

Визуальный конструктор рабочих процессов с параллельным выполнением, планированием и 200+ интеграциями. Опишите, что вам нужно, и позвольте LLM создать автоматизацию за вас.

<p align="center">
  <img src="https://github.com/user-attachments/assets/02154cd3-7adf-43cc-b5e8-0dcbdc9a75af" width="80%" />
</p>

### Планирование, API и автоматизация

Используйте рабочие процессы с вашими веб-приложениями, планируйте ежедневные сообщения, автоматизируйте повторяющиеся задачи.

<p align="center">
  <img src="https://github.com/user-attachments/assets/1858fb39-a61c-4976-9a85-3142fda6269b" width="80%" />
</p>

---

## Ключевые функции

| Функция                             | Описание                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| **Nexus**                     | Поручайте долгосрочные задачи, отслеживайте прогресс на Канбан-доске         |
| **Навыки**                    | Контекстно-зависимые инструменты, активирующиеся во время разговора          |
| **Каналы**                    | Интеграция с Telegram — общайтесь с Кларой с телефона                        |
| **Расписания**                | Запланированные последовательности задач с отчётами через Telegram           |
| **Рабочие процессы**          | Визуальный конструктор с параллельным выполнением, планированием, 200+ интеграциями |
| **150+ интеграций**           | Slack, GitHub, Jira, Notion и другие — общие для Чата, Рабочих процессов, Nexus и Расписаний |
| **Устройства**                | Подключайте все ваши машины — Клара удалённо использует MCP на любом устройстве |
| **Clara Companion**           | Мост локальных MCP-серверов к ClaraVerse через WebSocket с любого устройства |
| **Хранение в браузере**       | Переписки хранятся в IndexedDB — архитектура с нулевым знанием              |
| **Автообнаружение локального ИИ** | Ollama и LM Studio обнаруживаются и импортируются автоматически          |
| **Мультипровайдер**           | OpenAI, Anthropic, Google, Ollama, любая OpenAI-совместимая конечная точка  |
| **MCP Bridge**                | Нативная поддержка Model Context Protocol для бесшовного подключения инструментов |
| **Интерактивные подсказки**   | ИИ задаёт уточняющие вопросы во время разговора с типизированными формами   |
| **Система памяти**            | Клара помнит контекст между разговорами, автоматически архивирует старые записи |
| **BYOK**                      | Используйте свои API-ключи или бесплатные локальные модели                   |

---

## Clara Companion (MCP Bridge)

Подключайте ваши локальные инструменты и файловую систему к ClaraVerse через Clara Companion CLI. Он соединяет локальные MCP-серверы с вашим экземпляром ClaraVerse через WebSocket.

<p align="center">
  <img src="docs/images/claracompanion.png" alt="Clara Companion" width="80%" />
</p>

```bash
# Установка через claraverse CLI
claraverse companion

# Вход (выберите default localhost:3000 или введите URL вашего сервера)
clara_companion login

# Запуск моста
clara_companion
```

Или установите вручную из [GitHub Releases](https://github.com/claraverse-space/ClaraVerse/releases).

---

## Попробовать

| Вариант                                                                    | Описание                                                             |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [**Облако**](https://claraverse.space)                                  | Бесплатная размещённая версия —无需 настройки                        |
| [**Self-Hosted**](#быстрый-старт)                                       | Развёртывание через Docker (этот репозиторий) — полный контроль      |
| [**Десктоп**](https://github.com/claraverse-space/ClaraVerse-Desktop)   | Автономное Electron-приложение для Windows, macOS, Linux             |

---

## Технологический стек

| Слой               | Технологии                                            |
| ------------------ | ----------------------------------------------------- |
| **Фронтенд** | React 19, TypeScript, Vite 7, Tailwind CSS 4, Zustand |
| **Бэкенд**   | Go 1.24, Fiber, WebSocket streaming                   |
| **База данных** | MySQL, MongoDB, Redis (все в Docker Compose)        |
| **Поиск**    | SearXNG (приватный, self-hosted)                      |
| **Аутентификация** | Local JWT с хешированием паролей Argon2id         |

---

## Настройка разработки

Для участников, работающих с кодовой базой:

```bash
# Требования: Go 1.24+, Node.js 20+, Docker

# Клонировать репозиторий
git clone https://github.com/claraverse-space/ClaraVerse.git
cd ClaraVerse

# Запустить вспомогательные сервисы (MySQL, MongoDB, Redis, SearXNG)
docker compose -f docker-compose.dev.yml up -d

# Бэкенд
cd backend
cp .env.example .env
go run cmd/server/main.go

# Фронтенд (отдельный терминал)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Фронтенд доступен на `http://localhost:5173`, бэкенд на `http://localhost:3001`.

См. [CONTRIBUTING.md](CONTRIBUTING.md) для стандартов кодирования и правил PR.

---

## Документация

| Ресурс                                    | Описание                                 |
| ----------------------------------------- | ---------------------------------------- |
| [Архитектура](docs/ARCHITECTURE.md)       | Архитектура системы и проектные решения    |
| [API Reference](docs/API_REFERENCE.md)    | REST и WebSocket API                     |
| [Руководство администратора](docs/ADMIN_GUIDE.md) | Администрирование системы и настройка провайдеров |
| [Руководство разработчика](docs/DEVELOPER_GUIDE.md) | Участие в проекте и локальная разработка |
| [Быстрая справка](docs/QUICK_REFERENCE.md) | Распространённые команды и shortcuts     |

---

## Участие в проекте

1. Форкните репозиторий
2. Создайте ветку функции: `git checkout -b feature/amazing-feature`
3. Внесите изменения и протестируйте
4. Запустите `cd frontend && npm run lint && npm run type-check`
5. Зафиксируйте изменения и откройте Pull Request

**Области, где нужна помощь:**

- Исправление ошибок ([открытые issues](https://github.com/claraverse-space/ClaraVerse/issues))
- Новые интеграции инструментов и провайдеров моделей
- Улучшение документации
- Переводы

См. [CONTRIBUTING.md](CONTRIBUTING.md) для полного руководства.

---

## Сообщество

- [Discord](https://discord.com/invite/j633fsrAne) — Чат и поддержка
- [Twitter/X](https://x.com/claraversehq) — Обновления
- [GitHub Issues](https://github.com/claraverse-space/ClaraVerse/issues) — Отчёты об ошибках
- [GitHub Discussions](https://github.com/claraverse-space/ClaraVerse/discussions) — Запросы функций

---

## Лицензия

**AGPL-3.0** — Бесплатно для использования, модификации и коммерческого хостинга. Модификации должны быть открыты. Подробности в [LICENSE](LICENSE).

---

<div align="center">

**Создано с любовью сообществом ClaraVerse**

[Наверх](#ваше-приватное-иипространство)

## История звёзд

[![Star History Chart](https://api.star-history.com/svg?repos=claraverse-space/ClaraVerse&type=timeline&legend=bottom-right)](https://www.star-history.com/#claraverse-space/ClaraVerse&type=timeline&legend=bottom-right)

</div>
