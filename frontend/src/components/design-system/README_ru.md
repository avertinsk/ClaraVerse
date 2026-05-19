# Дизайн-система ClaraVerse v1.0

## Обзор

Готовая к продакшну дизайн-система для ClaraVerse с премиальной тёмной темой и акцентными цветами Rose Pink. Построена на React, TypeScript и CSS-переменных для максимальной гибкости и типобезопасности.

## Установка

Все компоненты дизайн-системы уже включены в этот проект. Просто импортируйте их из директории design-system:

```tsx
import { Button, Card, Typography } from '@/components/design-system';
```

## Быстрый старт

### Использование компонентов

```tsx
import { Button, Card, Badge, Typography } from '@/components/design-system';

function MyComponent() {
  return (
    <Card variant="glass" title="Добро пожаловать" description="Начните работу">
      <Typography variant="h3">Привет, мир</Typography>
      <Button variant="primary" size="lg">
        Начать
      </Button>
      <Badge variant="accent" dot>
        Новое
      </Badge>
    </Card>
  );
}
```

### Использование дизайн-токенов

Все дизайн-токены доступны как CSS-переменные:

```css
.my-component {
  background: var(--color-surface);
  padding: var(--space-8);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  transition: var(--transition-base);
}

.my-component:hover {
  background: var(--color-surface-elevated);
  box-shadow: var(--shadow-glow-md);
}
```

## Компоненты

### Button

Множество вариантов и размеров с состояниями загрузки:

```tsx
<Button variant="primary" size="md" loading={false}>
  Нажмите
</Button>

<Button variant="secondary" size="lg">
  Вторичная
</Button>

<Button variant="ghost" disabled>
  Отключена
</Button>
```

**Пропсы:**

- `variant`: 'primary' | 'secondary' | 'ghost'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `loading`: boolean
- `fullWidth`: boolean
- Все стандартные HTML-атрибуты кнопки

### Card

Три варианта карточек с опциональными эффектами наведения:

```tsx
<Card variant="glass" hoverable title="Заголовок карточки" description="Описание">
  Содержимое карточки
</Card>

<Card variant="feature" icon="🚀" title="Функция">
  Содержимое функции
</Card>

<Card variant="widget">
  Содержимое виджета
</Card>
```

**Пропсы:**

- `variant`: 'glass' | 'feature' | 'widget'
- `hoverable`: boolean (по умолчанию: true)
- `icon`: ReactNode
- `title`: string
- `description`: string

### Input и Textarea

Формы ввода с метками, ошибками и вспомогательным текстом:

```tsx
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  helperText="Мы никогда не поделимся вашим email"
  error="Email обязателен"
/>

<Textarea
  label="Сообщение"
  placeholder="Ваше сообщение..."
  helperText="Максимум 500 символов"
/>
```

**Пропсы:**

- `label`: string
- `error`: string
- `helperText`: string
- Все стандартные HTML-атрибуты input/textarea

### Badge

Индикаторы статуса с множеством вариантов:

```tsx
<Badge variant="accent" dot>Активен</Badge>
<Badge variant="success">Успех</Badge>
<Badge variant="warning">Предупреждение</Badge>
<Badge variant="error">Ошибка</Badge>
<Badge variant="info">Информация</Badge>
```

**Пропсы:**

- `variant`: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'info'
- `dot`: boolean
- `icon`: ReactNode

### Progress

Анимированные прогресс-бары с метками:

```tsx
<Progress value={65} showLabel label="Прогресс загрузки" />
<Progress value={100} showLabel />
```

**Пропсы:**

- `value`: number (0-100)
- `max`: number (по умолчанию: 100)
- `showLabel`: boolean
- `label`: string

### Skeleton

Заполнители загрузки для асинхронного контента:

```tsx
<Skeleton variant="text" count={3} />
<Skeleton variant="circular" width={60} height={60} />
<Skeleton variant="rectangular" height={120} />
```

**Пропсы:**

- `variant`: 'text' | 'circular' | 'rectangular'
- `width`: string | number
- `height`: string | number
- `count`: number

### Typography

Гибкая типографика с адаптивным размером:

```tsx
<Typography variant="display" gradient>
  Отображаемый текст
</Typography>

<Typography variant="h1" weight="bold" align="center">
  Заголовок 1
</Typography>

<Typography variant="base" as="p">
  Основной текст
</Typography>
```

**Пропсы:**

- `variant`: 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'xl' | 'lg' | 'base' | 'sm' | 'xs'
- `weight`: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'black'
- `align`: 'left' | 'center' | 'right'
- `gradient`: boolean
- `as`: ElementType (переопределение HTML-элемента по умолчанию)

## Дизайн-токены

### Цвета

```css
--color-accent: #e91e63; /* Rose Pink */
--color-success: #30d158; /* Зелёный */
--color-warning: #ffd60a; /* Жёлтый */
--color-error: #ff453a; /* Красный */
--color-info: #64d2ff; /* Синий */

--color-background: #000000;
--color-surface: rgba(255, 255, 255, 0.02);
--color-surface-elevated: rgba(255, 255, 255, 0.04);

--color-text-primary: #f5f5f7;
--color-text-secondary: #a1a1a6;
--color-text-tertiary: #6e6e73;
```

### Отступы

```css
--space-2: 0.5rem; /* 8px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */
```

### Типографика

```css
--text-display: clamp(3.5rem, 8vw, 7rem);
--text-h1: clamp(3rem, 7vw, 6rem);
--text-base: 1rem;
--text-sm: 0.875rem;
```

### Эффекты

```css
--shadow-glow-md: 0 10px 30px rgba(233, 30, 99, 0.3);
--radius-lg: 1rem;
--radius-full: 9999px;
--transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--backdrop-blur-lg: blur(30px);
```

## Принципы дизайна

### 1. Сначала тёмная тема

Всё разработано для тёмной темы с тонкими границами и эффектами глассморфизма.

### 2. Акцент Rose Pink

Стратегическое использование #e91e63 для максимального визуального эффекта на ключевых взаимодействиях.

### 3. Плавные анимации

Переходы 300ms с cubic-bezier для плавности в стиле Apple.

### 4. Глассморфизм

Размытие фона и полупрозрачные поверхности для многослойной глубины.

### 5. Доступность

Соответствие WCAG AA с правильными состояниями фокуса и поддержкой уменьшения движения.

### 6. Адаптивность

Мобильный-first дизайн с адаптивной типографикой через CSS clamp().

## Лучшие практики

### Делайте ✅

- Используйте Rose Pink (#e91e63) последовательно для основных действий
- Применяйте плавные переходы ко всем интерактивным элементам
- Используйте backdrop-filter для эффектов глассморфизма
- Держите тени мягкими и тонкими
- Добавляйте состояния наведения, которые приподнимают элементы
- Используйте адаптивную типографику с clamp()
- Поддерживайте правильную семантику HTML

### Не делайте ❌

- Не используйте чисто белый (#fff) для текста — используйте #f5f5f7
- Не пропускайте переходы на интерактивных элементах
- Не используйте резкие тени
- Не переусердствуйте с акцентным цветом
- Не забывайте состояния фокуса для клавиатурной навигации
- Не используйте границы толще 1.5px

## Демонстрация

Посетите `/design-system` в вашем браузере, чтобы увидеть все компоненты в действии с интерактивными примерами.

## Поддержка браузеров

- Chrome (последняя)
- Firefox (последняя)
- Safari (последняя)
- Edge (последняя)

## Поддержка TypeScript

Все компоненты полностью типизированы с TypeScript для отличной поддержки IDE и типобезопасности.

## Лицензия

MIT License — См. файл LICENSE для деталей

---

**Создано с ❤️ для ClaraVerse от @badboysm890**
