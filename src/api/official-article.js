import request from './request'

export function fetchOfficialArticles(params) {
  return request.get('/official-articles', { params })
}

export function fetchOfficialArticle(id) {
  return request.get(`/official-articles/${id}`)
}

export function createOfficialArticle(data) {
  return request.post('/official-articles', data)
}

export function updateOfficialArticle(id, data) {
  return request.put(`/official-articles/${id}`, data)
}

export function auditOfficialArticle(id, status) {
  return request.patch(`/official-articles/${id}/status`, { status })
}

export function deleteOfficialArticle(id) {
  return request.delete(`/official-articles/${id}`)
}
