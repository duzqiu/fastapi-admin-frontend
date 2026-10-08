/**
 * 路由配置与全局守卫
 */

import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { APP_NAME } from '@/constants'
import { useUserStore } from '@/stores/user'
import { menuRoutes } from './menu'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true, hidden: true },
  },
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: menuRoutes,
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', public: true, hidden: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/404' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const isPublic = to.meta?.public === true

  if (isPublic) {
    // 已登录用户访问登录页时直接进入后台
    if (to.name === 'Login' && userStore.isLogin) return { path: '/dashboard' }
    return true
  }

  if (!userStore.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 首次进入或刷新后补齐用户信息（用于角色校验与顶栏展示）
  if (!userStore.loaded) {
    try {
      await userStore.fetchProfile()
    } catch (error) {
      userStore.reset()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  const allowRoles = to.meta?.roles
  if (allowRoles?.length && !allowRoles.includes(userStore.profile?.role)) {
    ElMessage.error('没有访问该页面的权限')
    return { path: '/dashboard' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta?.title ? `${to.meta.title} - ${APP_NAME}` : APP_NAME
})

export default router
