/** 系统相关接口 */

import request from './request'

/** 健康检查（无需登录） */
export function fetchHealth() {
  return request.get('/system/health')
}

/** 系统运行信息（管理员） */
export function fetchSystemInfo() {
  return request.get('/system/info')
}

/** 后台首页统计数据（管理员） */
export function fetchDashboard() {
  return request.get('/system/dashboard')
}
