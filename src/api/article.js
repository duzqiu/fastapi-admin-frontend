/** 文章管理接口 */

import request from './request'

/**
 * 文章列表
 * @param {{ page?: number, page_size?: number, keyword?: string, status?: string, author_id?: number }} params
 */
export function fetchArticles(params) {
  return request.get('/articles', { params })
}

/** 文章详情（后端会累加浏览量） */
export function fetchArticle(id) {
  return request.get(`/articles/${id}`)
}

/** 创建文章 */
export function createArticle(data) {
  return request.post('/articles', data)
}

/** 更新文章 */
export function updateArticle(id, data) {
  return request.put(`/articles/${id}`, data)
}

/** 修改文章状态 */
export function updateArticleStatus(id, status) {
  return request.patch(`/articles/${id}/status`, { status })
}

/** 删除文章 */
export function deleteArticle(id) {
  return request.delete(`/articles/${id}`)
}
