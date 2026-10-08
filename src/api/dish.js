/**
 * 点菜菜单后台管理接口
 *
 * 说明：C 端「点菜菜单」接口位于 `/menu/**`（浏览公开、下单可匿名），
 * 本文件封装后台管理用到的 `/dishes`、`/dish-categories`、`/dish-tags`、`/dish-orders`。
 */

import request from './request'

// ==================== 菜品 ====================
export function fetchDishes(params) {
  return request.get('/dishes', { params })
}

export function fetchDish(id) {
  return request.get(`/dishes/${id}`)
}

export function createDish(data) {
  return request.post('/dishes', data)
}

export function updateDish(id, data) {
  return request.put(`/dishes/${id}`, data)
}

/** 上架 / 下架 / 售罄 */
export function updateDishStatus(id, status) {
  return request.patch(`/dishes/${id}/status`, { status })
}

/** 调整库存：mode = set 直接设置 / add 增减 */
export function updateDishStock(id, quantity, mode = 'set') {
  return request.patch(`/dishes/${id}/stock`, { quantity, mode })
}

export function deleteDish(id) {
  return request.delete(`/dishes/${id}`)
}

export function fetchDishStats() {
  return request.get('/dishes/stats')
}

/** 上传菜品图片（返回 { url, filename, size }） */
export function uploadDishImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/dishes/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ==================== 套餐 / 规格 ====================
export function fetchDishSpecs(dishId) {
  return request.get(`/dishes/${dishId}/specs`)
}

export function createDishSpec(dishId, data) {
  return request.post(`/dishes/${dishId}/specs`, data)
}

export function updateDishSpec(dishId, specId, data) {
  return request.put(`/dishes/${dishId}/specs/${specId}`, data)
}

export function deleteDishSpec(dishId, specId) {
  return request.delete(`/dishes/${dishId}/specs/${specId}`)
}

// ==================== 分类 ====================
export function fetchCategories(params) {
  return request.get('/dish-categories', { params })
}

export function createCategory(data) {
  return request.post('/dish-categories', data)
}

export function updateCategory(id, data) {
  return request.put(`/dish-categories/${id}`, data)
}

export function deleteCategory(id) {
  return request.delete(`/dish-categories/${id}`)
}

// ==================== 标签 ====================
export function fetchTags(params) {
  return request.get('/dish-tags', { params })
}

export function createTag(data) {
  return request.post('/dish-tags', data)
}

export function updateTag(id, data) {
  return request.put(`/dish-tags/${id}`, data)
}

export function deleteTag(id) {
  return request.delete(`/dish-tags/${id}`)
}

// ==================== 订单 ====================
export function fetchDishOrders(params) {
  return request.get('/dish-orders', { params })
}

export function fetchDishOrder(id) {
  return request.get(`/dish-orders/${id}`)
}

/** 修改订单状态：pending / confirmed / completed / cancelled */
export function updateDishOrderStatus(id, status) {
  return request.patch(`/dish-orders/${id}/status`, { status })
}

export function deleteDishOrder(id) {
  return request.delete(`/dish-orders/${id}`)
}

export function fetchDishOrderStats() {
  return request.get('/dish-orders/stats')
}

/** 菜品销量排行（按订单明细聚合） */
export function fetchDishSales(limit = 10) {
  return request.get('/dish-orders/dish-sales', { params: { limit } })
}
