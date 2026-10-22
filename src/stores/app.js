/** 应用全局状态：侧边栏折叠、二级菜单展开状态、系统名称 */

import { defineStore } from 'pinia'

import { APP_BRAND_NAME } from '@/constants'

const COLLAPSE_KEY = 'admin_sidebar_collapsed'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: localStorage.getItem(COLLAPSE_KEY) === '1',
    // 本次会话里被展开的二级菜单 key：默认全收起，刷新 / 重新登录回到全收起
    expandedMenus: [],
    // 左上角品牌名（侧边栏与登录页共用；浏览器标题 / 版权行仍用全称 APP_NAME）
    projectName: APP_BRAND_NAME,
  }),

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem(COLLAPSE_KEY, this.sidebarCollapsed ? '1' : '0')
    },

    /** 展开 / 收起某个二级菜单 */
    toggleMenu(key) {
      this.expandedMenus = this.expandedMenus.includes(key)
        ? this.expandedMenus.filter((item) => item !== key)
        : [...this.expandedMenus, key]
    },

    /** 展开某个二级菜单（进到它下面的页面时用；已经展开就什么都不做） */
    expandMenu(key) {
      if (!this.expandedMenus.includes(key)) this.expandedMenus.push(key)
    },
  },
})
