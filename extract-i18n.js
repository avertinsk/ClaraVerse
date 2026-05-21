/**
 * i18n Extraction and Migration Script
 * 
 * This script:
 * 1. Reads component files
 * 2. Extracts hardcoded UI strings
 * 3. Generates translation keys
 * 4. Updates locale JSON files (en/ru)
 * 5. Modifies components to use useTranslation()
 * 
 * Usage: node extract-i18n.js [component-file] [namespace]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.join(__dirname, 'frontend/src/i18n/locales');
const NAMESPACES = ['agents', 'nexus', 'skills'];

// Russian translations dictionary (common phrases)
const RU_TRANSLATIONS = {
  // Common UI
  'Save': 'Сохранить',
  'Cancel': 'Отмена',
  'Delete': 'Удалить',
  'Edit': 'Редактировать',
  'Close': 'Закрыть',
  'Back': 'Назад',
  'Next': 'Далее',
  'Submit': 'Отправить',
  'Loading...': 'Загрузка...',
  'Error': 'Ошибка',
  'Success': 'Успешно',
  'Warning': 'Предупреждение',
  'Confirm': 'Подтвердить',
  'Reset': 'Сбросить',
  'Search': 'Поиск',
  'Filter': 'Фильтр',
  'Sort': 'Сортировка',
  'Settings': 'Настройки',
  'Help': 'Помощь',
  'Info': 'Информация',
  
  // Agent Builder
  'Block Settings': 'Настройки блока',
  'Block Name': 'Имя блока',
  'Description': 'Описание',
  'Execution Timeout': 'Таймаут выполнения',
  'Save Changes': 'Сохранить изменения',
  'Test Block': 'Тестировать блок',
  'Testing...': 'Тестирование...',
  'AI Auto-Fill': 'Автозаполнение ИИ',
  'Fill Configuration': 'Заполнить конфигурацию',
  'Auto-filling...': 'Автозаполнение...',
  'Run the workflow first to generate upstream data': 'Сначала запустите workflow для генерации данных',
  'Use AI to auto-fill config from upstream data': 'Используйте ИИ для автозаполнения конфигурации',
  'Add context to help AI fill accurately (optional)': 'Добавьте контекст для точности (опционально)',
  
  // Deploy Panel
  'Deploy & Trigger': 'Развёртывание и запуск',
  'Ready to deploy': 'Готово к развёртыванию',
  'Deploying...': 'Развёртывание...',
  'Active': 'Активно',
  'Deploy Workflow': 'Развернуть workflow',
  'API Endpoint': 'API эндпоинт',
  'API Key': 'API ключ',
  'Schedule': 'Расписание',
  'Integration Code': 'Код интеграции',
  'Copy': 'Копировать',
  'Copied!': 'Скопировано!',
  'Generate API Key': 'Сгенерировать API ключ',
  'Endpoint URL': 'URL эндпоинта',
  'Frequency': 'Частота',
  'Timezone': 'Часовой пояс',
  'Enable Schedule': 'Включить расписание',
  'Save Schedule': 'Сохранить расписание',
  'Delete Schedule': 'Удалить расписание',
  
  // Common patterns
  'seconds (default)': 'секунд (по умолчанию)',
  'seconds': 'секунд',
  'seconds (max)': 'секунд (макс.)',
  'Maximum time this block can run before timing out': 'Максимальное время выполнения блока',
  'No agent selected': 'Агент не выбран',
  'Select an agent from the sidebar or create a new one to start building your workflow.': 'Выберите агента из боковой панели или создайте нового.',
  'No Agent Selected': 'Агент не выбран',
  'Conversation History': 'История разговоров',
  'New conversation': 'Новый разговор',
  'No conversations yet': 'Разговоров пока нет',
  'Delete': 'Удалить',
  'Encrypted with AES-256': 'Зашифровано AES-256',
  'Just now': 'Только что',
  'm ago': ' мин. назад',
  'h ago': ' ч. назад',
  'd ago': ' дн. назад',
  'Search models...': 'Поиск моделей...',
  'No models available': 'Нет доступных моделей',
  'No models match your search': 'Нет моделей по вашему запросу',
  'Rename agent:': 'Переименовать агента:',
  'Open menu': 'Открыть меню',
  'message': 'сообщение',
  'messages': 'сообщения',
};

// Extract strings from a file
function extractStrings(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const strings = [];
  
  // Match JSX text content and string literals
  const patterns = [
    />([^<>{}]+)</g,  // JSX text between tags
    /placeholder="([^"]+)"/g,  // placeholder attributes
    /title="([^"]+)"/g,  // title attributes
    /alt="([^"]+)"/g,  // alt attributes
    /label="([^"]+)"/g,  // label attributes
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const str = match[1].trim();
      if (str.length > 2 && str.length < 200 && !str.match(/^\s*$/) && !str.match(/^[{}[\]]+$/)) {
        strings.push(str);
      }
    }
  }
  
  return [...new Set(strings)]; // Remove duplicates
}

// Generate a translation key from a string
function generateKey(str, namespace) {
  // Clean and normalize the string
  const cleaned = str
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  return `${namespace}.${cleaned}`;
}

// Get Russian translation
function getRussianTranslation(str) {
  // Check exact match first
  if (RU_TRANSLATIONS[str]) {
    return RU_TRANSLATIONS[str];
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(RU_TRANSLATIONS)) {
    if (str.includes(key)) {
      return value;
    }
  }
  
  // Return the original string as fallback (will need manual translation)
  return `[TODO: RU] ${str}`;
}

// Process a single file
function processFile(filePath, namespace) {
  console.log(`Processing: ${filePath}`);
  
  const strings = extractStrings(filePath);
  const enUpdates = {};
  const ruUpdates = {};
  
  for (const str of strings) {
    const key = generateKey(str, namespace);
    enUpdates[key] = str;
    ruUpdates[key] = getRussianTranslation(str);
  }
  
  return { enUpdates, ruUpdates, strings };
}

// Load existing locale file
function loadLocaleFile(lang, namespace) {
  const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return {};
}

// Save locale file
function saveLocaleFile(lang, namespace, data) {
  const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Saved: ${filePath}`);
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node extract-i18n.js <component-file> <namespace>');
    console.log('Example: node extract-i18n.js frontend/src/components/agent-builder/DeployPanel.tsx agents');
    process.exit(1);
  }
  
  const [componentFile, namespace] = args;
  
  if (!NAMESPACES.includes(namespace)) {
    console.error(`Invalid namespace: ${namespace}. Must be one of: ${NAMESPACES.join(', ')}`);
    process.exit(1);
  }
  
  const { enUpdates, ruUpdates, strings } = processFile(componentFile, namespace);
  
  console.log(`\nExtracted ${strings.length} strings:`);
  strings.forEach(s => console.log(`  - "${s}"`));
  
  // Merge with existing locale data
  const enLocale = loadLocaleFile('en', namespace);
  const ruLocale = loadLocaleFile('ru', namespace);
  
  Object.assign(enLocale, enUpdates);
  Object.assign(ruLocale, ruUpdates);
  
  // Save updated locale files
  saveLocaleFile('en', namespace, enLocale);
  saveLocaleFile('ru', namespace, ruLocale);
  
  console.log('\nDone! Review the locale files and update components manually.');
}

main();
