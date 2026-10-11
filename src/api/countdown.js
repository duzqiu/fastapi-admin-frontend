/** 倒数日接口（代办事项模块） */

import request from './request'

/**
 * 倒数日列表
 * @param {{
 *   page?: number, page_size?: number, keyword?: string,
 *   user_id?: number, cycle?: string, is_active?: boolean
 * }} params
 */
export function fetchCountdowns(params) {
  return request.get('/countdowns', { params })
}

/** 倒数日概览统计 */
export function fetchCountdownStats() {
  return request.get('/countdowns/stats')
}

/** 倒数日详情 */
export function fetchCountdown(id) {
  return request.get(`/countdowns/${id}`)
}

/** 创建倒数日（member_id 为归属用户，即用户中心的会员） */
export function createCountdown(data) {
  return request.post('/countdowns', data)
}

/** 更新倒数日 */
export function updateCountdown(id, data) {
  return request.put(`/countdowns/${id}`, data)
}

/** 启用 / 停用 */
export function updateCountdownStatus(id, isActive) {
  return request.patch(`/countdowns/${id}/status`, { is_active: isActive })
}

/** 删除倒数日 */
export function deleteCountdown(id) {
  return request.delete(`/countdowns/${id}`)
}
