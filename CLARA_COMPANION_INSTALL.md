# Clara Companion — подключение к локальной сети ClaraVerse

> **Сервер:** http://10.10.0.1:3000

Clara Companion — это CLI-демон, который подключает ваш ИИ-ассистент (Claude Code, Cursor и др.) к ClaraVerse через протокол MCP.

---

## Быстрая установка (Linux / macOS)

```bash
curl -sL http://10.10.0.1:3000/downloads/install.sh | bash
```

После установки:

```bash
clara-companion login
clara-companion daemon start &
```

---

## Ручная установка

### 1. Скачайте бинарник

| Платформа | Ссылка |
|-----------|--------|
| **Linux** (Intel/AMD) | [clara_companion-linux-amd64](http://10.10.0.1:3000/downloads/clara_companion-linux-amd64) |
| **macOS** (Intel) | [clara_companion-darwin-amd64](http://10.10.0.1:3000/downloads/clara_companion-darwin-amd64) |
| **macOS** (Apple Silicon M1/M2/M3) | [clara_companion-darwin-arm64](http://10.10.0.1:3000/downloads/clara_companion-darwin-arm64) |

### 2. Установите

```bash
# Сделайте исполняемым
chmod +x ~/Downloads/clara_companion-*

# Переместите в папку из PATH
mkdir -p ~/.local/bin
mv ~/Downloads/clara_companion-* ~/.local/bin/clara-companion

# Добавьте в PATH (если ещё не добавлено)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Войдите на сервер

```bash
clara-companion login
```

Программа сама подставит адрес сервера — просто нажмите **Enter**.

На экране появится **код подтверждения**. Откройте в браузере `http://10.10.0.1:3000/device`, введите код и нажмите «Подтвердить».

### 4. Запустите демон

```bash
clara-companion daemon start
```

Демон будет работать в фоне и автоматически подключаться к серверу.

Чтобы проверить, что всё работает:

```bash
clara-companion ping
```

### 5. Подключите ИИ-ассистента

В настройках вашего ассистента укажите MCP-сервер:

```
http://localhost:9812
```

Clara Companion слушает на порту 9812 локально и передаёт все запросы на сервер ClaraVerse.

---

## Часто задаваемые вопросы

**Q:** Нужно ли устанавливать Go или другие зависимости?\
**A:** Нет. Бинарник самодостаточный — скачал и запустил.

**Q:** Как остановить демон?\
**A:** `clara-companion daemon stop`

**Q:** Демон не запускается — что делать?\
**A:** Убедитесь, что порт 9812 не занят: `lsof -i :9812`. Если занят — остановите другую программу.

**Q:** Как обновить?\
**A:** Скачайте новый бинарник и замените старый.

**Q:** Нужно ли открывать порты на роутере?\
**A:** Нет. Демон подключается к серверу как клиент (WebSocket). Нужен только доступ к `http://10.10.0.1:3000` внутри вашей сети.

---

## Проверка контрольной суммы

```bash
curl -sL http://10.10.0.1:3000/downloads/checksums.txt
sha256sum ~/.local/bin/clara-companion
```

Сравните вывод — хеши должны совпадать.
