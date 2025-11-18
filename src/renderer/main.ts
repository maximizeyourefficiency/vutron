import { createApp } from 'vue'

import App from '@/renderer/App.vue'
import router from '@/renderer/router'
import vuetify from '@/renderer/plugins/vuetify'
import i18n from '@/renderer/plugins/i18n'
import pinia from '@/renderer/plugins/pinia'

// Add API key defined in contextBridge to window object type
declare global {
  interface Window {
    mainApi?: any
    /*api: {
      connect: (
        path: string,
        isuri: boolean,
        autocommit: boolean
      ) => Promise<any>
      executeQuery: (query: string, values: any[]) => Promise<any>
      fetchone: (query: string, values: any[]) => Promise<any>
      fetchmany: (query: string, size: number, values: any[]) => Promise<any>
      fetchall: (query: string, values: any[]) => Promise<any>
      executeMany: (query: string, values: any[][]) => Promise<any>
      executeScript: (scriptPath: string) => Promise<any>
      load_extension: (path: string) => Promise<any>
      backup: (
        target: string,
        pages: number,
        name: string,
        sleep: number
      ) => Promise<any>
      iterdump: (path: string, filter: string) => Promise<any>
    }*/
  }
}

const app = createApp(App)

app.use(vuetify).use(i18n).use(router).use(pinia)

app.mount('#app')
