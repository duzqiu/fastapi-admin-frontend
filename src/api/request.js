/**
 * Axios 统一封装
 * - 自动携带 Bearer Token
 * - 自动解包 response.data
 * - 后端业务错误统一提示（{ code, message, data }）
 * - access_token 过期时用 refresh_token 静默续期，并自动重放失败的请求
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'

import { clearTokens, getRefreshToken, getToken, setTokens } from '@/utils/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || 15000)
const REFRESH_URL = '/auth/refresh'

/** 未授权时的回调，由 main.js 注入（避免 router 与 api 循环依赖） */
let unauthorizedHandler = null
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

const service = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

let refreshing = false
let pendingQueue = []

function handleUnauthorized(message = '登录状态已过期，请重新登录') {
  clearTokens()
  ElMessage.warning(message)
  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler()
  }
}

async function requestNewToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  const { data } = await axios.post(
    `${BASE_URL}${REFRESH_URL}`,
    { refresh_token: refreshToken },
    { timeout: TIMEOUT },
  )
  setTokens(data)
  return data.access_token
}

function flushQueue(token) {
  pendingQueue.forEach(({ config, resolve, reject }) => {
    if (!token) {
      reject(new Error('refresh token 失效'))
      return
    }
    config.__isRetryRequest = true
    config.headers.Authorization = `Bearer ${token}`
    service(config).then(resolve).catch(reject)
  })
  pendingQueue = []
}

service.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { response, config } = error

    // 网络层错误（后端未启动 / 断网 / 超时）
    if (!response) {
      const message = error.code === 'ECONNABORTED' ? '请求超时，请稍后重试' : '网络异常，请检查后端服务是否已启动'
      ElMessage.error(message)
      return Promise.reject(error)
    }

    const { status, data } = response
    const message = data?.message || data?.detail || `请求失败（HTTP ${status}）`

    // 401：尝试静默续期
    const isRefreshRequest = (config?.url || '').includes(REFRESH_URL)
    if (status === 401 && !isRefreshRequest && !config?.__isRetryRequest) {
      if (!getRefreshToken()) {
        handleUnauthorized(message)
        return Promise.reject(error)
      }

      if (refreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ config, resolve, reject })
        })
      }

      refreshing = true
      try {
        const token = await requestNewToken()
        refreshing = false
        flushQueue(token)

        config.__isRetryRequest = true
        config.headers.Authorization = `Bearer ${token}`
        return service(config)
      } catch (refreshError) {
        refreshing = false
        flushQueue(null)
        handleUnauthorized('登录状态已过期，请重新登录')
        return Promise.reject(refreshError)
      }
    }

    if (status === 401) {
      handleUnauthorized(message)
      return Promise.reject(error)
    }

    // 其余错误统一提示
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default service
