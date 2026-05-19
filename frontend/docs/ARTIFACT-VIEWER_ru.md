# Система просмотра артефактов

## Обзор

Система просмотра артефактов позволяет встроенный рендеринг HTML и PDF файлов прямо в интерфейсе чата, предоставляя богатый опыт предварительного просмотра, аналогичный современным приложениям чата.

## Компоненты

### 1. ArtifactContainer

Базовый компонент-обёртка, предоставляющий общие элементы управления для всех типов артефактов.

**Возможности:**
- Переключатель развернуть/свернуть
- Полноэкранный режим
- Кнопка загрузки
- Пользовательская панель инструментов (например, навигация по страницам)

**Использование:**
```tsx
<ArtifactContainer
  title="Мой документ"
  downloadUrl="/api/files/123"
  filename="document.pdf"
  toolbar={<PageNavigation />}
>
  <YourContentHere />
</ArtifactContainer>
```

### 2. PdfArtifact

Рендерит PDF файлы с использованием react-pdf с навигацией по страницам.

**Возможности:**
- Постраничная навигация
- Кнопки Назад/Вперёд
- Счётчик страниц (например, "3 / 10")
- Интеграция загрузки
- Состояния загрузки
- Обработка ошибок

**Использование:**
```tsx
<PdfArtifact
  url="http://localhost:3001/api/files/123?code=abc"
  title="Презентация"
  filename="slides.pdf"
/>
```

### 3. HtmlArtifact

Рендерит HTML-контент в изолированном iframe.

**Возможности:**
- Изолированный iframe (allow-scripts, allow-same-origin)
- Может принимать контент напрямую или загружать из URL
- Состояния загрузки
- Обработка ошибок

**Использование:**
```tsx
// С прямым контентом
<HtmlArtifact
  content="<html>...</html>"
  title="Предпросмотр HTML"
/>

// Или загрузка из URL
<HtmlArtifact
  url="http://localhost:3001/api/files/123"
  title="Предпросмотр HTML"
  filename="index.html"
/>
```

### 4. ArtifactRenderer

Умный компонент, который определяет типы файлов и рендерит соответствующий артефакт.

**Использование в AssistantMessage:**
```tsx
const renderDownloadTile = () => {
  const downloadTool = message.toolCalls?.find(/* ... */);
  if (!downloadTool) return null;

  // Попытаться рендерить как артефакт
  const artifactRenderer = (
    <ArtifactRenderer
      toolResult={downloadTool.result}
      backendUrl={backendUrl}
    />
  );

  if (artifactRenderer) {
    return <div>{artifactRenderer}</div>;
  }

  // Вернуться к плитке загрузки
  return <DownloadTile />;
};
```

## Интеграция

Система просмотра артефактов автоматически обнаруживает и рендерит:

1. **PDF файлы** (инструменты create_presentation, create_document)
   - Презентации с навигацией по страницам
   - Документы с прокруткой

2. **HTML файлы** (будущие инструменты экспорта HTML)
   - Интерактивный HTML-контент
   - Изолирован для безопасности

## Определение типа файла

Определение основано на:
1. Поле `file_type` в JSON результате инструмента
2. Расширение файла из поля `filename`

```typescript
const isPdf =
  parsedResult.file_type === 'pdf' ||
  filename.toLowerCase().endsWith('.pdf');

const isHtml =
  parsedResult.file_type === 'html' ||
  filename.toLowerCase().endsWith('.html');
```

## Зависимости

```json
{
  "dependencies": {
    "react-pdf": "^9.2.1",
    "pdfjs-dist": "^4.9.155"
  }
}
```

## Конфигурация воркера PDF.js

Компонент PdfArtifact настраивает воркер PDF.js через CDN:

```typescript
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
```

## Стилизация

Все компоненты артефактов используют CSS-переменные из дизайн-системы:

- `var(--space-*)` для отступов
- `var(--color-*)` для цветов
- `var(--radius-*)` для радиуса границ
- `var(--shadow-*)` для теней
- `var(--transition-*)` для анимаций

## Будущие улучшения

- **Артефакты изображений** — Представление галереи для коллекций изображений
- **Артефакты кода** — Предпросмотр кода с подсветкой синтаксиса
- **Артефакты данных** — Просмотрщики таблиц/графиков для CSV/JSON
- **3D артефакты** — Просмотрщики 3D моделей (GLB, OBJ)
- **Аудио/Видео артефакты** — Медиаплееры

## Пример результата инструмента

```json
{
  "success": true,
  "file_id": "abc-123",
  "filename": "presentation.pdf",
  "download_url": "http://localhost:3001/api/files/abc-123?code=xyz",
  "file_type": "pdf",
  "size": 45678,
  "page_count": 10,
  "expires_at": "2024-02-15"
}
```

Система артефактов автоматически определит это как PDF и рендерит компонент PdfArtifact с навигацией по страницам.
