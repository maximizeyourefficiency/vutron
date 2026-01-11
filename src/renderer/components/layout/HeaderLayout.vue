<script setup lang="tsx">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mdiAccountGroup, mdiHome, mdiCog, mdiCounter } from '@mdi/js'
import { useAuswertungStore } from '@/renderer/store/auswertung'

const router = useRouter()
const route: any = useRoute()
const titleKey: string = (route?.meta?.titleKey || 'title.main') as string

const { t } = useI18n()
const auswertungStore = useAuswertungStore()

const handleRoute = (path: string): void => {
  router.push(path)
}

const isCurrentRoute = (path: string): boolean => {
  return path === route.path
}

const allMenus: {
  icon: string
  text: string
  path: string
  requiresUnlock?: boolean
}[] = [
  {
    icon: mdiHome,
    text: 'title.main',
    path: '/'
  },
  {
    icon: mdiAccountGroup,
    text: 'title.personal',
    path: '/personal'
  },
  {
    icon: mdiHome,
    text: 'title.baustellen',
    path: '/baustellen'
  },
  {
    icon: mdiCounter,
    text: 'title.auswertung',
    path: '/auswertung',
    requiresUnlock: true
  },
  {
    icon: mdiCog,
    text: 'title.einstellungen',
    path: '/einstellungen'
  }
]

const headerMenus = computed(() => {
  return allMenus.filter(
    (menu) => !menu.requiresUnlock || auswertungStore.isUnlocked
  )
})
</script>
<template>
  <v-app-bar
    color="primary"
    density="compact"
  >
    <v-app-bar-title>{{ t(titleKey) }}</v-app-bar-title>
    <template #append>
      <v-btn
        v-for="menu in headerMenus"
        :key="menu.path"
        :prepend-icon="menu.icon"
        variant="text"
        :class="{ active: isCurrentRoute(menu.path) }"
        @click="handleRoute(menu.path)"
      >
        {{ t(menu.text) }}
      </v-btn>
    </template>
  </v-app-bar>
</template>
<style scoped>
.v-btn {
  opacity: 0.4;
}
.active {
  opacity: 1 !important;
}
</style>
