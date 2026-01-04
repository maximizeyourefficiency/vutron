import { MainScreen } from '@/renderer/screens'
import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: MainScreen,
      meta: {
        titleKey: 'title.main'
      }
    },
    {
      path: '/personal',
      component: () => import('@/renderer/screens/PersonalScreen.vue'),
      meta: {
        titleKey: 'title.personal'
      }
    },
    {
      path: '/baustellen',
      component: () => import('@/renderer/screens/BaustellenScreen.vue'),
      meta: {
        titleKey: 'title.baustellen'
      }
    },
    {
      path: '/error',
      component: () => import('@/renderer/screens/ErrorScreen.vue'),
      meta: {
        titleKey: 'title.error'
      }
    },
    {
      path: '/auswertung',
      component: () => import('@/renderer/screens/AuswertungScreen.vue'),
      meta: {
        titleKey: 'title.auswertung'
      }
    },
    {
      path: '/einstellungen',
      component: () => import('@/renderer/screens/EinstellungenScreen.vue'),
      meta: {
        titleKey: 'title.einstellungen'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})
