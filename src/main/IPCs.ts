import { ipcMain, shell, IpcMainEvent, dialog } from 'electron'
import Constants from './utils/Constants'
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

/*
 * IPC Communications
 * */
export default class IPCs {
  static initialize(): void {
    // Get application version
    ipcMain.handle('msgRequestGetVersion', () => {
      return Constants.APP_VERSION
    })

    // Open url via web browser
    ipcMain.on(
      'msgOpenExternalLink',
      async (event: IpcMainEvent, url: string) => {
        await shell.openExternal(url)
      }
    )

    // Open file
    ipcMain.handle(
      'msgOpenFile',
      async (event: IpcMainEvent, filter: string) => {
        const filters = []
        if (filter === 'text') {
          filters.push({ name: 'Text', extensions: ['txt', 'json'] })
        } else if (filter === 'zip') {
          filters.push({ name: 'Zip', extensions: ['zip'] })
        }
        const dialogResult = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters
        })
        return dialogResult
      }
    )
    ipcMain.handle('connect', async (event, dbPath, isuri, autocommit) => {
      try {
        return await setdbPath(dbPath, true, true)
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

    fetchall: async (query: string | object): Promise<any> => {
      try {
        let payload: string | object = query

        // Versuche, query als JSON zu parsen, falls es ein JSON-String ist
        if (typeof query === 'string') {
          try {
            payload = JSON.parse(query)
          } catch (e) {
            // kein JSON -> roher String bleibt payload
          }
        }

        const res = await ipcRenderer.invoke('fetchAllValue', payload)

        if (process.env.NODE_ENV === 'development') {
          console.debug('[IPC_FETCHALL::fetchAllValue]', {
            request: payload,
            result: res
          })
        }

        return res
      } catch (error) {
        console.error('preload fetchall error:', error)
        throw error
      }
    }
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
    let sharedVariable = ''

    ipcMain.handle('get-shared-variable', () => {
      return sharedVariable
    })

    ipcMain.on('set-shared-variable', (event, value) => {
      sharedVariable = value
    })
  }
}
