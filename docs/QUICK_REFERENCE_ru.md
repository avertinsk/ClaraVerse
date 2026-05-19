# Быстрая справка ClaraVerse

Быстрая справка по распространённым командам, переменным окружения и устранению неполадок.

## Быстрый старт

```bash
# Клонирование и настройка
git clone https://github.com/claraverse-space/ClaraVerseAI.git
cd ClaraVerseAI
cp .env.example .env

# Генерация секретов
echo "ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)" >> .env
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env

# Запуск всего
docker compose up -d

# Доступ
# Фронтенд: http://localhost:5173
# Бэкенд:  http://localhost:3001
# Админ:    admin@localhost / admin
```

---

## Команды Docker

| Команда | Описание |
|---------|----------|
| `docker compose up -d` | Запуск всех сервисов |
| `docker compose up -d --build` | Пересборка и запуск |
| `docker compose down` | Остановка всех сервисов |
| `docker compose down -v` | Остановка и удаление томов |
| `docker compose logs -f backend` | Логи бэкенда в реальном времени |
| `docker compose logs -f frontend` | Логи фронтенда в реальном времени |
| `docker compose restart backend` | Перезапуск только бэкенда |
| `docker compose ps` | Список запущенных сервисов |
| `docker compose exec backend sh` | Shell в бэкенде |

---

## Команды разработки

### Бэкенд (Go)

```bash
cd backend

# Запуск сервера
go run cmd/server/main.go

# Запуск с горячей перезагрузкой (требует air)
air

# Запуск тестов
go test ./...

# Тесты с покрытием
go test -cover ./...

# Сборка бинарника
go build -o bin/server cmd/server/main.go

# Проверка проблем
go vet ./...
go mod tidy
```

### Фронтенд (React)

```bash
cd frontend

# Запуск dev-сервера
npm run dev

# Сборка для продакшна
npm run build

# Предпросмотр продакшн-сборки
npm run preview

# Проверка типов
npm run typecheck

# Линтинг
npm run lint
npm run lint:fix

# Форматирование кода
npm run format
```

### Сервис E2B (Python)

```bash
cd backend/e2b-service

# Создание виртуального окружения
python -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Запуск сервиса
python main.py
```

---

## Переменные окружения

### Обязательные

| Переменная | Описание | Пример |
|------------|----------|--------|
| `ENCRYPTION_MASTER_KEY` | Ключ шифрования данных | `openssl rand -hex 32` |
| `JWT_SECRET` | Секрет подписи JWT | `openssl rand -hex 64` |

### Конфигурация сервера

| Переменная | По умолчанию | Описание |
|------------|-------------|----------|
| `ENVIRONMENT` | `development` | Режим окружения |
| `PORT` | `3001` | Порт бэкенда |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS origins |
| `FRONTEND_URL` | `http://localhost:5173` | URL фронтенда |
| `BACKEND_URL` | `http://localhost:3001` | URL бэкенда |

### База данных

| Переменная | По умолчанию | Описание |
|------------|-------------|----------|
| `MONGODB_URI` | `mongodb://mongodb:27017/claraverse` | Подключение MongoDB |
| `MYSQL_PASSWORD` | `claraverse_pass_2024` | Пароль MySQL |
| `REDIS_URL` | `redis://redis:6379` | Подключение Redis |

### Ограничение частоты

| Переменная | По умолчанию | Описание |
|------------|-------------|----------|
| `RATE_LIMIT_GLOBAL_API` | `200` | Глобальный лимит API/мин |
| `RATE_LIMIT_PUBLIC_READ` | `120` | Публичные эндпоинты/мин |
| `RATE_LIMIT_AUTHENTICATED` | `60` | Auth-запросы/мин |
| `RATE_LIMIT_WEBSOCKET` | `20` | WS-подключения/мин |
| `RATE_LIMIT_IMAGE_PROXY` | `60` | Прокси изображений/мин |

### Аутентификация

| Переменная | По умолчанию | Описание |
|------------|-------------|----------|
| `JWT_ACCESS_TOKEN_EXPIRY` | `15m` | Время жизни access-токена |
| `JWT_REFRESH_TOKEN_EXPIRY` | `168h` | Время жизни refresh-токена (7 дней) |
| `SUPERADMIN_USER_IDS` | (пусто) | ID администраторов через запятую |

### Внешние сервисы

| Переменная | Описание |
|------------|----------|
| `SEARXNG_URLS` | URL экземпляров SearXNG |
| `E2B_API_KEY` | API-ключ E2B (опционально) |
| `COMPOSIO_API_KEY` | Ключ интеграции Composio |

---

## Эндпоинты API — Быстрая справка

### Аутентификация

```bash
# Регистрация
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"User"}'

# Вход
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Получить текущего пользователя
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Агенты

```bash
# Список агентов
curl http://localhost:3001/api/agents \
  -H "Authorization: Bearer <token>"

# Создать агента
curl -X POST http://localhost:3001/api/agents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Мой агент","model":"gpt-4o","tools":["search_web"]}'
```

### Администратор

```bash
# Список пользователей
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <admin_token>"

# Получить аналитику
curl http://localhost:3001/api/admin/analytics/overview \
  -H "Authorization: Bearer <admin_token>"
```

### Проверка работоспособности

```bash
curl http://localhost:3001/health
```

---

## Команды баз данных

### MongoDB

```bash
# Подключение к MongoDB shell
docker exec -it claraverse-mongodb mongosh claraverse

# Распространённые запросы
db.users.find().count()
db.users.findOne({ email: "user@example.com" })
db.agents.find({ user_id: "user_abc123" })
db.executions.find().sort({ created_at: -1 }).limit(10)

# Сделать пользователя администратором
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

### MySQL

```bash
# Подключение к MySQL shell
docker exec -it claraverse-mysql mysql -u claraverse_user -p claraverse

# Распространённые запросы
SELECT * FROM providers;
SELECT * FROM models WHERE visible = 1;
SELECT COUNT(*) FROM models GROUP BY provider_id;
```

### Redis

```bash
# Подключение к Redis CLI
docker exec -it claraverse-redis redis-cli

# Распространённые команды
KEYS *
KEYS "scheduler:*"
GET "key_name"
DEL "key_name"
FLUSHALL  # Очистить всё (осторожно!)
```

---

## Тестирование WebSocket

```bash
# Через websocat
websocat "ws://localhost:3001/ws/chat?token=<access_token>"

# Отправить сообщение
{"type":"chat","payload":{"message":"Привет","model":"gpt-4o"}}
```

---

## Логи и отладка

### Просмотр логов

```bash
# Все сервисы
docker compose logs -f

# Конкретный сервис
docker compose logs -f backend
docker compose logs -f frontend

# Фильтр ошибок
docker compose logs backend 2>&1 | grep -E "ERROR|FATAL"

# События безопасности
docker compose logs backend 2>&1 | grep -E "🚫|⚠️"
```

### Включение режима отладки

```bash
# В .env
LOG_LEVEL=debug
```

---

## Устранение неполадок

### Порт уже используется

```bash
# Найти процесс
lsof -i :3001
lsof -i :5173

# Завершить процесс
kill -9 <PID>
```

### Ошибка подключения к базе данных

```bash
# Проверить контейнеры
docker compose ps

# Проверить логи
docker compose logs mongodb
docker compose logs mysql

# Перезапустить базы данных
docker compose restart mongodb mysql redis
```

### Очистка ограничений частоты

```bash
# Очистить для конкретного пользователя
docker exec -it claraverse-redis redis-cli DEL "ratelimit:user_abc123"

# Очистить все ограничения частоты
docker exec -it claraverse-redis redis-cli KEYS "ratelimit:*" | xargs redis-cli DEL
```

### Полный сброс

```bash
# Остановить и удалить все данные
docker compose down -v

# Удалить кеш сборки
docker builder prune -f

# Чистый старт
docker compose up -d --build
```

### Проблемы с модулями/зависимостями

```bash
# Go
cd backend
go clean -modcache
go mod download
go mod tidy

# Node
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Порты сервисов

| Сервис | Порт | URL |
|--------|------|-----|
| Фронтенд | 5173 (dev) / 80 (docker) | http://localhost:5173 |
| Бэкенд | 3001 | http://localhost:3001 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| MySQL | 3306 | mysql://localhost:3306 |
| Redis | 6379 | redis://localhost:6379 |
| SearXNG | 8080 (внутренний) | - |
| E2B | 8001 (внутренний) | - |

---

## Расположение файлов

| Файл/Каталог | Описание |
|--------------|----------|
| `.env` | Конфигурация окружения |
| `docker-compose.yml` | Оркестрация сервисов |
| `backend/cmd/server/main.go` | Точка входа бэкенда |
| `backend/internal/` | Исходный код бэкенда |
| `backend/migrations/` | Миграции базы данных |
| `frontend/src/` | Исходный код фронтенда |
| `searxng/settings.yml` | Конфигурация SearXNG |

---

## Полезные ссылки

| Ресурс | URL |
|--------|-----|
| GitHub | https://github.com/claraverse-space/ClaraVerseAI |
| Discord | https://discord.com/invite/j633fsrAne |
| Веб-сайт | https://claraverse.space |
| Облачное приложение | https://claraverse.app |

---

## Связанная документация

- [Руководство по архитектуре](ARCHITECTURE_ru.md) — Дизайн системы
- [Справочник API](API_REFERENCE_ru.md) — Полная документация API
- [Руководство разработчика](DEVELOPER_GUIDE_ru.md) — Настройка разработки
- [Руководство по безопасности](FINAL_SECURITY_INSPECTION_ru.md) — Детали безопасности
- [Руководство администратора](ADMIN_GUIDE_ru.md) — Администрирование
