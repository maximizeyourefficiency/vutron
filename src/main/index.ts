import { app, WebContents, RenderProcessGoneDetails, ipcMain } from 'electron'
import Constants from './utils/Constants'
import { createErrorWindow, createMainWindow } from './MainRunner'
import log from 'electron-log/main'
import { join } from 'path'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  BerichtRow,
  LeistungSummaryRow,
  BERICHT_SQL,
  LEISTUNG_SUMMARY_SQL,
  strukturiereDaten,
  erstellePdfBericht
} from './pdfBerichtErwin'

let mainWindow
let errorWindow
let db: DatabaseSync | null = null

// SQLite-Datenbank öffnen
function openDatabase() {
  try {
    // Pfad zur Datenbank im userData-Verzeichnis
    //const dbPath = path.join(app.getPath('userData'), 'database.db')
    const dbPath = 'database/mysqlite3.db'
    console.log('Öffne Datenbank:', dbPath)

    // Datenbank öffnen (wird erstellt, falls nicht vorhanden)
    db = new DatabaseSync(dbPath)

    console.log('Datenbank erfolgreich geöffnet')
  } catch (error) {
    console.error('Fehler beim Öffnen der Datenbank:', error)
  }
}

// Datenbank schließen
function closeDatabase() {
  if (db) {
    db.close()
    console.log('Datenbank geschlossen')
  }
}

const initializeMainLogger = () => {
  log.initialize({
    includeFutureSessions: false,
    preload: true
  })

  const appLogFilePath = join(app.getPath('userData'), 'logs', 'applog.log')
  process.env.APP_ROOT = path.join(__dirname, '../..')

  log.transports.file.resolvePathFn = () =>
    join(app.getPath('userData'), 'logs', 'applog.log')
  log.transports.file.level = 'silly'
  log.transports.file.format = '[{y}{m}{d} {h}:{i}:{s}.{ms}|{level}]{text}'
  log.transports.console.format = '{h}:{i}:{s}.{ms} {text}'
  log.transports.console.level = 'silly'
  log.silly(`Start logging... (Path: ${appLogFilePath}) App is ready.`)
}

// IPC-Handler für Datenbankzugriff
ipcMain.handle('db:connect', async (_event, pfad: string) => {
  try {
    const dbPath = pfad
    console.log('Öffne Datenbank:', dbPath)
    // Datenbank öffnen (wird erstellt, falls nicht vorhanden)
    db = new DatabaseSync(dbPath)
    console.log('Datenbank erfolgreich geöffnet')
  } catch (error) {
    console.error('Fehler beim Öffnen der Datenbank:', error)
  }
})

// IPC-Handler für Datenbankzugriff
ipcMain.handle('db:getAll', async (_event, sql: string) => {
  if (!db) {
    throw new Error('Database not initialized')
  }
  try {
    const query = db.prepare(sql)
    return query.all()
  } catch (error) {
    log.error('Database query error:', error)
    throw error
  }
})

// IPC-Handler für Datenbankzugriff
ipcMain.handle('db:get', async (_event, sql: string, params: any[] = []) => {
  if (!db) {
    throw new Error('Database not initialized')
  }
  try {
    const stmt = db.prepare(sql)
    return stmt.all(...params)
  } catch (error) {
    log.error('Database query error:', error)
    throw error
  }
})

ipcMain.handle(
  'db:execute',
  async (_event, sql: string, params: any[] = []) => {
    if (!db) {
      throw new Error('Database not initialized')
    }
    try {
      log.error('Database execute error:', sql)
      const stmt = db.prepare(sql)
      return stmt.run(...params)
    } catch (error) {
      log.error('Database execute error:', error)
      throw error
    }
  }
)

// Handler für Transaktionen (mehrere Updates sicher ausführen)
ipcMain.handle(
  'db:transaction',
  async (_event, queries: Array<{ sql: string; params: any[] }>) => {
    if (!db) {
      throw new Error('Database not initialized')
    }

    try {
      // Transaction starten
      db.exec('BEGIN TRANSACTION')

      const results = []

      // Alle Queries ausführen
      for (const query of queries) {
        console.log('Transaction query:', query.sql)
        console.log('Transaction params:', JSON.stringify(query.params))
        // Baue SQL mit eingesetzten Werten (für node:sqlite)
        let sql = query.sql
        for (const param of query.params) {
          if (typeof param === 'string') {
            sql = sql.replace('?', `'${param.replace(/'/g, "''")}'`)
          } else if (param === null) {
            sql = sql.replace('?', 'NULL')
          } else {
            sql = sql.replace('?', String(param))
          }
        }
        console.log('Transaction final SQL:', sql)
        db.exec(sql)
        results.push({ success: true })
      }

      // Transaction bestätigen
      db.exec('COMMIT')

      return { success: true, results }
    } catch (error) {
      // Bei Fehler: Rollback
      db.exec('ROLLBACK')
      console.error('Transaction error:', error)
      throw error
    }
  }
)

// IPC-Handler für PDF-Bericht
ipcMain.handle(
  'pdf:generateBericht',
  async (
    _event,
    params: {
      personalId: number
      jahr: number
      monat: number
      vorname: string
      nachname: string
    }
  ) => {
    log.info('PDF Bericht angefordert:', params)

    if (!db) {
      log.error('Database not initialized')
      return { success: false, error: 'Database not initialized' }
    }

    try {
      const { personalId, jahr, monat, vorname, nachname } = params

      log.info('Führe SQL-Abfrage aus...')
      // Daten abfragen (nur Personal_ID_F als Filter)
      const stmt = db.prepare(BERICHT_SQL)
      const rows = stmt.all(personalId) as BerichtRow[]
      log.info(`SQL-Abfrage: ${rows.length} Zeilen gefunden`)

      // Nach Jahr und Monat filtern (falls gewünscht)
      const filteredRows = rows.filter(
        (row) => row.Jahr === jahr && row.Monat === monat
      )
      log.info(`Nach Filter: ${filteredRows.length} Zeilen`)

      if (filteredRows.length === 0) {
        log.warn('Keine Daten für Bericht gefunden')
        return { success: false, error: 'Keine Daten gefunden' }
      }

      log.info('Strukturiere Daten...')
      // Daten strukturieren
      const tageMap = strukturiereDaten(filteredRows)

      // Leistungs-Zusammenfassung abfragen
      log.info('Führe Leistungs-Summary-Abfrage aus...')
      const summaryStmt = db.prepare(LEISTUNG_SUMMARY_SQL)
      const summaryRows = summaryStmt.all(personalId, monat, jahr) as LeistungSummaryRow[]
      log.info(`Summary-Abfrage: ${summaryRows.length} Zeilen gefunden`)

      log.info('Erstelle PDF...')
      const result = await erstellePdfBericht(tageMap, {
        vorname,
        nachname,
        monat,
        jahr
      }, summaryRows)
      log.info('PDF erstellt:', result)
      return result
    } catch (error) {
      log.error('PDF Generierung fehlgeschlagen:', error)
      return { success: false, error: String(error) }
    }
  }
)

app.on('ready', async () => {
  if (Constants.IS_DEV_ENV) {
    import('./index.dev')
  }

  initializeMainLogger()

  try {
    openDatabase()
    log.info('Database ready')
  } catch (error) {
    log.error('Database initialization failed:', error)
  }

  mainWindow = await createMainWindow()
})

app.on('activate', async () => {
  if (!mainWindow) {
    mainWindow = await createMainWindow()
  }
})

app.on('window-all-closed', () => {
  closeDatabase()
  mainWindow = null
  errorWindow = null
  if (!Constants.IS_MAC) {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})

app.on(
  'render-process-gone',
  (
    event: Event,
    webContents: WebContents,
    details: RenderProcessGoneDetails
  ) => {
    errorWindow = createErrorWindow(errorWindow, mainWindow, details)
  }
)

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error)
  errorWindow = createErrorWindow(errorWindow, mainWindow)
})

// Exportiere db für IPC-Handler (optional)
export { db }
