#!/bin/bash
set -e

SERVER_URL="${1:-http://10.10.0.1:3000}"
INSTALL_DIR="${2:-$HOME/.local/bin}"

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  linux)   BINARY="clara_companion-linux-amd64" ;;
  darwin)
    case "$ARCH" in
      x86_64) BINARY="clara_companion-darwin-amd64" ;;
      arm64)  BINARY="clara_companion-darwin-arm64" ;;
      *)      echo "❌ Неподдерживаемая архитектура macOS: $ARCH"; exit 1 ;;
    esac
    ;;
  *) echo "❌ Неподдерживаемая ОС: $OS. Поддерживаются Linux и macOS."; exit 1 ;;
esac

echo "📥 Скачивание $BINARY..."
mkdir -p "$INSTALL_DIR"
curl -sL "$SERVER_URL/downloads/$BINARY" -o "$INSTALL_DIR/clara-companion"
chmod +x "$INSTALL_DIR/clara-companion"

if ! echo ":$PATH:" | grep -q ":$INSTALL_DIR:"; then
  SHELL_PROFILE="$HOME/.$(basename "$SHELL")rc"
  if [ "$SHELL" = "/bin/zsh" ] || [ "$SHELL" = "/usr/bin/zsh" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
  fi
  echo "export PATH=\"\$PATH:$INSTALL_DIR\"" >> "$SHELL_PROFILE"
  echo "✅ $INSTALL_DIR добавлен в PATH (в $SHELL_PROFILE)"
fi

echo ""
echo "✅ Установка завершена!"
echo ""
echo "Далее:"
echo "  1. clara-companion login"
echo "  2. clara-companion daemon start"
echo ""
echo "Подробнее: $SERVER_URL/downloads/install.html"
