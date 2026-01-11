<script setup lang="tsx">
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { onMounted, ref } from 'vue'
import { mdiBrightness6, mdiCog, mdiLock, mdiLockOpen } from '@mdi/js'
import { openFile } from '@/renderer/utils'
import { useAuswertungStore } from '@/renderer/store/auswertung'

const { t, availableLocales } = useI18n()
const theme = useTheme()
const languages = ref(['en'])
const appVersion = ref('Unknown')

const selectedFile = ref('')

const auswertungStore = useAuswertungStore()
const pinDialog = ref(false)
const pinInput = ref('')
const pinError = ref(false)

const handleOpenFile = async () => {
  const dialogResult = await openFile('.db')
  if (!dialogResult.canceled) {
    selectedFile.value = dialogResult.filePaths[0]
    console.log(selectedFile.value)
    window.mainApi.connect(selectedFile.value)
  }
}

const handlePinSubmit = () => {
  if (auswertungStore.checkPin(pinInput.value)) {
    pinDialog.value = false
    pinInput.value = ''
    pinError.value = false
  } else {
    pinError.value = true
  }
}

const handlePinDialogClose = () => {
  pinInput.value = ''
  pinError.value = false
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
          <v-col cols="12">
            <v-btn
              icon
              :color="auswertungStore.isUnlocked ? 'success' : 'primary'"
              @click="
                auswertungStore.isUnlocked
                  ? auswertungStore.lock()
                  : (pinDialog = true)
              "
            >
              <v-icon
                :icon="auswertungStore.isUnlocked ? mdiLockOpen : mdiLock"
              />
              <v-tooltip
                activator="parent"
                location="bottom"
              >
                {{
                  auswertungStore.isUnlocked
                    ? 'Auswertung sperren'
                    : 'Auswertung freischalten'
                }}
              </v-tooltip>
            </v-btn>
          </v-col>
        </v-row>

        <v-dialog
          v-model="pinDialog"
          max-width="300"
          @after-leave="handlePinDialogClose"
        >
          <v-card>
            <v-card-title>PIN eingeben</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="pinInput"
                label="PIN"
                type="password"
                :error="pinError"
                :error-messages="pinError ? 'Falscher PIN' : ''"
                @keyup.enter="handlePinSubmit"
                autofocus
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="grey"
                @click="pinDialog = false"
              >
                Abbrechen
              </v-btn>
              <v-btn
                color="primary"
                @click="handlePinSubmit"
              >
                OK
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>
