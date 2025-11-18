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
  path: async () => {
    try {
      const res = await ipcRenderer.invoke('connect')
      console.log('Output: ' + res)
    } catch (error) {
      console.log('Output: ' + error)
    }
  },
  equery: async () => {
    //const query = document.getElementById('singlequery').value
    //const values = document.getElementById('value').value
    try {
      //const arr = JSON.parse('[' + values + ']')
      const res = await ipcRenderer.invoke(
        'executeQuery',
        'SELECT * FROM tblbauleiter'
        //arr[0]
      )
      console.log(res)
      //const res = await ipcRenderer.invoke('executeQuery', query, arr[0])
      //document.getElementById('pout1').innerText = 'Output: ' + res
    } catch (error) {
      console.log(error)
      //document.getElementById('pout1').innerText = 'Output: ' + error
    }
  },
  fetchall: async (query) => {
    try {
      //console.log('preload query:', query)
      let payload
      try {
        // wenn query ein JSON-string ist -> parsed array/object
        payload = JSON.parse(query)
      } catch (e) {
        // kein JSON -> sende den rohen String weiter (z.B. "SELECT ...")
        payload = query
      }
      const res = await ipcRenderer.invoke('fetchAllValue', payload)
      console.log('preload res:', JSON.stringify(res))
      return res
    } catch (error) {
      console.error('preload fetchall error:', error)
      // optional: return [] oder throw weiter
      throw error
    }
  },
  fetchone: async () => {
    const query = document.getElementById('fetchonequery').value
    const values = document.getElementById('fetchonevalue').value
    try {
      const arr = JSON.parse('[' + values + ']')
      const res = await ipcRenderer.invoke('fetchone', query, arr[0])
      //document.getElementById('poutfo').innerText =
      console.log('Output: ' + JSON.stringify(res))
    } catch (error) {
      document.getElementById('poutfo').innerText = 'Output: ' + error
    }
  },
  // Robuste Version wie fetchall, aber für fetchallvalue (mit params)

  fetchallvalue: async (query, params) => {
    try {
      console.log('preload query:', query)
      console.log('preload params:', params)

      let payload
      try {
        // Falls query ein JSON-String ist → JSON.parse
        payload = JSON.parse(query)
      } catch (e) {
        // Falls kein JSON, rohen String weitergeben
        payload = query
      }

      const res = await ipcRenderer.invoke('fetchAllValue', payload, params)

      console.log('preload res:', JSON.stringify(res))
      return res
    } catch (error) {
      console.error('fetchallvalue error:', error)
      throw error
    }
  },
  fetchmany: async () => {
    const query = document.getElementById('fetchmanyquery').value
    const values = document.getElementById('fetchmanyvalue').value
    const size = Number(document.getElementById('fetchmanysize').value)
    try {
      const arr = JSON.parse('[' + values + ']')
      const res = await ipcRenderer.invoke('fetchmany', query, size, arr[0])
      document.getElementById('poutfm').innerText =
        'Output: ' + JSON.stringify(res)
    } catch (error) {
      document.getElementById('poutfm').innerText = 'Output: ' + error
    }
  },
  mquery: async () => {
    const query = document.getElementById('query').value
    const values = document.getElementById('values').value
    try {
      const arr = JSON.parse('[' + values + ']')
      const res = await ipcRenderer.invoke('executeMany', query, arr[0])
      document.getElementById('pout2').innerText = 'Output: ' + res
    } catch (error) {
      document.getElementById('pout2').innerText = 'Output: ' + error
    }
  },
  escript: async () => {
    const spath = document.getElementById('scriptPath').value
    const res = await ipcRenderer.invoke('executeScript', spath)
    document.getElementById('pout3').innerText = 'Output: ' + res
  },
  load_extension: async () => {
    const path = document.getElementById('extensionPath').value
    const res = await ipcRenderer.invoke('load_extension', path)
    console.log(res)
    document.getElementById('pout4').innerText = 'Output: ' + res
  },
  backup: async () => {
    const target = document.getElementById('backupPath').value
    const pages = document.getElementById('pages').value
    const name = document.getElementById('name').value
    const sleep = document.getElementById('sleep').value
    const res = await ipcRenderer.invoke('backup', target, pages, name, sleep)
    console.log(res)
    document.getElementById('pout5').innerText = 'Output: ' + res
  },
  iterdump: async () => {
    const path = document.getElementById('iterdumpPath').value
    const filter = document.getElementById('iterdumpFilter').value
    const res = await ipcRenderer.invoke('iterdump', path, filter)
    console.log(res)
    document.getElementById('pout6').innerText = 'Output: ' + res
  }
})
