---
title: Руководство по Docker Compose
sidebar_label: Docker Compose
sidebar_position: 2
---

# Руководство по Docker Compose

ClaraVerse поставляется с единым `docker-compose.yml`, который запускает все шесть сервисов. Эта страница охватывает каждый сервис, его лимиты ресурсов, тома, проверки здоровья и как кастомизировать развёртывание.

## Быстрый старт

```bash
git clone https://github.com/claraverse-space/ClaraVerse.git
cd ClaraVerse
cp .env.example .env

# Генерация необходимых секретов
echo "ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)" >> .env
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env

# Запуск всех сервисов
docker compose up -d --build
```

Фронтенд доступен по адресу `http://localhost`, а backend API — по `http://localhost:3001`. Первый зарегистрированный пользователь становится администратором.

## Детали сервисов

### Фронтенд

| Настройка | Значение |
|---------|-------|
| Образ | Собирается из `./frontend/Dockerfile` |
| Контейнер | `claraverse-frontend` |
| Порт | `80:80` |
| Зависит от | Backend (healthy) |
| Проверка здоровья | `wget http://127.0.0.1/health` каждые 30с |

Фронтенд — это продакшен-сборка Vite, обслуживаемая Nginx. Аргументы сборки `VITE_API_BASE_URL` и `VITE_WS_URL` встраиваются в бандл при сборке.

### Backend

| Настройка | Значение |
|---------|-------|
| Образ | Собирается из `./backend/Dockerfile` |
| Контейнер | `claraverse-backend` |
| Порт | `3001:3001` |
| Лимит памяти | 1 ГБ |
| Лимит CPU | 2.0 |
| Зависит от | MongoDB, MySQL, Redis, SearXNG (все healthy) |
| Проверка здоровья | `wget http://localhost:3001/health` каждые 30с |

**Тома:**

| Том | Точка монтирования | Назначение |
|--------|-------------|---------|
| `backend-data` | `/app/data` | Постоянные данные приложения |
| `backend-uploads` | `/app/uploads` | Загрузки файлов пользователей |
| `backend-logs` | `/app/logs` | Логи приложения |

### MongoDB

| Настройка | Значение |
|---------|-------|
| Образ | `mongo:7` |
| Контейнер | `claraverse-mongodb` |
| Порт | `27017:27017` |
| Лимит памяти | 1 ГБ |
| Лимит CPU | 1.0 |
| Проверка здоровья | `mongosh --eval "db.adminCommand('ping')"` каждые 30с |

**Том:** `mongodb-data` смонтирован в `/data/db`

### MySQL

| Настройка | Значение |
|---------|-------|
| Образ | `mysql:8.0` |
| Контейнер | `claraverse-mysql` |
| Порт | `3306:3306` |
| Лимит памяти | 2 ГБ |
| Лимит CPU | 1.0 |
| Проверка здоровья | `mysqladmin ping` каждые 10с |
| Набор символов | `utf8mb4` / `utf8mb4_unicode_ci` |

**Тома:**

| Том | Точка монтирования | Назначение |
|--------|-------------|---------|
| `mysql-data-new` | `/var/lib/mysql` | Файлы базы данных |
| `./backend/migrations` | `/docker-entrypoint-initdb.d` (только чтение) | Автоматический запуск миграций при первом старте |

### Redis

| Настройка | Значение |
|---------|-------|
| Образ | `redis:7-alpine` |
| Контейнер | `claraverse-redis` |
| Порт | `6379:6379` |
| Макс. память | 100 МБ (эвикция LRU) |
| Проверка здоровья | `redis-cli ping` каждые 10с |
| Персистентность | AOF (append-only file) |

**Том:** `redis-data` смонтирован в `/data`

### SearXNG

| Настройка | Значение |
|---------|-------|
| Образ | `searxng/searxng:latest` |
| Контейнер | `claraverse-searxng` |
| Порт | Только внутренний (8080) |
| Проверка здоровья | `wget http://localhost:8080/` каждые 30с |
| Конфигурация | `./searxng/settings.yml` смонтирован только для чтения |

SearXNG не доступен на хосте по умолчанию. Backend получает к нему доступ через внутреннюю сеть Docker по адресу `http://searxng:8080`.

## Справочник маппинга портов

| Порт хоста | Контейнер | Сервис |
|-----------|-----------|---------|
| 80 | frontend:80 | Веб-интерфейс (Nginx) |
| 3001 | backend:3001 | API + WebSocket |
| 27017 | mongodb:27017 | MongoDB |
| 3306 | mysql:3306 | MySQL |
| 6379 | redis:6379 | Redis |

Чтобы изменить порт хоста, отредактируйте левую часть маппинга в `docker-compose.yml`:

```yaml
ports:
  - "8080:80"   # Фронтенд на порту 8080 вместо 80
```

## Тома

Все именованные тома используют драйвер `local` по умолчанию:

| Том | Сервис | Назначение |
|--------|---------|---------|
| `backend-data` | Backend | Данные приложения |
| `backend-uploads` | Backend | Загрузки файлов |
| `backend-logs` | Backend | Файлы логов |
| `mongodb-data` | MongoDB | Файлы базы данных |
| `mysql-data-new` | MySQL | Файлы базы данных |
| `redis-data` | Redis | Персистентность AOF |

Для резервного копирования тома:

```bash
docker run --rm -v claraverseai_mongodb-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mongodb-backup.tar.gz -C /data .
```

## Включение сервиса E2B (опционально)

E2B предоставляет песочницу выполнения Python-кода. Для включения:

1. Получите API-ключ на [e2b.dev/dashboard](https://e2b.dev/dashboard).
2. Установите `E2B_API_KEY` в вашем файле `.env`.
3. Раскомментируйте блок `e2b-service` в `docker-compose.yml`:

```yaml
e2b-service:
  build:
    context: ./backend/e2b-service
    dockerfile: Dockerfile
  container_name: claraverse-e2b
  environment:
    - E2B_API_KEY=${E2B_API_KEY}
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8001/health')"]
    interval: 30s
    timeout: 10s
    start_period: 5s
    retries: 3
  networks:
    - claraverse-network
```

Backend автоматически подключается к `http://e2b-service:8001`.

## Распространённые операции

### Пересборка одного сервиса

```bash
docker compose up -d --build backend
```

### Просмотр логов

```bash
docker compose logs -f backend
docker compose logs -f --tail 100 mysql
```

### Перезапуск всех сервисов

```bash
docker compose restart
```

### Остановка всего

```bash
docker compose down
```

### Сброс всех данных (деструктивный)

```bash
docker compose down -v
docker compose up -d --build
```

### Проверка здоровья сервисов

```bash
docker compose ps
```

Колонка `STATUS` показывает `healthy`, `starting` или `unhealthy` для каждого сервиса.

## Требования к ресурсам

Минимальные рекомендуемые для односерверного развёртывания:

| Ресурс | Минимум | Рекомендуется |
|----------|---------|-------------|
| CPU | 2 ядра | 4 ядра |
| ОЗУ | 4 ГБ | 8 ГБ |
| Диск | 10 ГБ | 20 ГБ+ |

Общие лимиты памяти, настроенные в `docker-compose.yml`, суммируются до ~4 ГБ (MongoDB 1 ГБ + MySQL 2 ГБ + Backend 1 ГБ + Redis 100 МБ). Оставшаяся ОЗУ используется процессом Nginx фронтенда, SearXNG и ОС.
