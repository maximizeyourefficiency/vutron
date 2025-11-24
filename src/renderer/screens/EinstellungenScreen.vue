<template>
  <v-btn
    icon
    @click="openEditDialog()"
  >
    <v-icon :icon="mdiCog" />
  </v-btn>
</template>
<script setup>
import { mdiCog } from '@mdi/js'
</script>
