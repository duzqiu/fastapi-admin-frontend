/** 应用全局状态：侧边栏折叠、二级菜单展开状态、系统名称 */

import { defineStore } from 'pinia'

import { APP_BRAND_NAME } from '@/constants'

const COLLAPSE_KEY = 'admin_sidebar_collapsed'
const MENU_KEY = 'admin_menu_collapsed'

/** 读取上次收起的二级菜单（localStorage 里的脏数据不能让整个后台起不来） */
function readCollapsedMenus() {
  try {
    const saved = JSON.parse(localStorage.getItem(MENU_KEY) || '[]')
    return Array.isArray(saved) ? saved.filter((key) => typeof key === 'string') : []
  } catch {
    return []
  }
}

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: localStorage.getItem(COLLAPSE_KEY) === '1',
    // 被用户收起的二级菜单 key 列表（没记录的默认展开）
    collapsedMenus: readCollapsedMenus(),
    // 左上角品牌名（侧边栏与登录页共用；浏览器标题 / 版权行仍用全称 APP_NAME）
    projectName: APP_BRAND_NAME,
  }),

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem(COLLAPSE_KEY, this.sidebarCollapsed ? '1' : '0')
    },

    /** 收起 / 展开某个二级菜单 */
    toggleMenu(key) {
      this.collapsedMenus = this.collapsedMenus.includes(key)
        ? this.collapsedMenus.filter((item) => item !== key)
        : [...this.collapsedMenus, key]
      localStorage.setItem(MENU_KEY, JSON.stringify(this.collapsedMenus))
    },

    /** 展开某个二级菜单（进到它下面的页面时用；已经展开就什么都不做） */
    expandMenu(key) {
      if (!this.collapsedMenus.includes(key)) return
      this.collapsedMenus = this.collapsedMenus.filter((item) => item !== key)
      localStorage.setItem(MENU_KEY, JSON.stringify(this.collapsedMenus))
    },
  },
})
