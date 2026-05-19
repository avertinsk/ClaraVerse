# План: Внедрение русскоязычной локализации ClaraVerse

## Структура namespace'ов
```
locales/
  en/  ru/
    common.json          # ~30 строк — кнопки, действия, общие элементы
    auth.json            # ~40 строк — вход, регистрация, сброс пароля
    chat.json            # ~80 строк — чат, сайдбар, сообщения, статусы
    onboarding.json      # ~50 строк — приветствие, имя, приватность
    dashboard.json       # ~18 строк — главная страница
    settings.json        # ~120 строк — все вкладки настроек
    subscription.json    # ~20 строк — тарифы, апгрейд
    agents.json          # ~15 строк — агент-билдер
    nexus.json           # ~20 строк — Nexus
    skills.json          # ~20 строк — Skills
    admin.json           # ~45 строк — админ-панель
    errors.json          # ~20 строк — ошибки
    privacy.json         # ~100+ строк — политика приватности
```

## Этап 1: Инфраструктура i18n
1. Создать ветку `translate` от `main`
2. Создать `frontend/src/i18n/index.ts` — конфигурация i18next:
   - Поддержка `en` и `ru`
   - LanguageDetector для автоопределения
   - Ленивая загрузка из `locales/`
3. Подключить i18n в `frontend/src/main.tsx` до рендера React
4. Добавить поле `language` в `useSettingsStore` с `persist()`

## Этап 2: Файлы переводов — `common.json` + `auth.json`
5. Создать `en/common.json` и `ru/common.json` (~30 ключей)
6. Создать `en/auth.json` и `ru/auth.json` (~40 ключей)
7. Обернуть строки в компонентах авторизации и общих элементах через `useTranslation()`

## Этап 3: Файлы переводов — `chat.json` + `onboarding.json`
8. Создать `en/chat.json` и `ru/chat.json` (~80 ключей)
9. Создать `en/onboarding.json` и `ru/onboarding.json` (~50 ключей, включая приветствия)
10. Обернуть строки в чате и модалках онбординга

## Этап 4: Файлы переводов — `settings.json` + `dashboard.json`
11. Создать `en/settings.json` и `ru/settings.json` (~120 ключей)
12. Создать `en/dashboard.json` и `ru/dashboard.json` (~18 ключей)
13. Обернуть строки в настройках и дашборде

## Этап 5: Файлы переводов — `admin.json` + `nexus.json` + `skills.json`
14. Создать файлы для admin (~45), nexus (~20), skills (~20)
15. Обернуть строки в соответствующих компонентах

## Этап 6: Файлы переводов — `subscription.json` + `errors.json` + `privacy.json` + `agents.json`
16. Создать оставшиеся файлы
17. Обернуть строки, включая политику приватности

## Этап 7: UI переключатель языка + проверка
18. Добавить переключатель языка в настройки (Account/Preferences)
19. Запустить `npm run lint` и `npm run type-check`
20. Протестировать переключение языков

---
Итого: ~580+ строк для перевода, разбитых на 13 namespace'ов.
