/**
 * 用户中心（会员）后台管理接口
 *
 * 说明：会员端（注册 / 登录 / 重置密码 / 个人中心）接口由后端提供，
 * 前缀 `/member/**`（需会员令牌），本文件主要封装后台管理用到的 `/members/**`（管理员令牌）。
 *
 * 图片规则（与后端一致）：头像 `data/uploads/avatars/{会员ID}/`、背景图
 * `data/uploads/backgrounds/{会员ID}/`，一个会员一个目录，「存」和「读」都以会员 ID
 * 为维度。后端**会员侧没有单独的「读取图片」接口**：资料接口（`/member/profile`、
 * `/members/{id}`）的出参 `avatar_url` / `background_url` 就是可直接用的地址
 * —— 头像未上传时后端自动回退系统默认头像，背景图未上传时是空串。
 */

import request from './request'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

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

/** 修改会员资料（含地区 `region`、启用状态） */
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

// ==================== 头像（按会员 ID 存 / 读） ====================
/**
 * 后台代会员上传头像（multipart，字段名 file）
 * @param {number} id 会员 ID
 * @param {File} file 图片文件（jpg/jpeg/png/webp/gif，≤ 5MB）
 * @returns {Promise<{ url: string, filename: string, size: number }>}
 */
export function uploadMemberAvatar(id, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/members/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 按会员 ID 读取头像的地址（可直接用作 `<img src>`）
 *
 * 后端按会员 ID 定位 `avatars/{会员ID}/` 目录，未上传过时返回系统默认头像；
 * 重新上传后文件名会变，所以这里用 `version` 变化来强制刷新（避免命中缓存）。
 * @param {number} id 会员 ID
 * @param {string|number} [version] 头像版本号（上传后传入新的 url 或时间戳）
 */
export function memberAvatarUrl(id, version = '') {
  if (!id) return ''
  const url = `${API_BASE}/members/${id}/avatar`
  return version ? `${url}?v=${encodeURIComponent(String(version))}` : url
}

/**
 * 后台代会员上传背景图（multipart，字段名 file）
 * @param {number} id 会员 ID
 * @param {File} file 图片文件（jpg/jpeg/png/webp/gif，≤ 5MB）
 * @returns {Promise<{ url: string, filename: string, size: number }>}
 */
export function uploadMemberBackground(id, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/members/${id}/background`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 按会员 ID 读取背景图的地址（可直接用作 `<img src>`）
 *
 * 与头像不同：**背景没有默认图**，未上传时这个接口会 404（前端请先判断
 * `background_url` 是否为空，空就按「没背景图」展示）。
 * @param {number} id 会员 ID
 * @param {string|number} [version] 版本号（上传后传入新的 url 或时间戳）
 */
export function memberBackgroundUrl(id, version = '') {
  if (!id) return ''
  const url = `${API_BASE}/members/${id}/background`
  return version ? `${url}?v=${encodeURIComponent(String(version))}` : url
}

// ==================== 会员端（需会员令牌，后台项目一般调不到） ====================
/**
 * 会员自助上传头像：`POST /member/profile/avatar`
 * 注意：需要**会员令牌**，后台管理员令牌调用会返回 401。
 * 上传后头像地址通过资料接口（`GET /member/profile`）的 `avatar_url` 取回。
 */
export function uploadMyAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/member/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
