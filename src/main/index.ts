import { app, WebContents, RenderProcessGoneDetails, ipcMain } from 'electron'
import Constants from './utils/Constants'
import { createErrorWindow, createMainWindow } from './MainRunner'
import log from 'electron-log/main'
import { join } from 'path'
import path from 'node:path'

// Import the 'createRequire' function from the 'module' package
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Import better-sqlite3
const Database = require('better-sqlite3')

let mainWindow
let errorWindow
let db: Database.Database | null = null

const initializeDatabase = () => {
  const dbPath = 'database/mysqlite3.db'

  try {
    db = new Database(dbPath, { verbose: log.debug })
    log.info(`Database initialized at: ${dbPath}`)
    return db
  } catch (error) {
    log.error('Failed to initialize database:', error)
    throw error
  }
}

const closeDatabase = () => {
  if (db) {
    try {
      db.close()
      log.info('Database closed successfully')
    } catch (error) {
      log.error('Error closing database:', error)
    }
    db = null
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
  const dbPath = pfad
  try {
    db = new Database(dbPath, { verbose: log.debug })
    log.info(`Database initialized at: ${dbPath}`)
    return db
  } catch (error) {
    log.error('Failed to initialize database:', error)
    throw error
  }
})

// IPC-Handler für Datenbankzugriff
ipcMain.handle('db:query', async (_event, sql: string, params: any[] = []) => {
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
      const stmt = db.prepare(sql)
      return stmt.run(...params)
    } catch (error) {
      log.error('Database execute error:', error)
      throw error
    }
  }
)

ipcMain.handle('db:get', async (_event, sql: string, params: any[] = []) => {
  if (!db) {
    throw new Error('Database not initialized')
  }
  try {
    const stmt = db.prepare(sql)
    return stmt.get(...params)
  } catch (error) {
    log.error('Database get error:', error)
    throw error
  }
})

ipcMain.handle(
  'db:transaction',
  async (_event, updates: Array<{ sql: string; params: any[] }>) => {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const transaction = db.transaction((updates) => {
      for (const update of updates) {
        const stmt = db.prepare(update.sql)
        stmt.run(...update.params)
      }
    })

    try {
      transaction(updates)
      log.info(`Transaction completed with ${updates.length} queries`)
      return { success: true, count: updates.length }
    } catch (error) {
      log.error('Transaction failed:', error)
      throw error
    }
  }
)

app.on('ready', async () => {
  if (Constants.IS_DEV_ENV) {
    import('./index.dev')
  }

  initializeMainLogger()

  try {
    initializeDatabase()
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

// Export db für andere Module (optional)
export const getDatabase = () => db
