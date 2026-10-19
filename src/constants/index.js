/** 与后端保持一致的枚举常量 */

/** 系统显示名称（侧边栏、浏览器标题、登录页统一使用此常量） */
export const APP_NAME = '后台管理系统'

/**
 * 底部监管信息（版权 + 备案号）
 *
 * ⚠️ 目前是**假数据**：每条都带 `-demo` 后缀，方便上线前全局搜索替换成真实信息。
 * 替换时注意备案号里的省份简称（京/沪/粤…）要与实际备案地一致。
 */
export const SITE_LEGAL = {
  /** 版权行；主体建议改成备案的公司全称 */
  copyright: `© ${new Date().getFullYear()} ${APP_NAME} 版权所有-demo`,
  icp: {
    label: '京ICP备00000000号-1-demo',
    link: 'https://beian.miit.gov.cn/',
  },
  police: {
    label: '京公网安备 00000000000000号-demo',
    link: 'https://beian.mps.gov.cn/',
  },
}

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
/** 帖子审核状态（与后端 PostStatus 一致） */
export const POST_STATUS = [
  { value: 'pending', label: '待审核', tag: 'warning' },
  { value: 'approved', label: '已通过', tag: 'success' },
  { value: 'rejected', label: '已拒绝', tag: 'danger' },
]

export const postStatusLabel = (value) =>
  POST_STATUS.find((item) => item.value === value)?.label || value

export const postStatusTagType = (value) =>
  POST_STATUS.find((item) => item.value === value)?.tag || 'info'

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

/** 倒数日重复周期（与后端 CountdownCycle 一致） */
export const COUNTDOWN_CYCLES = [
  { value: 'once', label: '一次性', tag: 'info' },
  { value: 'daily', label: '每天', tag: 'info' },
  { value: 'weekly', label: '每周', tag: 'primary' },
  { value: 'monthly', label: '每月', tag: 'success' },
  { value: 'yearly', label: '每年', tag: 'warning' },
]

/** 个人简历·性别（与后端 ResumeGender 一致，独立于会员性别） */
export const RESUME_GENDERS = [
  { value: 'male', label: '男', tag: 'primary' },
  { value: 'female', label: '女', tag: 'danger' },
  { value: 'secret', label: '保密', tag: 'info' },
]

/** 个人简历·目前状态（与后端 ResumeCurrentStatus 一致） */
export const RESUME_CURRENT_STATUSES = [
  { value: 'resigned', label: '已离职-随时到岗', tag: 'success' },
  { value: 'left', label: '已离职-月内到岗', tag: 'primary' },
  { value: 'employed_open', label: '在职-考虑机会', tag: 'warning' },
  { value: 'employed_closed', label: '在职-暂不考虑', tag: 'info' },
]

/** 个人简历·学历（与后端 EducationDegree 一致） */
export const EDUCATION_DEGREES = [
  { value: 'high_school', label: '高中及以下', tag: 'info' },
  { value: 'college', label: '大专', tag: 'info' },
  { value: 'bachelor', label: '本科', tag: 'primary' },
  { value: 'master', label: '硕士', tag: 'success' },
  { value: 'doctor', label: '博士', tag: 'warning' },
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

export const countdownCycleLabel = (value) => findOption(COUNTDOWN_CYCLES, value)?.label || value
export const countdownCycleTagType = (value) => findOption(COUNTDOWN_CYCLES, value)?.tag || 'info'

export const resumeGenderLabel = (value) => findOption(RESUME_GENDERS, value)?.label || '保密'
export const resumeGenderTagType = (value) => findOption(RESUME_GENDERS, value)?.tag || 'info'

export const resumeCurrentStatusLabel = (value) =>
  findOption(RESUME_CURRENT_STATUSES, value)?.label || ''
export const resumeCurrentStatusTagType = (value) =>
  findOption(RESUME_CURRENT_STATUSES, value)?.tag || 'info'

export const educationDegreeLabel = (value) =>
  findOption(EDUCATION_DEGREES, value)?.label || value
export const educationDegreeTagType = (value) =>
  findOption(EDUCATION_DEGREES, value)?.tag || 'info'
