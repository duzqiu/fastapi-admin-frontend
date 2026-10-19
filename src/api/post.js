/**
 * 文章管理（帖子）接口
 *
 * 后台管理用 `/posts`（需管理员）；用户发帖同样是 `POST /posts`，
 * 但由 C 端调用、默认进「待审核」，这里也一并封装，方便联调。
 */

import request from './request'

export function fetchPosts(params) {
  return request.get('/posts', { params })
}

export function fetchPost(id) {
  return request.get(`/posts/${id}`)
}

/** 审核：status 只能是 approved（已通过）或 rejected（已拒绝） */
export function auditPost(id, status) {
  return request.patch(`/posts/${id}/status`, { status })
}

export function deletePost(id) {
  return request.delete(`/posts/${id}`)
}

/** 用户发帖：{ publisher, title, content, images: [], published_at } */
export function createPost(data) {
  return request.post('/posts', data)
}
