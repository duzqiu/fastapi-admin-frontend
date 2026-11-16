import request from './request'

/**
 * 前台：按渠道取热搜榜单（公开接口，无需登录）
 * 响应：{ source, count, items } —— count 是该渠道启用中的条数，items 只含启用条目
 */
export function fetchHotListBoard(params) {
  return request.get('/hot-lists', { params })
}

/** 前台：可用渠道及各渠道条数（后台的渠道下拉也用它） */
export function fetchHotListSources() {
  return request.get('/hot-lists/sources')
}

/** 后台：热搜榜单条目列表（分页 + 关键词 / 渠道筛选） */
export function fetchHotListItems(params) {
  return request.get('/hot-lists/admin', { params })
}

/** 后台：热搜榜单条目详情 */
export function fetchHotListItem(id) {
  return request.get(`/hot-lists/admin/${id}`)
}

/** 后台：编辑热搜榜单条目（按字段更新） */
export function updateHotListItem(id, data) {
  return request.put(`/hot-lists/admin/${id}`, data)
}

/** 后台：删除热搜榜单条目 */
export function deleteHotListItem(id) {
  return request.delete(`/hot-lists/admin/${id}`)
}
