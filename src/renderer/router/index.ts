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
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})
