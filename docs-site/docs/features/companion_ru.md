---
title: Clara Companion
sidebar_label: Clara Companion
sidebar_position: 10
---

# Clara Companion — MCP-мост

Подключите ваши локальные инструменты и файловую систему к ClaraVerse через CLI Clara Companion. Он соединяет локальные MCP-серверы с вашим экземпляром ClaraVerse через WebSocket.

![Clara Companion](/img/features/claracompanion.png)

## Быстрый старт

```bash
# Установка через claraverse CLI
claraverse companion

# Вход (выберите localhost:3000 по умолчанию или введите URL вашего сервера)
clara_companion login

# Запуск моста
clara_companion
```

Или установите вручную из [GitHub Releases](https://github.com/claraverse-space/ClaraVerse/releases).

## MCP-серверы по умолчанию

Эти серверы доступны из коробки (требуется Node.js для npx):

| Сервер | Описание | Пакет |
|--------|-------------|---------|
| `filesystem` | Файловые операции (чтение, запись, список) | `@modelcontextprotocol/server-filesystem` |
| `git` | Git-операции (статус, diff, коммит) | `@modelcontextprotocol/server-git` |
| `memory` | Постоянный граф знаний | `@modelcontextprotocol/server-memory` |

## Команды CLI

| Команда | Описание |
|---------|-------------|
| `login` | Мастер настройки (аутентификация + серверы + сервис + запуск) |
| `logout` | Выйти и отозвать это устройство |
| `start` | Запустить мост |
| `status` | Показать статус подключения |
| `list` | Список настроенных серверов |
| `add <name>` | Добавить MCP-сервер |
| `remove <name>` | Удалить MCP-сервер |
| `service install` | Установить как фоновый сервис |
| `service uninstall` | Удалить фоновый сервис |
| `service status` | Проверить статус сервиса |
| `service start/stop` | Запустить или остановить сервис |
| `devices list` | Список подключённых устройств |
| `devices revoke <id>` | Отозвать устройство |
| `devices rename <id> <name>` | Переименовать устройство |

Запуск `clara_companion` без аргументов запускает мост.

## Фоновый сервис

Установите как фоновый сервис, чтобы мост автоматически запускался при входе в систему:

**macOS** (launchd):

```bash
clara_companion service install
# Расположение: ~/Library/LaunchAgents/com.claraverse.mcp-client.plist
```

**Linux** (systemd):

```bash
clara_companion service install
# Расположение: ~/.config/systemd/user/claraverse-mcp.service
```

**Windows:** Фоновый сервис пока не поддерживается. Используйте папку «Автозагрузка» или Планировщик задач.

Логи: `~/.claraverse/logs/mcp-client.log`

## Файл конфигурации

Расположение: `~/.claraverse/mcp-config.yaml`

```yaml
backend_url: wss://your-instance.com/mcp/connect
device:
  device_id: dev_abc123
  refresh_token: eyJ...
  user_email: user@example.com
mcp_servers:
  - name: filesystem
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/name"]
    enabled: true
```

## Поддержка платформ

| Платформа | Аутентификация | MCP-серверы | Фоновый сервис |
|----------|------|-------------|-------------------|
| macOS | Да | Да | Да (launchd) |
| Linux | Да | Да | Да (systemd) |
| Windows | Да | Да | Только ручной запуск |

## Устранение неполадок

**Проблемы аутентификации:**

```bash
clara_companion status   # Проверить токен
clara_companion login    # Повторная аутентификация
```

**Проблемы подключения:**
- Убедитесь, что backend ClaraVerse запущен
- Убедитесь, что брандмауэр разрешает WebSocket-подключения
- Запустите `clara_companion status` для диагностики

**Проблемы сервиса:**

```bash
clara_companion service status
tail -f ~/.claraverse/logs/mcp-client.log
```
