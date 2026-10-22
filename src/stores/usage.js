/**
 * 页面访问频次：给仪表盘的「常用入口」按使用频率排序。
 *
 * 统计粒度是「菜单里的真实页面」（不含仪表盘本身和隐藏页），记在 localStorage 里，
 * 刷新 / 重开浏览器都还在；只有十几个页面，整份计数很小。
 */

import { defineStore } from 'pinia'

import { menuRoutes } from '@/router/menu'

const USAGE_KEY = 'admin_menu_usage'

/** 会被统计、也会出现在常用入口里的页面（拍平后的菜单路由） */
export const usageCatalog = menuRoutes
  .filter((route) => !route.meta?.hidden && route.path !== '/dashboard')
  .map((route) => ({
    path: route.path,
    label: route.meta?.title || route.path,
    icon: route.meta?.icon || 'Document',
    roles: route.meta?.roles || [],
  }))

const trackedPaths = new Set(usageCatalog.map((item) => item.path))

/** 读上次的计数；localStorage 里的脏数据不能让后台起不来 */
function readCounts() {
  try {
    const saved = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(
      Object.entries(saved).filter(
        ([path, count]) => trackedPaths.has(path) && Number.isFinite(count) && count > 0,
      ),
    )
  } catch {
    return {}
  }
}

export const useUsageStore = defineStore('usage', {
  state: () => ({
    // { '/dishes': 12, '/members': 5, ... } —— 累计访问次数
    counts: readCounts(),
  }),

  actions: {
    /** 进到某个页面时 +1（仪表盘 / 个人中心 / 登录页等不计） */
    record(path) {
      if (!trackedPaths.has(path)) return
      this.counts[path] = (this.counts[path] || 0) + 1
      localStorage.setItem(USAGE_KEY, JSON.stringify(this.counts))
    },

    /** 清空统计（调试用，界面上没入口） */
    reset() {
      this.counts = {}
      localStorage.removeItem(USAGE_KEY)
    },
  },
})
