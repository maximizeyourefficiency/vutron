# Vutron Baustellenverwaltung

Electron Desktop-Anwendung für Baustellenverwaltung mit Personal- und Leistungserfassung.

## Tech Stack

- **Frontend**: Vue 3 + Vuetify 3 + TypeScript
- **Backend**: Electron 38 mit Node.js SQLite
- **Build**: Vite 7 + electron-builder
- **State**: Pinia
- **Routing**: Vue Router (Hash-History)
- **i18n**: vue-i18n (Deutsch als Hauptsprache)
- **PDF**: pdf-lib

## Projektstruktur

```
src/
├── main/           # Electron Main-Prozess
│   ├── index.ts    # App-Entry, IPC-Handler, SQLite
│   └── pdfBerichtErwin.ts  # PDF-Berichtgenerierung
├── preload/        # Preload-Scripts (IPC-Bridge)
├── renderer/       # Vue Frontend
│   ├── screens/    # Hauptseiten (Personal, Baustellen, Auswertung, Einstellungen)
│   ├── components/ # Wiederverwendbare Komponenten
│   ├── plugins/    # Vuetify, Pinia, i18n Setup
│   └── router/     # Vue Router Konfiguration
└── public/         # Statische Assets
```

## Befehle

```bash
npm run dev          # Entwicklungsserver starten
npm run build        # Produktions-Build
npm run build:linux  # Linux-Build
npm run lint:fix     # ESLint mit Auto-Fix
npm run format:fix   # Prettier formatieren
npm run test         # Playwright E2E-Tests
```

## Datenbank

SQLite-Datenbank unter `database/mysqlite3.db`. IPC-Handler für DB-Zugriff:
- `db:connect` - Datenbank verbinden
- `db:getAll` - Alle Ergebnisse einer Query
- `db:get` - Query mit Parametern
- `db:execute` - Insert/Update/Delete
- `db:transaction` - Mehrere Queries in Transaktion

## PDF-Berichte

IPC-Handler `pdf:generateBericht` erstellt Monatsberichte pro Mitarbeiter mit Leistungsübersicht.

## Hinweise

- TypeScript strict mode aktiviert
- ESLint + Prettier für Code-Qualität
- Pfad-Alias `@` zeigt auf `src/`
- Node >= 20 erforderlich
