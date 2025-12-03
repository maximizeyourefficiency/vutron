<template>
  <v-btn
    icon
    @click="handleOpenFile()"
  >
    <v-icon :icon="mdiCog" />
  </v-btn>
</template>
<script setup>
import { mdiCog } from '@mdi/js'
import { ref } from 'vue'
import { openFile } from '@/renderer/utils'

const selectedFile = ref('')

const handleOpenFile = async () => {
  const dialogResult = await openFile('.db')
  if (!dialogResult.canceled) {
    selectedFile.value = dialogResult.filePaths[0]
    console.log(selectedFile.value)
    window.electron.connect(selectedFile.value)
  }
}
</script>
