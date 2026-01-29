# CS2 Nade Guide MVP

Минимальный MVP для офлайн-справочника раскидок CS2.

## Стек
- Electron + React + TypeScript + Vite
- SQLite (better-sqlite3)
- electron-builder (.exe)

## Команды
```bash
npm install
npm run dev
```

Сборка:
```bash
npm run build
```

## Структура
```
src/
  main/        # Electron main + IPC
  preload/     # безопасный bridge
  renderer/    # React UI
```

## Безопасность
`contextIsolation` включен, `nodeIntegration` выключен. Весь доступ к SQLite через IPC.
