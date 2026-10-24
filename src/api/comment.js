/**
 * 评论管理接口（后台，需管理员）
 *
 * 用户发评论走 `/posts/{id}/comments`（C 端，默认待审核）；
 * 这里只封装后台的列表 / 审核 / 删除。
 */

import request from './request'

export function fetchComments(params) {
  return request.get('/comments', { params })
}

/** 审核：status 只能是 approved（已通过）或 rejected（已拒绝） */
export function auditComment(id, status) {
  return request.patch(`/comments/${id}/status`, { status })
}

export function deleteComment(id) {
  return request.delete(`/comments/${id}`)
}
