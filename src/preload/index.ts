import log from 'electron-log/renderer'
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// Initialize renderer logger
log.transports.console.level = 'silly'
log.transports.console.format = '{h}:{i}:{s}.{ms} {text}'
// Whitelist of valid channels used for IPC communication (Send message from Renderer to Main)
const mainAvailChannels: string[] = [
  'msgRequestGetVersion',
  'msgOpenExternalLink',
  'msgOpenFile'
]
const rendererAvailChannels: string[] = []

contextBridge.exposeInMainWorld('mainApi', {
  send: (channel: string, ...data: any[]): void => {
    if (mainAvailChannels.includes(channel)) {
      ipcRenderer.send.apply(null, [channel, ...data])
      if (process.env.NODE_ENV === 'development') {
        log.silly(`[IPC_SEND::${channel}]`, { request: data })
      }
    } else {
      throw new Error(`Unknown ipc channel name: ${channel}`)
    }
  },
  on: (
    channel: string,
    listener: (event: IpcRendererEvent, ...args: any[]) => void
  ): void => {
    if (rendererAvailChannels.includes(channel)) {
      ipcRenderer.on(channel, listener)
    } else {
      throw new Error(`Unknown ipc channel name: ${channel}`)
    }
  },
  once: (
    channel: string,
    listener: (event: IpcRendererEvent, ...args: any[]) => void
  ): void => {
    if (rendererAvailChannels.includes(channel)) {
      ipcRenderer.once(channel, listener)
    } else {
      throw new Error(`Unknown ipc channel name: ${channel}`)
    }
  },
  off: (
    channel: string,
    listener: (event: IpcRendererEvent, ...args: any[]) => void
  ): void => {
    if (rendererAvailChannels.includes(channel)) {
      ipcRenderer.off(channel, listener)
    } else {
      throw new Error(`Unknown ipc channel name: ${channel}`)
    }
  },
  invoke: async (channel: string, ...data: any[]): Promise<any> => {
    if (mainAvailChannels.includes(channel)) {
      const result = await ipcRenderer.invoke.apply(null, [channel, ...data])
      if (process.env.NODE_ENV === 'development') {
        log.silly(`[IPC_INVOKE::${channel}]`, {
          request: data,
          result
        })
      }
      return result
    }

    throw new Error(`Unknown ipc channel name: ${channel}`)
  }
})

contextBridge.exposeInMainWorld('api', {
  equery: async (query, params) => {
    try {
      console.log('preload query:', query)
      console.log('preload params:', params)

      let sql
      try {
        // Falls query ein JSON-String ist → JSON.parse
        sql = JSON.parse(query)
      } catch (e) {
        // Falls kein JSON, rohen String weitergeben
        sql = query
      }

      const res = await ipcRenderer.invoke('db:query', sql, params)

      console.log('preload res:', JSON.stringify(res))
      return res
    } catch (error) {
      console.error('executeQuery error:', error)
      throw error
    }
  }
})
contextBridge.exposeInMainWorld('electron', {
  connect: async (query: string) => {
    console.log('preload query:', query)
    return await ipcRenderer.invoke('db:connect', query || [])
  },
  getAll: async (query) => {
    try {
      //console.log('preload query:', query)
      let sql
      try {
        // wenn query ein JSON-string ist -> parsed array/object
        sql = JSON.parse(query)
      } catch (e) {
        // kein JSON -> sende den rohen String weiter (z.B. "SELECT ...")
        sql = query
      }
      const res = await ipcRenderer.invoke('db:getAll', sql)
      console.log('preload getAll res:', JSON.stringify(res))
      return res
    } catch (error) {
      console.error('preload query error:', error)
      // optional: return [] oder throw weiter
      throw error
    }
  },
  transaction: async (query: string, params?: any[]) => {
    console.log('preload query:', query, params)
    return await ipcRenderer.invoke('db:transaction', query, params || [])
  },

  execute: async (query: string, params?: any[]) => {
    console.log('preload execute:', query, params)
    return await ipcRenderer.invoke('db:execute', query, params || [])
  },

  get: async (query: string, params?: any[]) => {
    console.log('preload get:', query, params)
    return await ipcRenderer.invoke('db:get', query, params || [])
  },

  transaction: async (updates: Array<{ sql: string; params: any[] }>) => {
    console.log('preload transaction:', updates)
    return await ipcRenderer.invoke('db:transaction', updates)
  }
})
