/** 个人网站设置接口（后台管理端，需登录） */

import request from './request'

const BASE = '/site/admin'

export function fetchSiteWelcome() {
  return request.get(`${BASE}/welcome`)
}

export function updateSiteWelcome(data) {
  return request.put(`${BASE}/welcome`, data)
}

export function fetchAboutPasswordStatus() {
  return request.get(`${BASE}/about-password`)
}

export function updateAboutPassword(password) {
  return request.put(`${BASE}/about-password`, { password })
}
