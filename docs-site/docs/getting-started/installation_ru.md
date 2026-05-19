---
title: Установка
sidebar_label: Установка
sidebar_position: 1
---

# Установка

Запустите ClaraVerse с Docker Compose. Общее время: около 5 минут.

## Требования

| Требование | Минимум | Примечания |
|------------|---------|------------|
| **Docker** | 20.10+ | [Установить Docker](https://docs.docker.com/get-docker/) |
| **Docker Compose** | v2+ | Включён в Docker Desktop; на Linux установите `docker-compose-plugin` |
| **Git** | Любая свежая версия | Для клонирования репозитория |
| **ОЗУ** | 4 ГБ свободно | MongoDB, MySQL, Redis, SearXNG, бэкенд и фронтенд работают одновременно |
| **Диск** | 5 ГБ свободно | Для Docker-образов и томов баз данных |

## Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/claraverse-space/ClaraVerse.git
cd ClaraVerse
```

## Шаг 2: Создание файла окружения

```bash
cp .env.example .env
```

## Шаг 3: Генерация секретов

Необходимы два секрета. Сгенерируйте их и обновите ваш `.env`:

```bash
# Сгенерировать ключ подписи JWT
openssl rand -hex 32
# Скопируйте вывод и установите JWT_SECRET= в .env

# Сгенерировать ключ шифрования для пользовательских данных
openssl rand -hex 32
# Скопируйте вывод и установите ENCRYPTION_MASTER_KEY= в .env
```

Или всё за один раз:

```bash
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|" .env
sed -i "s|^ENCRYPTION_MASTER_KEY=.*|ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)|" .env
```

:::warning
Храните ваш `ENCRYPTION_MASTER_KEY` в безопасности. Его потеря означает потерю доступа ко всем зашифрованным пользовательским данным (переписки, сохранённые учётные данные). Сделайте резервную копию.
:::

## Шаг 4: Запуск ClaraVerse

```bash
docker compose up --build
```

Первая сборка занимает несколько минут для загрузки образов и компиляции. Последующие запуски быстрее.

Для запуска в фоне:

```bash
docker compose up --build -d
```

## Шаг 5: Проверка

Когда все контейнеры станут работоспособными, откройте браузер:

| Сервис | URL |
|--------|-----|
| **ClaraVerse** | [http://localhost](http://localhost) |
| **API бэкенда** | [http://localhost:3001/health](http://localhost:3001/health) |

Вы должны увидеть страницу регистрации ClaraVerse. Первый зарегистрированный пользователь автоматически становится администратором.

## Что запускается

Docker Compose поднимает шесть сервисов:

| Контейнер | Образ | Порт | Назначение |
|-----------|-------|------|------------|
| `claraverse-frontend` | Собирается из `./frontend` | 80 | Веб-UI React (nginx) |
| `claraverse-backend` | Собирается из `./backend` | 3001 | API-сервер Go |
| `claraverse-mongodb` | `mongo:7` | 27017 | Переписки, рабочие процессы, данные |
| `claraverse-mysql` | `mysql:8.0` | 3306 | Провайдеры, модели, возможности |
| `claraverse-redis` | `redis:7-alpine` | 6379 | Планирование задач, WebSocket pub/sub |
| `claraverse-searxng` | `searxng/searxng:latest` | -- | Приватный веб-поиск (только внутренний) |

## Устранение неполадок

**Порт 80 уже используется?** Другой веб-сервер (nginx, Apache) может быть запущен. Остановите его или измените порт фронтенда в `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Доступ на http://localhost:8080
```

**Контейнеры не проходят проверки работоспособности?** Дайте им больше времени при первом запуске. Проверьте логи:

```bash
docker compose logs -f backend
docker compose logs -f mysql
```

**Не хватает памяти?** Стек использует примерно 4 ГБ. Закройте другие тяжёлые приложения или увеличьте выделение памяти в настройках Docker Desktop.

## Следующие шаги

Перейдите к [Конфигурации](./configuration_ru.md) для настройки переменных окружения или сразу к [Быстрому старту](./quickstart_ru.md), чтобы начать использовать ClaraVerse.
