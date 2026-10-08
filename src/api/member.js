/**
 * 用户中心（会员）后台管理接口
 *
 * 说明：会员端（注册 / 登录 / 重置密码 / 个人中心）接口由后端提供，
 * 前缀 `/member/**`，本文件只封装后台管理用到的 `/members/**`。
 */

import request from './request'

/**
 * 会员列表
 * @param {{
 *   page?: number, page_size?: number, keyword?: string, gender?: string,
 *   is_active?: boolean, email_verified?: boolean,
 *   registered_after?: string, registered_before?: string
 * }} params
 */
export function fetchMembers(params) {
  return request.get('/members', { params })
}

/** 会员统计概览 */
export function fetchMemberStats() {
  return request.get('/members/stats')
}

/** 会员详情 */
export function fetchMember(id) {
  return request.get(`/members/${id}`)
}

/** 修改会员资料（含启用状态） */
export function updateMember(id, data) {
  return request.put(`/members/${id}`, data)
}

/** 启用 / 禁用会员 */
export function updateMemberStatus(id, isActive) {
  return request.patch(`/members/${id}/status`, { is_active: isActive })
}

/** 重置会员密码 */
export function resetMemberPassword(id, newPassword) {
  return request.patch(`/members/${id}/password`, { new_password: newPassword })
}

/** 删除会员 */
export function deleteMember(id) {
  return request.delete(`/members/${id}`)
}
