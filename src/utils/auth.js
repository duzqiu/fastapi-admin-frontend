/**
 * 令牌本地存储工具
 * 统一收口，后续如需改成 sessionStorage / cookie 只改这里。
 */

const ACCESS_TOKEN_KEY = 'admin_access_token'
const REFRESH_TOKEN_KEY = 'admin_refresh_token'

export function getToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }
}

export function removeToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export function setRefreshToken(token) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  }
}

export function removeRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function setTokens({ access_token: accessToken, refresh_token: refreshToken }) {
  setToken(accessToken)
  setRefreshToken(refreshToken)
}

export function clearTokens() {
  removeToken()
  removeRefreshToken()
}
