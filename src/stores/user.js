/** 用户状态管理：令牌、当前用户信息、登录登出 */

import { defineStore } from 'pinia'

import * as authApi from '@/api/auth'
import { clearTokens, getToken, setTokens } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    profile: null,
    loaded: false,
  }),

  getters: {
    isLogin: (state) => Boolean(state.token),
    isAdmin: (state) => state.profile?.role === 'admin',
    displayName: (state) => state.profile?.nickname || state.profile?.username || '未登录',
    avatarText: (state) => (state.profile?.username || 'U').charAt(0).toUpperCase(),
  },

  actions: {
    /** 登录并保存令牌 */
    async login(payload) {
      const data = await authApi.login(payload)
      setTokens(data)
      this.token = data.access_token
      await this.fetchProfile()
      return data
    },

    /** 拉取当前用户信息 */
    async fetchProfile(force = false) {
      if (this.loaded && !force) return this.profile
      const profile = await authApi.getCurrentUser()
      this.profile = profile
      this.loaded = true
      return profile
    },

    /** 退出登录 */
    async logout() {
      try {
        if (this.token) await authApi.logout()
      } catch (error) {
        // 令牌已失效也允许本地登出
      }
      this.reset()
    },

    /** 清空本地登录态 */
    reset() {
      clearTokens()
      this.token = ''
      this.profile = null
      this.loaded = false
    },
  },
})
