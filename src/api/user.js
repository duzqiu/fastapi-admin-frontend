/** 用户管理接口 */

import request from './request'

/**
 * 用户列表
 * @param {{ page?: number, page_size?: number, keyword?: string, role?: string, is_active?: boolean }} params
 */
export function fetchUsers(params) {
  return request.get('/users', { params })
}

/** 用户详情 */
export function fetchUser(id) {
  return request.get(`/users/${id}`)
}

/** 创建用户 */
export function createUser(data) {
  return request.post('/users', data)
}

/** 更新用户 */
export function updateUser(id, data) {
  return request.put(`/users/${id}`, data)
}

/** 启用 / 禁用 */
export function updateUserStatus(id, isActive) {
  return request.patch(`/users/${id}/status`, { is_active: isActive })
}

/** 重置密码 */
export function resetUserPassword(id, newPassword) {
  return request.patch(`/users/${id}/password`, { new_password: newPassword })
}

/** 删除用户 */
export function deleteUser(id) {
  return request.delete(`/users/${id}`)
}
