---
title: Устранение неполадок
sidebar_label: Устранение неполадок
sidebar_position: 5
---

# Устранение неполадок

## Первые шаги

Прежде чем погружаться в конкретные проблемы, всегда начинайте здесь:

```bash
# Проверьте, какие сервисы запущены и их здоровье
docker compose ps

# Проверьте логи backend (большинство проблем проявляется здесь)
docker compose logs -f backend

# Проверьте все логи сразу
docker compose logs -f
```

Здоровое развёртывание показывает все сервисы как `healthy` в колонке `STATUS` команды `docker compose ps`.

## Сервисы не запускаются

### Backend застрял в «Starting» или «Unhealthy»

Backend зависит от того, что MongoDB, MySQL, Redis и SearXNG все здоровы, прежде чем он запустится. Если любая зависимость не проходит проверку здоровья, backend не запустится.

```bash
# Проверьте, какая зависимость не работает
docker compose ps

# Посмотрите логи неработающего сервиса
docker compose logs mongodb
docker compose logs mysql
docker compose logs redis
docker compose logs searxng
```

**Распространённые причины:**
- MySQL слишком долго запускается при первом старте (выполняются миграции). Подождите 30–60 секунд и проверьте снова.
- Недостаточно памяти на хосте. Одному MySQL нужно до 2 ГБ.

### Фронтенд показывает «Unhealthy»

Фронтенд зависит от того, что backend здоров. Сначала исправьте backend, затем фронтенд последует.

## Проблемы MongoDB

### Отказано в подключении

```
error: failed to connect to MongoDB: connection refused
```

**Решение:**

```bash
# Убедитесь, что MongoDB запущена
docker compose ps mongodb

# Проверьте логи
docker compose logs mongodb

# Перезапустите MongoDB
docker compose restart mongodb
```

Если используете MongoDB Atlas или внешний экземпляр, проверьте `MONGODB_URI` в `.env`:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/claraverse
```

### Диск заполнен

MongoDB перестанет принимать записи, если том закончит место.

```bash
# Проверьте использование тома
docker system df -v | grep mongodb
```

## Проблемы MySQL

### Миграции не запускаются

Миграции MySQL находятся в `./backend/migrations/` и монтируются в `/docker-entrypoint-initdb.d/`. Они запускаются только при **первом старте**, когда том данных пуст.

Если вам нужно перезапустить миграции:

```bash
# Вариант 1: Полный сброс MySQL (деструктивный)
docker compose down
docker volume rm claraverseai_mysql-data-new
docker compose up -d

# Вариант 2: Запуск миграций вручную
docker exec -it claraverse-mysql mysql -u root -p claraverse < backend/migrations/001_init.sql
```

### Ошибка плагина аутентификации

```
Authentication plugin 'caching_sha2_password' cannot be loaded
```

Файл Compose уже устанавливает `--default-authentication-plugin=mysql_native_password`. Если вы видите эту ошибку с внешним экземпляром MySQL, настройте его на использование `mysql_native_password`.

## Проблемы Redis

### Отказано в подключении

```bash
# Проверьте здоровье Redis
docker exec -it claraverse-redis redis-cli ping
# Ожидаемый ответ: PONG

# Перезапустите при необходимости
docker compose restart redis
```

### Достигнут лимит памяти

Redis настроен с лимитом 100 МБ и эвикцией LRU. Если вы видите предупреждения об эвикции, увеличьте лимит в `docker-compose.yml`:

```yaml
command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

## Конфликты портов

Если порт уже используется на хосте:

```bash
# Найдите, что использует порт
lsof -i :3001
lsof -i :80
lsof -i :27017

# Завершите процесс
kill -9 <PID>
```

Или измените порт хоста в `docker-compose.yml`:

```yaml
ports:
  - "8080:80"    # Маппинг фронтенда на 8080 вместо 80
  - "3002:3001"  # Маппинг backend на 3002 вместо 3001
```

## Ошибка WebSocket-подключения

Симптомы: сообщения чата не передаются потоково; интерфейс зависает после отправки сообщения.

1. **Проверьте CORS** — Убедитесь, что `ALLOWED_ORIGINS` включает источник, который использует браузер.
2. **Проверьте URL WebSocket** — `VITE_WS_URL` должен быть доступен из браузера (не внутренний адрес Docker).
3. **Проверьте лимиты скорости** — По умолчанию 20 WebSocket-подключений в минуту. Если превышено, новые подключения отклоняются.
4. **Проверьте обратный прокси** — Если используете Nginx, убедитесь, что заголовки `Upgrade` и `Connection` перенаправляются. См. [Руководство по безопасности](./security.md#4-разместите-обратный-прокси-перед-сервисами).

## Ограничение скорости

Если пользователи unexpectedly ограничены по скорости:

```bash
# Очистить все ключи ограничения скорости
docker exec -it claraverse-redis redis-cli KEYS "ratelimit:*"

# Удалить конкретный ключ
docker exec -it claraverse-redis redis-cli DEL "ratelimit:<key>"
```

Для настройки лимитов измените переменные `RATE_LIMIT_*` в `.env` и перезапустите backend:

```bash
docker compose restart backend
```

## Распространённые сообщения об ошибках

| Ошибка | Причина | Решение |
|-------|-------|-----|
| `ENCRYPTION_MASTER_KEY is not set` | Отсутствует обязательная переменная окружения | Сгенерируйте с `openssl rand -hex 32` и добавьте в `.env` |
| `JWT_SECRET is not set` | Отсутствует обязательная переменная окружения | Сгенерируйте с `openssl rand -hex 64` и добавьте в `.env` |
| `connection refused` (любая БД) | Контейнер базы данных не запущен или не здоров | Запустите `docker compose ps` и проверьте неработающий сервис |
| `CORS error` в консоли браузера | Источник браузера не в `ALLOWED_ORIGINS` | Добавьте источник в `ALLOWED_ORIGINS` в `.env` |
| `too many requests` (429) | Превышен лимит скорости | Подождите или увеличьте значения `RATE_LIMIT_*` |
| `authentication plugin` error (MySQL) | Несоответствие режима аутентификации MySQL | Используйте конфигурацию MySQL по умолчанию из файла Compose |
| `no space left on device` | Том Docker заполнен | Освободите место на диске или очистите неиспользуемые тома: `docker system prune --volumes` |

## Проверка логов

```bash
# Все сервисы
docker compose logs -f

# Один сервис с лимитом строк
docker compose logs -f --tail 100 backend

# Фильтр только ошибок
docker compose logs backend 2>&1 | grep -E "ERROR|FATAL|panic"
```

Вы можете попробовать включить debug-логирование, установив в `.env`:

```
LOG_LEVEL=debug
```

Затем перезапустите backend: `docker compose restart backend`.

:::note
`LOG_LEVEL=debug` может не поддерживаться всеми версиями backend. Если установка этой переменной не даёт эффекта, проверьте логи backend на уровне логирования по умолчанию.
:::

## Полный сброс

Если ничего не помогает, сбросьте всё до чистого состояния:

```bash
# Остановить все сервисы и удалить все тома
docker compose down -v

# Удалить кеш сборки
docker builder prune -f

# Чистый старт
docker compose up -d --build
```

:::caution
`docker compose down -v` удаляет все данные базы данных, загруженные файлы и логи. Сначала создайте резервную копию ваших томов, если у вас есть данные, которые вы хотите сохранить.
:::
