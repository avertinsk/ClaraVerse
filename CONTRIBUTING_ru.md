# Участие в проекте ClaraVerse

Прежде всего, спасибо, что рассматриваете возможность участия в ClaraVerse! 🎉

ClaraVerse создан сообществом для сообщества. Мы приветствуем участие разработчиков любого уровня квалификации.

## Содержание

- [Кодекс поведения](#кодекс-поведения)
- [Как я могу помочь?](#как-я-могу-помочь)
- [Настройка разработки](#настройка-разработки)
- [Процесс Pull Request](#процесс-pull-request)
- [Стандарты кодирования](#стандарты-кодирования)
- [Сообщения коммитов](#сообщения-коммитов)
- [Тестирование](#тестирование)

## Кодекс поведения

Этот проект придерживается Кодекса поведения. Участвуя, вы обязуетесь соблюдать этот кодекс. Пожалуйста, сообщайте о неприемлемом поведении на [hello@claraverse.space](mailto:hello@claraverse.space).

**Кратко:**
- Будьте уважительны и терпимы
- Приветствуйте новичков и помогайте им учиться
- Принимайте конструктивную критику
- Думайте о том, что лучше для сообщества
- Проявляйте эмпатию к другим участникам

## Как я могу помочь?

### 🐛 Отчёты об ошибках

Перед созданием отчётов об ошибках проверьте существующие issues, чтобы избежать дубликатов.

При создании отчёта об ошибке укажите:
- **Чёткий заголовок и описание**
- **Шаги воспроизведения** проблемы
- **Ожидаемое и фактическое поведение**
- **Скриншоты**, если применимо
- **Детали окружения**: ОС, браузер, версии
- **Сообщения об ошибках и логи**

### 💡 Предложения функций

Предложения функций приветствуются! Пожалуйста:
- **Проверьте существующие issues** на дубликаты
- **Опишите проблему**, которую пытаетесь решить
- **Объясните предлагаемое решение** с примерами
- **Рассмотрите альтернативы**, о которых вы думали
- **Объясните, почему** это полезно для сообщества

### 📝 Улучшение документации

Улучшения документации всегда приветствуются:
- Исправление опечаток и грамматики
- Добавление отсутствующей информации
- Улучшение ясности и примеров
- Добавление руководств и инструкций
- Перевод на другие языки

### 🔧 Участие в коде

Мы особенно приветствуем участие в этих областях:

- **Исправление ошибок**: См. [открытые issues с меткой "bug"](https://github.com/claraverse-space/ClaraVerse-Scarlet/labels/bug)
- **Функции**: См. [открытые issues с меткой "enhancement"](https://github.com/claraverse-space/ClaraVerse-Scarlet/labels/enhancement)
- **UI/UX**: Улучшения дизайна и доступности
- **Тестирование**: Модульные, интеграционные, E2E тесты
- **Интеграции**: Коннекторы для новых инструментов и сервисов
- **Модели**: Поддержка новых LLM-провайдеров

## Настройка разработки

### Требования

- **Go**: 1.24 или выше
- **Node.js**: 20 или выше
- **Python**: 3.11 или выше (для сервиса E2B)
- **Docker**: Последняя версия (опционально, для контейнеризованной разработки)
- **Git**: Последняя версия

### Быстрый старт

1. **Форкните и клонируйте репозиторий**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ClaraVerse-Scarlet.git
   cd ClaraVerse-Scarlet
   ```

2. **Установите зависимости**
   ```bash
   make install
   ```

3. **Настройте переменные окружения**
   ```bash
   cp .env.example .env
   cp backend/providers.example.json backend/providers.json
   # Отредактируйте .env и providers.json с вашей конфигурацией
   ```

4. **Запустите среду разработки**

   **Вариант A: Использование tmux (рекомендуется)**
   ```bash
   ./dev.sh
   ```

   **Вариант B: Ручной запуск (отдельные терминалы)**
   ```bash
   # Терминал 1 - Бэкенд
   cd backend
   go run ./cmd/server

   # Терминал 2 - Фронтенд
   cd frontend
   npm run dev

   # Терминал 3 - Сервис E2B (опционально)
   cd backend/e2b-service
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8001
   ```

5. **Доступ к приложению**
   - Фронтенд: http://localhost:5173
   - Бэкенд: http://localhost:3001
   - Сервис E2B: http://localhost:8001

### Структура проекта

```
ClaraVerse-Scarlet/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # Переиспользуемые UI-компоненты
│   │   ├── pages/            # Компоненты страниц
│   │   ├── services/         # API-клиенты, WebSocket
│   │   ├── store/            # Управление состоянием Zustand
│   │   └── utils/            # Вспомогательные функции
│   └── package.json
│
├── backend/                  # API-сервер Go + Fiber
│   ├── cmd/server/           # Точка входа приложения
│   ├── internal/
│   │   ├── handlers/         # HTTP и WebSocket обработчики
│   │   ├── services/         # Бизнес-логика
│   │   ├── models/           # Структуры данных
│   │   └── middleware/       # Аутентификация, CORS и т.д.
│   ├── e2b-service/          # Сервис выполнения кода на Python
│   └── docs/                 # Документация бэкенда
│
└── docs/                     # Документация проекта
```

## Процесс Pull Request

### Перед отправкой

1. **Создайте ветку функции**
   ```bash
   git checkout -b feature/your-feature-name
   # или
   git checkout -b fix/bug-description
   ```

2. **Внесите изменения**
   - Пишите чистый, поддерживаемый код
   - Следуйте стандартам кодирования (см. ниже)
   - Добавляйте тесты для нового функционала
   - Обновляйте документацию по мере необходимости

3. **Протестируйте изменения**
   ```bash
   # Тесты фронтенда
   cd frontend
   npm run test
   npm run lint
   npm run type-check

   # Тесты бэкенда
   cd backend
   go test ./...
   go vet ./...
   ```

4. **Зафиксируйте изменения**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

### Отправка PR

1. **Отправьте в ваш форк**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Откройте Pull Request**
   - Перейдите в [репозиторий ClaraVerse](https://github.com/claraverse-space/ClaraVerse-Scarlet)
   - Нажмите "New Pull Request"
   - Выберите ваш форк и ветку
   - Заполните шаблон PR

3. **Формат заголовка PR**
   ```
   type(scope): description

   Примеры:
   feat(chat): add streaming message support
   fix(auth): resolve token refresh issue
   docs(readme): update installation instructions
   refactor(api): simplify error handling
   test(chat): add WebSocket connection tests
   ```

4. **Описание PR должно включать**
   - **Что** изменилось и **почему**
   - **Как** протестировать изменения
   - **Скриншоты** для изменений UI
   - **Критические изменения**, если есть
   - **Связанные issues** (например, "Fixes #123")

### Процесс ревью

- Мейнтейнеры рассмотрят ваш PR в течение 2-3 рабочих дней
- Ответьте на комментарии, отправив новые коммиты
- После одобрения мейнтейнер сольёт ваш PR
- Ваш вклад будет включён в следующий релиз!

## Стандарты кодирования

### Фронтенд (TypeScript/React)

```typescript
// ✅ Хорошо: Используйте функциональные компоненты с TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {label}
    </button>
  );
};

// ❌ Плохо: Избегайте any и неясных имён
const Btn = (props: any) => <button {...props} />;
```

**Рекомендации:**
- Используйте строгий режим TypeScript
- Предпочитайте функциональные компоненты с хуками
- Используйте осмысленные имена переменных
- Выносите переиспользуемую логику в пользовательские хуки
- Держите компоненты небольшими и сфокусированными
- Используйте псевдонимы путей: `@/components` вместо `../../components`

### Бэкенд (Go)

```go
// ✅ Хорошо: Чёткие типы, обработка ошибок, документация
// HandleChatMessage обрабатывает входящие сообщения и потоковые ответы
func (h *ChatHandler) HandleChatMessage(ctx *fiber.Ctx) error {
    var req ChatRequest
    if err := ctx.BodyParser(&req); err != nil {
        return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
    }

    // ... реализация
    return nil
}

// ❌ Плохо: Неясные имена, пропущенная обработка ошибок
func (h *ChatHandler) Msg(ctx *fiber.Ctx) error {
    var r ChatRequest
    ctx.BodyParser(&r)
    // ... реализация
}
```

**Рекомендации:**
- Следуйте [Effective Go](https://golang.org/doc/effective_go)
- Используйте осмысленные имена (избегайте сокращений)
- Обрабатывайте все ошибки явно
- Добавляйте комментарии для экспортируемых функций
- Используйте Go modules для зависимостей
- Запускайте `go fmt` и `go vet` перед коммитом

### Общие лучшие практики

- **DRY**: Don't Repeat Yourself — выносите общую логику
- **KISS**: Keep It Simple, Stupid — избегайте чрезмерного усложнения
- **YAGNI**: You Aren't Gonna Need It — не добавляйте неиспользуемые функции
- **Безопасность**: Валидируйте входные данные, санизируйте вывод, используйте HTTPS
- **Производительность**: Профилируйте перед оптимизацией, избегайте преждевременной оптимизации

## Сообщения коммитов

Мы следуем [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

[optional body]

[optional footer]
```

### Типы

- `feat`: Новая функция
- `fix`: Исправление ошибки
- `docs`: Изменения документации
- `style`: Изменения стиля кода (форматирование, без изменения логики)
- `refactor`: Рефакторинг кода
- `test`: Добавление или обновление тестов
- `chore`: Задачи обслуживания (зависимости, сборка и т.д.)
- `perf`: Улучшения производительности
- `ci`: Изменения CI/CD

### Примеры

```bash
feat(chat): add message editing functionality

fix(auth): resolve JWT token expiration issue
Fixes #456

docs(api): update WebSocket protocol documentation

refactor(store): simplify conversation state management

test(chat): add unit tests for message formatting

chore(deps): update React to v19
```

## Тестирование

### Тесты фронтенда

```bash
cd frontend

# Запустить все тесты
npm run test

# Режим наблюдения
npm run test:watch

# Отчёт о покрытии
npm run test:coverage
```

**Рекомендации по тестированию:**
- Пишите тесты для новых функций
- Тестируйте граничные случаи и условия ошибок
- Используйте осмысленные описания тестов
- Мокайте внешние зависимости
- Стремитесь к >80% покрытия для нового кода

### Тесты бэкенда

```bash
cd backend

# Запустить все тесты
go test ./...

# Подробный вывод
go test -v ./...

# Отчёт о покрытии
go test -cover ./...
```

**Рекомендации по тестированию:**
- Тщательно тестируйте бизнес-логику
- Используйте табличные тесты для множественных сценариев
- Мокайте внешние сервисы (LLM API, базы данных)
- Тестируйте пути обработки ошибок
- Включайте интеграционные тесты для критических потоков

## Получение помощи

- 💬 **Discord**: [Присоединяйтесь к Discord](https://discord.gg/your-invite)
- 📧 **Email**: [hello@claraverse.space](mailto:hello@claraverse.space)
- 🐛 **Issues**: [GitHub Issues](https://github.com/claraverse-space/ClaraVerse-Scarlet/issues)
- 💡 **Обсуждения**: [GitHub Discussions](https://github.com/claraverse-space/ClaraVerse-Scarlet/discussions)

## Признание

Участники отмечаются в:
- [Странице участников](https://github.com/claraverse-space/ClaraVerse-Scarlet/graphs/contributors)
- Примечаниях к релизу каждой версии
- Нашем [веб-сайте](https://claraverse.space) (за значительный вклад)

## Лицензия

Участвуя в ClaraVerse, вы соглашаетесь, что ваш вклад будет лицензирован под **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Это гарантирует, что:
- Ваш вклад остаётся бесплатным и открытым навсегда
- Компании, использующие ClaraVerse, должны делиться своими улучшениями
- Сообщество получает пользу от всех улучшений
- Разработчики всегда получают надлежащую атрибуцию

---

**Спасибо, что делаете ClaraVerse лучше! 🚀**

Каждый вклад, каким бы маленьким он ни был, помогает создать более приватное и мощное ИИ-будущее.
