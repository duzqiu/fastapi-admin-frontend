/** 与后端保持一致的枚举常量 */

/** 系统显示名称（侧边栏、浏览器标题、登录页统一使用此常量） */
export const APP_NAME = '后台管理系统'

export const USER_ROLES = [
  { value: 'admin', label: '管理员', tag: 'danger' },
  { value: 'editor', label: '编辑', tag: 'warning' },
  { value: 'user', label: '普通用户', tag: 'info' },
]

/** 用户中心会员性别（与后端 MemberGender 一致） */
export const MEMBER_GENDERS = [
  { value: 'unknown', label: '保密', tag: 'info', icon: 'QuestionFilled' },
  { value: 'male', label: '男', tag: 'primary', icon: 'Male' },
  { value: 'female', label: '女', tag: 'danger', icon: 'Female' },
]

/** 菜品售卖状态（与后端 DishStatus 一致） */
export const DISH_STATUS = [
  { value: 'on_sale', label: '在售', tag: 'success' },
  { value: 'off_shelf', label: '已下架', tag: 'info' },
  { value: 'sold_out', label: '已售罄', tag: 'warning' },
]

/** 订单状态（与后端 OrderStatus 一致） */
export const ORDER_STATUS = [
  { value: 'pending', label: '待接单', tag: 'warning' },
  { value: 'confirmed', label: '已接单', tag: 'primary' },
  { value: 'completed', label: '已完成', tag: 'success' },
  { value: 'cancelled', label: '已取消', tag: 'info' },
]

/** 标签可选颜色（对应 Element Plus 语义色） */
export const TAG_COLORS = [
  { value: '', label: '默认' },
  { value: 'primary', label: '蓝色' },
  { value: 'success', label: '绿色' },
  { value: 'warning', label: '橙色' },
  { value: 'danger', label: '红色' },
  { value: 'info', label: '灰色' },
]

const findOption = (options, value) => options.find((item) => item.value === value)

export const roleLabel = (value) => findOption(USER_ROLES, value)?.label || value
export const roleTagType = (value) => findOption(USER_ROLES, value)?.tag || 'info'

export const genderLabel = (value) => findOption(MEMBER_GENDERS, value)?.label || '保密'
export const genderTagType = (value) => findOption(MEMBER_GENDERS, value)?.tag || 'info'
export const genderIcon = (value) => findOption(MEMBER_GENDERS, value)?.icon || 'QuestionFilled'

export const dishStatusLabel = (value) => findOption(DISH_STATUS, value)?.label || value
export const dishStatusTagType = (value) => findOption(DISH_STATUS, value)?.tag || 'info'

export const orderStatusLabel = (value) => findOption(ORDER_STATUS, value)?.label || value
export const orderStatusTagType = (value) => findOption(ORDER_STATUS, value)?.tag || 'info'
