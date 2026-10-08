/** 应用全局状态：侧边栏折叠、系统名称 */

import { defineStore } from 'pinia'

import { APP_NAME } from '@/constants'

const COLLAPSE_KEY = 'admin_sidebar_collapsed'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: localStorage.getItem(COLLAPSE_KEY) === '1',
    projectName: APP_NAME,
  }),

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem(COLLAPSE_KEY, this.sidebarCollapsed ? '1' : '0')
    },
  },
})
