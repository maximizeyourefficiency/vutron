import { app, WebContents, RenderProcessGoneDetails, ipcMain } from 'electron'
import Constants from './utils/Constants'
import { createErrorWindow, createMainWindow } from './MainRunner'
import log from 'electron-log/main'
import { join } from 'path'
import path from 'node:path'
const {
  setdbPath,
  executeQuery,
  executeMany,
  executeScript,
  fetchOne,
  fetchMany,
  fetchAll,
  fetchAllValue,
  load_extension,
  backup,
  iterdump
} = require('sqlite-electron')
let mainWindow
let errorWindow

//const pfad = path.join(process.env.APP_ROOT, 'database/mysqlite3.db')

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

app.on('ready', async () => {
  if (Constants.IS_DEV_ENV) {
    import('./index.dev')
  }

  // Disable special menus on macOS by uncommenting the following, if necessary
  /*
  if (Constants.IS_MAC) {
    systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true)
    systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true)
  }
  */
  initializeMainLogger()

  mainWindow = await createMainWindow()
  try {
    return await setdbPath('database/mysqlite3.db', true, true)
    console.log('gut')
  } catch (error) {
    console.log(error)
    return error
  }
})

app.on('activate', async () => {
  if (!mainWindow) {
    mainWindow = await createMainWindow()
  }
})

app.on('window-all-closed', () => {
  mainWindow = null
  errorWindow = null

  if (!Constants.IS_MAC) {
    app.quit()
  }
})

ipcMain.handle('connect', async (event, dbPath, isuri, autocommit) => {
  try {
    return await setdbPath('database/mysqlite3.db', true, true)
  } catch (error) {
    console.log(error)
    return error
  }
})

ipcMain.handle('executeQuery', async (event, query, value) => {
  try {
    return await executeQuery(query, value)
  } catch (error) {
    return error
  }
})

ipcMain.handle('fetchone', async (event, query, value) => {
  try {
    console.log()
    return await fetchOne(query, value)
  } catch (error) {
    return error
  }
})

ipcMain.handle('fetchmany', async (event, query, size, value) => {
  try {
    return await fetchMany(query, size, value)
  } catch (error) {
    return error
  }
})

ipcMain.handle('fetchall', async (event, query, value) => {
  try {
    console.log('main.ts:')
    console.log('index.ts:' + query)
    console.log('index.ts:' + value)
    return await fetchAll(query, value)
  } catch (error) {
    return error
  }
})
ipcMain.handle('fetchAllValue', async (event, query, value) => {
  try {
    return await fetchAll(query, value)
  } catch (error) {
    return error
  }
})

ipcMain.handle('executeMany', async (event, query, values) => {
  try {
    return await executeMany(query, values)
  } catch (error) {
    return error
  }
})

ipcMain.handle('executeScript', async (event, scriptpath) => {
  try {
    return await executeScript(scriptpath)
  } catch (error) {
    return error
  }
})

ipcMain.handle('load_extension', async (event, path) => {
  try {
    return await load_extension(path)
  } catch (error) {
    return error
  }
})

ipcMain.handle('backup', async (event, target, pages, name, sleep) => {
  try {
    return await backup(target, Number(pages), name, Number(sleep))
  } catch (error) {
    return error
  }
})

ipcMain.handle('iterdump', async (event, path, filter) => {
  try {
    return await iterdump(path, filter)
  } catch (error) {
    return error
  }
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

process.on('uncaughtException', () => {
  errorWindow = createErrorWindow(errorWindow, mainWindow)
})
