# Руководство по настройке туров Shepherd.js

## ✅ Завершённая настройка

### 1. Установка
- ✅ Установлены `shepherd.js` и `react-shepherd`
- ✅ Добавлена пользовательская CSS-тема в `src/styles/shepherd-theme.css`
- ✅ Импортирован CSS в `src/App.tsx`

### 2. Созданная инфраструктура
- ✅ **Типы TypeScript**: `src/types/shepherd.d.ts`
- ✅ **Сервис туров**: `src/services/tourService.ts`
  - Управление состоянием завершения тура (localStorage)
  - Создание и кэширование экземпляров туров
  - Вспомогательные методы (isTourCompleted, markTourCompleted, resetTours)

- ✅ **Пользовательский хук**: `src/hooks/useShepherdTour.ts`
  - React-хук для управления турами
  - Поддержка автозапуска и запуска при первом посещении

- ✅ **Компонент кнопки тура**: `src/components/ui/TourButton.tsx`
  - Переиспользуемая кнопка с вариантами иконки/кнопки
  - Показывает статус тура (завершён/не завершён)
  - Интегрирован с сервисом туров

### 3. Определения туров

Все туры созданы в директории `src/tours/`:

- ✅ **Тур по панели управления** (`dashboardTour.ts`)
  - Приветственное сообщение
  - Подсветка карточки чата
  - Подсветка карточки агентов
  - Подсветка карточки настроек
  - Подсветка меню пользователя

- ✅ **Тур по чату** (`chatTour.ts`)
  - Добро пожаловать в чат
  - Боковая панель истории чата
  - Кнопка нового чата
  - Селектор модели
  - Поле ввода сообщения
  - Загрузка файлов
  - Настройки чата

- ✅ **Тур по агентам** (`agentsTour.ts`)
  - Добро пожаловать в агенты
  - Список агентов
  - Кнопка создания нового агента
  - Канвас рабочего процесса
  - Палитра блоков
  - Настройки блоков
  - Кнопка тестирования агента
  - Кнопка развёртывания агента

### 4. Интеграция с панелью управления
- ✅ Кнопка тура добавлена в правый верхний угол заголовка
- ✅ Атрибуты data-tour добавлены к карточкам приложения:
  - `data-tour="chat-card"`
  - `data-tour="agents-card"`
  - `data-tour="settings-card"`
  - `data-tour="user-menu"`

---

## 🔧 Следующие шаги: Завершение интеграции чата и агентов

### Интеграция страницы чата

Необходимо добавить атрибуты `data-tour` к этим элементам в `/src/pages/Chat.tsx`:

```tsx
// 1. Боковая панель чата (вероятно, в пропсах компонента Sidebar)
<Sidebar data-tour="chat-sidebar" {...otherProps} />

// 2. Кнопка нового чата (ищите иконку Plus или "New Chat")
<button data-tour="new-chat">...</button>

// 3. Селектор модели (ищите выпадающий список/селектор модели)
<div data-tour="model-selector">...</div>

// 4. Поле ввода сообщения textarea
<textarea data-tour="message-input">...</textarea>

// 5. Кнопка загрузки файлов (ищите иконку прикрепления/загрузки)
<button data-tour="file-upload">...</button>

// 6. Меню настроек чата (вероятно, настройки/опции в заголовке)
<div data-tour="chat-options">...</div>
```

Затем добавьте кнопку тура в заголовок страницы чата:

```tsx
import { TourButton } from '@/components/ui';
import { chatTourSteps } from '@/tours';

// В области заголовка/панели инструментов:
<TourButton tourName="chat" steps={chatTourSteps} variant="icon" />
```

### Интеграция страницы агентов

Необходимо добавить атрибуты `data-tour` к этим элементам в `/src/pages/Agents.tsx`:

```tsx
// 1. Боковая панель или панель списка агентов
<div data-tour="agents-list">...</div>

// 2. Кнопка создания агента
<button data-tour="create-agent">...</button>

// 3. Канвас рабочего процесса (основная рабочая область)
<div data-tour="workflow-canvas">...</div>

// 4. Палитра блоков (перетаскиваемые блоки)
<div data-tour="block-palette">...</div>

// 5. Панель настроек блоков
<div data-tour="block-settings">...</div>

// 6. Кнопка тестирования
<button data-tour="test-agent">...</button>

// 7. Кнопка развёртывания
<button data-tour="deploy-agent">...</button>
```

Затем добавьте кнопку тура в заголовок страницы агентов:

```tsx
import { TourButton } from '@/components/ui';
import { agentsTourSteps } from '@/tours';

// В области заголовка/панели инструментов:
<TourButton tourName="agents" steps={agentsTourSteps} variant="icon" />
```

---

## 📝 Примеры использования

### Программный запуск тура

```tsx
import { tourService } from '@/services/tourService';
import { chatTourSteps } from '@/tours';

// Запустить тур
tourService.startTour('chat', chatTourSteps);

// Проверить, завершён ли
const isCompleted = tourService.isTourCompleted('chat');

// Сбросить тур
tourService.resetTours('chat');
```

### Использование хука

```tsx
import { useShepherdTour } from '@/hooks/useShepherdTour';
import { dashboardTourSteps } from '@/tours';

function MyComponent() {
  const { startTour, isCompleted, isActive } = useShepherdTour({
    tourName: 'dashboard',
    steps: dashboardTourSteps,
    startOnFirstVisit: true, // Автозапуск при первом посещении
  });

  return (
    <button onClick={startTour}>
      {isCompleted ? 'Перезапустить тур' : 'Пройти тур'}
    </button>
  );
}
```

### Настройка шагов тура

Редактируйте файлы туров в `src/tours/` для:
- Изменения текста и заголовков
- Настройки позиций элементов (`on: 'top' | 'bottom' | 'left' | 'right'`)
- Добавления/удаления шагов
- Настройки кнопок

---

## 🎨 Стилизация

Пользовательская тема находится в `src/styles/shepherd-theme.css` с:
- Современный, чистый дизайн
- Поддержка тёмной темы
- Плавные анимации
- Адаптивность для мобильных устройств
- Соответствует дизайн-системе вашего приложения

Для настройки цветов/отступов отредактируйте CSS-файл.

---

## 🔍 Поиск элементов

Чтобы найти, куда добавить атрибуты `data-tour`:

1. **Ищите имена компонентов**: "ModelSelector", "FileUpload" и т.д.
2. **Ищите импорты иконок**: `Plus`, `Upload`, `Settings` и т.д.
3. **Используйте DevTools браузера**: Инспектируйте элементы при работающей странице
4. **Проверьте пропсы компонентов**: Многие компоненты могут уже принимать className или data-* пропсы

---

## ✨ Возможности

- ✅ Сохранение состояния завершения тура (localStorage)
- ✅ Автозапуск туров при первом посещении
- ✅ Пропуск/отмена тура в любое время
- ✅ Навигация Назад/Далее
- ✅ Клавиатурная навигация (стрелки, ESC для выхода)
- ✅ Модальное наложение с подсветкой элементов
- ✅ Адаптивность для мобильных устройств
- ✅ Поддержка тёмной темы
- ✅ Функция сброса тура

---

## 🐛 Устранение неполадок

**Тур не отображается?**
- Убедитесь, что целевой элемент существует в DOM
- Проверьте, что атрибут `data-tour` правильно применён
- Убедитесь, что элемент виден (не скрыт и не в свёрнутой панели)
- Используйте `display: none` для элементов, которые следует пропустить

**Элемент подсвечивается неправильно?**
- Настройте позицию `on`: попробуйте 'auto' для автоматического размещения
- Увеличьте `modalOverlayOpeningPadding` для большего пространства
- Убедитесь, что элемент имеет правильные размеры

**Тур отображается в неправильное время?**
- Проверьте опцию `startOnFirstVisit`
- Проверьте логику `tourService.isTourCompleted()`
- Очистите localStorage для тестирования поведения при первом посещении

---

## 📦 Структура проекта

```
frontend/src/
├── tours/
│   ├── index.ts              # Экспорт всех туров
│   ├── dashboardTour.ts      # Шаги тура по панели управления
│   ├── chatTour.ts           # Шаги тура по чату
│   └── agentsTour.ts         # Шаги тура по агентам
├── services/
│   └── tourService.ts        # Сервис управления турами
├── hooks/
│   └── useShepherdTour.ts    # React-хук для туров
├── components/ui/
│   └── TourButton.tsx        # Переиспользуемая кнопка тура
├── types/
│   └── shepherd.d.ts         # Определения TypeScript
└── styles/
    └── shepherd-theme.css    # Пользовательская стилизация туров
```

---

## 🚀 Тестирование

1. Очистите localStorage: `localStorage.clear()`
2. Обновите страницу
3. Туры должны автозапускаться при первом посещении (если настроено)
4. Нажмите кнопки туров для ручного запуска
5. Протестируйте всю навигацию (Далее, Назад, Пропуск)
6. Проверьте, что состояние завершения сохраняется при перезагрузке страницы

---

## 📊 Аналитика и отслеживание

### Возможности

Система туров теперь включает комплексное отслеживание аналитики:

- **Автозапуск для новых пользователей на десктопе**: Туры автоматически запускаются для новых пользователей на десктопных устройствах
- **Отслеживание событий**: Отслеживает запуски, завершения, пропуски и просмотры шагов
- **Постоянное хранение**: Все данные аналитики хранятся в localStorage
- **Статистика**: Расчёт коэффициентов завершения и метрик вовлечённости

### Как это работает

1. **Обнаружение первого посещения**:
   - Проверяет, что пользователь на десктопе (ширина ≥1024px)
   - Проверяет, посещал ли пользователь ранее
   - Автозапуск тура, если оба условия выполнены

2. **События аналитики**:
   - `started`: Когда тур начинается
   - `completed`: Когда пользователь завершает весь тур
   - `skipped`: Когда пользователь отменяет/закрывает тур раньше
   - `step_viewed`: Каждый раз, когда шаг показывается

### Доступ к данным аналитики

#### Методы консоли

Откройте консоль браузера и используйте эти команды:

```javascript
// Получить все события аналитики туров
tourService.getTourAnalytics();

// Получить аналитику для конкретного тура
tourService.getTourAnalytics('dashboard');

// Получить статистику
tourService.getTourStats('dashboard');
// Возвращает: { started: 10, completed: 8, skipped: 2, completionRate: 80 }

// Проверить, является ли пользователь новым
tourService.isFirstTimeUser();

// Сбросить флаг нового пользователя (для тестирования)
tourService.resetFirstTimeUser();

// Очистить всю аналитику
tourService.clearAnalytics();
```

#### Программный доступ

```typescript
import { tourService } from '@/services/tourService';

// Получить статистику тура по панели управления
const stats = tourService.getTourStats('dashboard');
console.log(`Коэффициент завершения: ${stats.completionRate}%`);
console.log(`Пропущено: ${stats.skipped} раз`);

// Получить все события
const events = tourService.getTourAnalytics();
events.forEach(event => {
  console.log(`${event.tourName}: ${event.action} в ${event.timestamp}`);
});
```

### Ключи localStorage

Данные аналитики хранятся в этих ключах localStorage:

- `shepherd-tour-completed`: Массив завершённых туров
- `shepherd-tour-analytics`: Массив всех событий туров
- `clara-first-time-user`: Флаг, указывающий, посещал ли пользователь ранее

### Тестирование опыта первого посещения

Для тестирования автозапуска:

```javascript
// 1. Сбросить флаг нового пользователя
tourService.resetFirstTimeUser();

// 2. Сбросить завершение тура
tourService.resetTours('dashboard');

// 3. Обновить страницу
location.reload();
```

Или очистить все данные туров сразу:

```javascript
// Очистить всё
localStorage.removeItem('shepherd-tour-completed');
localStorage.removeItem('shepherd-tour-analytics');
localStorage.removeItem('clara-first-time-user');
location.reload();
```

### Просмотр панели аналитики

Для создания простого представления аналитики добавьте это в панель администратора:

```tsx
import { tourService, type TourStats } from '@/services/tourService';
import { useEffect, useState } from 'react';

function TourAnalyticsDashboard() {
  const [stats, setStats] = useState<TourStats>({
    started: 0,
    completed: 0,
    skipped: 0,
    completionRate: 0,
  });

  useEffect(() => {
    setStats(tourService.getTourStats('dashboard'));
  }, []);

  return (
    <div>
      <h2>Аналитика тура по панели управления</h2>
      <p>Запущено: {stats.started}</p>
      <p>Завершено: {stats.completed}</p>
      <p>Пропущено: {stats.skipped}</p>
      <p>Коэффициент завершения: {stats.completionRate.toFixed(1)}%</p>
    </div>
  );
}
```

### Интеграция с сервисами аналитики

Для отправки событий в Google Analytics, Mixpanel или другие сервисы измените метод `trackAnalytics` в `tourService.ts`:

```typescript
private trackAnalytics(event: TourAnalytics): void {
  // Хранить локально
  const analytics = localStorage.getItem(this.TOUR_ANALYTICS_KEY);
  const events: TourAnalytics[] = analytics ? JSON.parse(analytics) : [];
  events.push(event);
  localStorage.setItem(this.TOUR_ANALYTICS_KEY, JSON.stringify(events));

  // Отправить во внешний сервис аналитики
  if (typeof gtag !== 'undefined') {
    gtag('event', event.action, {
      event_category: 'tour',
      event_label: event.tourName,
      value: event.stepId,
    });
  }
}
```

---

Приятного использования туров! 🎉
