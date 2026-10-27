# gloow-discord-rpc

Браузерное расширение + нативный мост для показа прослушивания на [gloowroom.com](https://gloowroom.com) в Discord Rich Presence.

Использует [gloow_sdk](https://github.com/shalavochkk/sc2gloow/tree/main/gloow_sdk) для получения данных о текущем треке.

## Как работает

1. **Content script** на gloowroom.com отслеживает текущий трек (название, исполнитель, обложка)
2. **Расширение** отправляет данные в локальный нативный мост через Native Messaging
3. **Мост** использует `discord-rpc` и обновляет Discord Rich Presence

Вид в Discord — как у Spotify/PreMiD: название трека, исполнитель, обложка, прогресс/статус.

## Структура

```
gloow-discord-rpc/
├── extension/           # Chrome/Edge/Chromium расширение (Manifest V3)
│   ├── manifest.json
│   ├── content.js       # Парсит страницу gloowroom
│   ├── background.js    # Связь с нативным мостом
│   ├── popup/           # Попап расширения
│   └── icons/
├── bridge/              # Нативный мост (Node.js/Python)
│   ├── package.json
│   ├── index.js         # Discord RPC клиент
│   └── manifest.json    # Native Messaging host manifest
├── shared/              # Общие типы/константы
└── scripts/             # Скрипты установки
```

## Установка

### 1. Клонировать
```bash
git clone https://github.com/shalavochkk/gloow-discord-rpc.git
cd gloow-discord-rpc
```

### 2. Установить зависимости моста
```bash
cd bridge
npm install
```

### 3. Установить нативный хост
```bash
# Windows (PowerShell)
.\scripts\install-host.ps1

# Linux/macOS
chmod +x scripts/install-host.sh && ./scripts/install-host.sh
```

### 4. Загрузить расширение в браузер
1. Открыть `chrome://extensions/`
2. Включить "Режим разработчика"
3. "Загрузить распакованное расширение" → выбрать папку `extension/`

### 5. Запустить мост
```bash
node bridge/index.js
```

Или добавить в автозапуск.

## Использование

1. Запустить мост (`node bridge/index.js`)
2. Открыть [gloowroom.com](https://gloowroom.com) и включить трек
3. В Discord появится статус с треком с gloowroom

## Конфигурация

В `bridge/config.json`:
```json
{
  "clientId": "YOUR_DISCORD_APP_CLIENT_ID",
  "updateInterval": 1000
}
```

Создай Discord Application на [discord.com/developers/applications](https://discord.com/developers/applications), получи Client ID.

## Требования

- Node.js 18+
- Chromium-браузер (Chrome, Edge, Vivaldi)
- Discord Desktop
- [gloow_sdk](https://github.com/shalavochkk/sc2gloow) (опционально, для расширенной интеграции)

## Лицензия

MIT
