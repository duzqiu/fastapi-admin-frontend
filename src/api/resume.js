/** 个人简历接口
 *
 * 独立类目，后端收在 `/resume` 前缀下，分两套：
 *
 * 1. **管理端**（需登录）：个人信息 / 教育信息 / 工作经历 / 项目经历 / 自我评价，
 *    五组形状完全一致：分页列表、详情、新增、更新、删除、启停。
 * 2. **对外接口**（`/resume/public/profiles`，无需登录）：给前台展示端取数用。
 *    对外只有一个**合并接口**，一次返回某个人的整份简历（见文件末尾）。
 */

import request from './request'

const BASE = '/resume'

// ------------------------- 个人信息 -------------------------
export function fetchPersonalInfos(params) {
  return request.get(`${BASE}/personal-infos`, { params })
}

export function fetchPersonalInfo(id) {
  return request.get(`${BASE}/personal-infos/${id}`)
}

/**
 * 上传个人头像
 *
 * 只负责落盘并回地址，**不会自动绑定** —— 把返回的 `url` 写进个人信息的
 * `avatar` 字段再保存即可（新建时可以先传好、留在表单里一起提交）。
 * @param {File} file 图片（jpg/jpeg/png/webp/gif/heic/heif，≤ 5MB）
 * @returns {Promise<{ url: string, filename: string, size: number }>}
 */
export function uploadResumeAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`${BASE}/personal-infos/upload-avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function createPersonalInfo(data) {
  return request.post(`${BASE}/personal-infos`, data)
}

export function updatePersonalInfo(id, data) {
  return request.put(`${BASE}/personal-infos/${id}`, data)
}

export function deletePersonalInfo(id) {
  return request.delete(`${BASE}/personal-infos/${id}`)
}

// ------------------------- 教育信息 -------------------------
export function fetchEducations(params) {
  return request.get(`${BASE}/educations`, { params })
}

export function fetchEducation(id) {
  return request.get(`${BASE}/educations/${id}`)
}

export function createEducation(data) {
  return request.post(`${BASE}/educations`, data)
}

export function updateEducation(id, data) {
  return request.put(`${BASE}/educations/${id}`, data)
}

export function deleteEducation(id) {
  return request.delete(`${BASE}/educations/${id}`)
}

// ------------------------- 工作经历 -------------------------
export function fetchWorks(params) {
  return request.get(`${BASE}/work-experiences`, { params })
}

export function fetchWork(id) {
  return request.get(`${BASE}/work-experiences/${id}`)
}

export function createWork(data) {
  return request.post(`${BASE}/work-experiences`, data)
}

export function updateWork(id, data) {
  return request.put(`${BASE}/work-experiences/${id}`, data)
}

export function deleteWork(id) {
  return request.delete(`${BASE}/work-experiences/${id}`)
}

// ------------------------- 项目经历 -------------------------
export function fetchProjects(params) {
  return request.get(`${BASE}/projects`, { params })
}

export function fetchProject(id) {
  return request.get(`${BASE}/projects/${id}`)
}

export function createProject(data) {
  return request.post(`${BASE}/projects`, data)
}

export function updateProject(id, data) {
  return request.put(`${BASE}/projects/${id}`, data)
}

export function deleteProject(id) {
  return request.delete(`${BASE}/projects/${id}`)
}

// ------------------------- 自我评价 -------------------------
export function fetchEvaluations(params) {
  return request.get(`${BASE}/evaluations`, { params })
}

export function fetchEvaluation(id) {
  return request.get(`${BASE}/evaluations/${id}`)
}

export function createEvaluation(data) {
  return request.post(`${BASE}/evaluations`, data)
}

export function updateEvaluation(id, data) {
  return request.put(`${BASE}/evaluations/${id}`, data)
}

export function deleteEvaluation(id) {
  return request.delete(`${BASE}/evaluations/${id}`)
}

// ------------------------- 启用 / 停用 -------------------------
// 五组接口形状一致：PATCH <集合>/{id}/status，body 为 { is_active }
export function updatePersonalInfoStatus(id, isActive) {
  return request.patch(`${BASE}/personal-infos/${id}/status`, { is_active: isActive })
}

export function updateEducationStatus(id, isActive) {
  return request.patch(`${BASE}/educations/${id}/status`, { is_active: isActive })
}

export function updateWorkStatus(id, isActive) {
  return request.patch(`${BASE}/work-experiences/${id}/status`, { is_active: isActive })
}

export function updateProjectStatus(id, isActive) {
  return request.patch(`${BASE}/projects/${id}/status`, { is_active: isActive })
}

export function updateEvaluationStatus(id, isActive) {
  return request.patch(`${BASE}/evaluations/${id}/status`, { is_active: isActive })
}

// ------------------------- 对外接口（前台展示端用，无需登录） -------------------------
// 对应后端 `/resume/public/profiles`，对外**只有一个合并接口**：
// - 只返回启用状态的数据（记录自己启用，且各级父级也启用）；
// - 一次拿全：个人信息 + 教育经历 + 工作经历（每条自带其下的项目经历）+ 自我评价；
// - 传 personal_info_id 只取这个人（不存在或已停用 → 404），不传取所有启用中的人；
// - 两种情况都返回**数组**，结构一致，前端可以按同一套逻辑渲染；
// - 出参不含 is_active / sort / 创建时间等内部字段，顺序由后端保证（sort 升序）。
//
// 结构：
//   [{ personal_info, educations[], work_experiences[{ ..., projects[] }], evaluations[] }]

/**
 * 整份简历
 * @param {{ personal_info_id?: number, limit?: number }} params
 *        personal_info_id 传了就只取这一个人；不传则取所有启用中的人（limit 控制人数）
 */
export function fetchPublicProfiles(params) {
  return request.get(`${BASE}/public/profiles`, { params })
}
