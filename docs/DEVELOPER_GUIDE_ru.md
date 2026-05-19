# Руководство разработчика ClaraVerse

Полное руководство по настройке локальной среды разработки для ClaraVerseAI.

## Требования

### Необходимое ПО

| ПО | Версия | Назначение |
|----|--------|------------|
| **Go** | 1.24+ | API-сервер бэкенда |
| **Node.js** | 20+ | Разработка фронтенда |
| **Python** | 3.11+ | Сервис выполнения кода E2B |
| **Docker** | Последняя | Сервисы баз данных |
| **tmux** | Последняя | Разработка в нескольких панелях (опционально) |

### Установка

**macOS:**
```bash
# Через Homebrew
brew install go node python@3.11 docker tmux
```

**Ubuntu/Debian:**
```bash
# Go
wget https://go.dev/dl/go1.24.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.24.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# Node.js (через nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20

# Python
sudo apt install python3.11 python3.11-venv

# Docker
sudo apt install docker.io docker-compose-plugin
sudo usermod -aG docker $USER

# tmux
sudo apt install tmux
```

**Windows (рекомендуется WSL2):**
```powershell
# Установите WSL2, затем следуйте инструкциям Ubuntu
wsl --install -d Ubuntu
```

---

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/claraverse-space/ClaraVerseAI.git
cd ClaraVerseAI
```

### 2. Настройка окружения

```bash
# Скопировать файл примеров окружения
cp .env.example .env

# Сгенерировать необходимые секреты
echo "ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)" >> .env
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env
```

### 3. Установка зависимостей

```bash
# Через Makefile (рекомендуется)
make install

# Или вручную:
cd backend && go mod download
cd ../frontend && npm install
cd ../backend/e2b-service && pip install -r requirements.txt
```

### 4. Запуск разработки

**Вариант A: Через dev.sh (tmux)**

```bash
./dev.sh
```

Открывается сессия tmux с 4 панелями:
- Верхний левый: Бэкенд (Go)
- Верхний правый: Фронтенд (React)
- Нижний левый: Сервис E2B (Python)
- Нижний правый: Информационная панель

**Вариант B: Ручной запуск**

```bash
# Терминал 1: Запуск баз данных
docker compose up mongodb mysql redis searxng -d

# Терминал 2: Запуск бэкенда
cd backend
go run cmd/server/main.go

# Терминал 3: Запуск фронтенда
cd frontend
npm run dev

# Терминал 4: Запуск сервиса E2B
cd backend/e2b-service
python main.py
```

### 5. Доступ к приложению

| Сервис | URL |
|--------|-----|
| Фронтенд | http://localhost:5173 |
| API бэкенда | http://localhost:3001 |
| Проверка API | http://localhost:3001/health |

**Администратор по умолчанию:**
```
Email: admin@localhost
Пароль: admin
```

---

## Структура проекта

```
ClaraVerseAI/
├── backend/
│   ├── cmd/server/          # Главная точка входа
│   ├── internal/
│   │   ├── config/          # Конфигурация
│   │   ├── handlers/        # HTTP обработчики
│   │   ├── middleware/      # Аутентификация, ограничение частоты
│   │   ├── models/          # Модели данных
│   │   ├── services/        # Бизнес-логика
│   │   └── tools/           # 80+ реализаций инструментов
│   ├── pkg/
│   │   ├── auth/            # JWT аутентификация
│   │   └── database/        # Подключения к БД
│   ├── e2b-service/         # Выполнение кода на Python
│   ├── migrations/          # Миграции MySQL
│   └── docs/                # Документация
├── frontend/
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── stores/          # Хранилища Zustand
│   │   ├── hooks/           # Пользовательские хуки
│   │   └── utils/           # Утилиты
│   └── public/              # Статические ресурсы
├── searxng/                 # Конфигурация поисковой системы
├── docker-compose.yml       # Оркестрация сервисов
└── .env.example             # Шаблон окружения
```

---

## Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```bash
# Режим окружения
ENVIRONMENT=development

# URL фронтенда
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Бэкенд
ALLOWED_ORIGINS=http://localhost,http://localhost:5173,http://localhost:5174
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

# Безопасность (ОБЯЗАТЕЛЬНО - сгенерируйте!)
ENCRYPTION_MASTER_KEY=<openssl rand -hex 32>
JWT_SECRET=<openssl rand -hex 64>

# База данных
MYSQL_ROOT_PASSWORD=claraverse_root_2024
MYSQL_PASSWORD=claraverse_pass_2024
MONGODB_URI=mongodb://localhost:27017/claraverse
REDIS_URL=redis://localhost:6379

# Ограничение частоты
RATE_LIMIT_GLOBAL_API=200
RATE_LIMIT_WEBSOCKET=20

# Администратор (опционально)
SUPERADMIN_USER_IDS=
```

### Конфигурация базы данных

**Разработка (Docker):**
```yaml
# docker-compose.yml автоматически настраивает:
MongoDB: mongodb://localhost:27017/claraverse
MySQL: mysql://claraverse_user:claraverse_pass_2024@localhost:3306/claraverse
Redis: redis://localhost:6379
```

**Внешние базы данных:**
```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/claraverse

# Управляемый MySQL
DATABASE_URL=mysql://user:pass@host:3306/claraverse

# Redis Cloud
REDIS_URL=redis://user:pass@host:6379
```

---

## Рабочие процессы разработки

### Разработка бэкенда

```bash
cd backend

# Запуск с горячей перезагрузкой (через air)
air

# Или стандартный запуск
go run cmd/server/main.go

# Запуск тестов
go test ./...

# Запуск конкретного теста
go test -v ./internal/handlers -run TestAgentHandler

# Сборка бинарника
go build -o bin/server cmd/server/main.go

# Проверка проблем
go vet ./...
golangci-lint run
```

### Разработка фронтенда

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

### Разработка сервиса E2B

```bash
cd backend/e2b-service

# Создание виртуального окружения
python -m venv venv
source venv/bin/activate  # или `venv\Scripts\activate` на Windows

# Установка зависимостей
pip install -r requirements.txt

# Запуск сервиса
python main.py

# Запуск с отладочным логированием
DEBUG=1 python main.py
```

---

## Docker разработка

### Полный стек (Рекомендуется для тестирования)

```bash
# Сборка и запуск всех сервисов
docker compose up --build

# Запуск в фоне
docker compose up -d --build

# Просмотр логов
docker compose logs -f backend
docker compose logs -f frontend

# Остановка всех сервисов
docker compose down

# Полный сброс (включая тома)
docker compose down -v
```

### Только базы данных

```bash
# Запуск только баз данных
docker compose up mongodb mysql redis -d

# Затем запуск бэкенда/фронтенда локально
```

### Пересборка конкретного сервиса

```bash
docker compose up --build backend
docker compose up --build frontend
```

---

## Тестирование

### Тесты бэкенда

```bash
cd backend

# Все тесты
go test ./...

# С покрытием
go test -cover ./...

# Отчёт о покрытии
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Конкретный пакет
go test ./internal/services -v

# Интеграционные тесты (требуют запущенные БД)
go test ./internal/handlers -tags=integration
```

### Тесты фронтенда

```bash
cd frontend

# Модульные тесты
npm test

# С покрытием
npm run test:coverage

# E2E тесты (требуют запущенное приложение)
npm run test:e2e
```

### Тестирование API

```bash
# Проверка работоспособности
curl http://localhost:3001/health

# Вход
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","password":"admin"}'

# Аутентифицированный запрос
curl http://localhost:3001/api/agents \
  -H "Authorization: Bearer <token>"
```

---

## Отладка

### Отладка бэкенда

**VS Code launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Backend",
      "type": "go",
      "request": "launch",
      "mode": "auto",
      "program": "${workspaceFolder}/backend/cmd/server/main.go",
      "env": {
        "ENVIRONMENT": "development"
      }
    }
  ]
}
```

**Включение подробного логирования:**
```bash
# Добавьте в .env
LOG_LEVEL=debug
```

### Отладка фронтенда

**React DevTools:**
- Установите расширение браузера
- Используйте вкладки Components/Profiler

**Zustand DevTools:**
```typescript
// Уже включено в режиме разработки
// Откройте расширение Redux DevTools
```

**Отладка сети:**
- Chrome DevTools → вкладка Network
- Фильтр по WS для WebSocket-сообщений

### Отладка базы данных

```bash
# MongoDB shell
docker exec -it claraverse-mongodb mongosh claraverse

# MySQL shell
docker exec -it claraverse-mysql mysql -u claraverse_user -p claraverse

# Redis CLI
docker exec -it claraverse-redis redis-cli
```

---

## Распространённые проблемы

### Порт уже используется

```bash
# Найти процесс, использующий порт
lsof -i :3001
lsof -i :5173

# Завершить процесс
kill -9 <PID>

# Или использовать другие порты
PORT=3002 go run cmd/server/main.go
VITE_PORT=5174 npm run dev
```

### Ошибка подключения к базе данных

```bash
# Проверить, работают ли контейнеры
docker ps

# Проверить логи контейнеров
docker logs claraverse-mongodb
docker logs claraverse-mysql

# Перезапустить контейнеры
docker compose restart mongodb mysql redis
```

### Проблемы с модулями Go

```bash
cd backend

# Очистить кеш модулей
go clean -modcache

# Повторно загрузить зависимости
go mod download

# Привести в порядок
go mod tidy
```

### Проблемы с модулями Node

```bash
cd frontend

# Очистить кеш
rm -rf node_modules package-lock.json
npm cache clean --force

# Переустановить
npm install
```

### Ошибка подключения WebSocket

1. Проверьте настройки CORS в `.env`:
   ```
   ALLOWED_ORIGINS=http://localhost:5173
   ```

2. Проверьте URL WebSocket в фронтенде:
   ```
   VITE_WS_URL=ws://localhost:3001
   ```

3. Проверьте ограничение частоты (20 подключений/мин по умолчанию)

### Ошибки сборки

```bash
# Бэкенд
cd backend
go build -v ./... 2>&1 | head -50

# Фронтенд
cd frontend
npm run build 2>&1 | head -50
```

---

## Стиль кода

### Go

- Следуйте [Effective Go](https://go.dev/doc/effective_go)
- Используйте `gofmt` для форматирования
- Запускайте `golangci-lint` перед коммитом

### TypeScript/React

- ESLint + Prettier настроены
- Запускайте `npm run lint:fix` перед коммитом
- Используйте функциональные компоненты с хуками

### Сообщения коммитов

```
feat: новая функция
fix: исправление ошибки
docs: изменения документации
style: форматирование, без изменения кода
refactor: реструктуризация кода
test: добавление тестов
chore: обслуживание
```

---

## Полезные команды

```bash
# Сокращения Makefile
make install      # Установка всех зависимостей
make dev          # Запуск среды разработки
make build        # Сборка всех сервисов
make test         # Запуск всех тестов
make clean        # Очистка артефактов сборки

# Управление базой данных
make db-migrate   # Запуск миграций
make db-reset     # Сброс баз данных

# Сокращения Docker
make docker-up    # Запуск сервисов Docker
make docker-down  # Остановка сервисов Docker
make docker-logs  # Просмотр логов
```

---

## Связанная документация

- [Руководство по архитектуре](ARCHITECTURE_ru.md) — Дизайн системы
- [Справочник API](API_REFERENCE_ru.md) — Документация API
- [Руководство по безопасности](FINAL_SECURITY_INSPECTION_ru.md) — Детали безопасности
- [Руководство администратора](ADMIN_GUIDE_ru.md) — Администрирование
- [Быстрая справка](QUICK_REFERENCE_ru.md) — Распространённые команды
