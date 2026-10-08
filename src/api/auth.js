/** 认证相关接口 */

import request from './request'

/**
 * 账号密码登录
 * @param {{ username: string, password: string }} data
 * @returns {Promise<{ access_token, refresh_token, token_type, expires_in }>}
 */
export function login(data) {
  return request.post('/auth/login', data)
}

/** 获取当前登录用户信息 */
export function getCurrentUser() {
  return request.get('/auth/me')
}

/** 修改当前用户密码 */
export function changePassword(data) {
  return request.post('/auth/change-password', data)
}

/** 退出登录 */
export function logout() {
  return request.post('/auth/logout')
}
