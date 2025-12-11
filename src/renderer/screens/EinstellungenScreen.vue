<script setup lang="tsx">
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { onMounted, ref } from 'vue'
import { mdiBrightness6, mdiCog } from '@mdi/js'
import { openFile } from '@/renderer/utils'

const { t, availableLocales } = useI18n()
const theme = useTheme()
const languages = ref(['en'])
const appVersion = ref('Unknown')

const selectedFile = ref('')

const handleOpenFile = async () => {
  const dialogResult = await openFile('.db')
  if (!dialogResult.canceled) {
    selectedFile.value = dialogResult.filePaths[0]
    console.log(selectedFile.value)
    window.electron.connect(selectedFile.value)
  }
}

onMounted((): void => {
  languages.value = availableLocales

  // Get application version from package.json version string (Using IPC communication)
  getApplicationVersionFromMainProcess()
})
const getApplicationVersionFromMainProcess = (): void => {
  window.mainApi.invoke('msgRequestGetVersion').then((result: string) => {
    appVersion.value = result
  })
}

const handleChangeTheme = (): void => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>

<template>
  <v-container>
    <v-row
      no-gutters
      class="text-center align-center"
    >
      <v-col
        cols="12"
        md="7"
      >
        <v-row class="my-4">
          <v-col cols="12">
            <v-btn
              icon
              color="primary"
              @click="handleChangeTheme"
            >
              <v-icon :icon="mdiBrightness6" />
              <v-tooltip
                activator="parent"
                location="bottom"
              >
                {{ t('menu.change-theme') }}
              </v-tooltip>
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn
              icon
              color="primary"
              @click="handleOpenFile()"
            >
              <v-icon :icon="mdiCog" />
              <v-tooltip
                activator="parent"
                location="bottom"
              >
                Datenbank wechseln
              </v-tooltip>
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
