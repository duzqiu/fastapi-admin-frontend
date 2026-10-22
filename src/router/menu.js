/**
 * 侧边栏菜单结构（同时被 router 与 Layout 引用）
 *
 * 支持一层分组：带 `children` 的节点在侧边栏渲染为可展开的一级菜单，
 * 本身不产生路由；其 `children` 会被拍平成真实路由。
 *
 * meta 约定：
 *   title  页面标题（菜单文案 / 浏览器标题 / 面包屑）
 *   icon   Element Plus 图标组件名
 *   roles  允许访问的角色，不写表示所有登录用户可访问
 *   hidden 是否在侧边栏隐藏（路由依然可用，如个人中心）
 */

const menuStructure = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '仪表盘', icon: 'Odometer' },
  },
  {
    // 一级菜单：后台管理
    key: 'admin',
    title: '后台管理',
    icon: 'Management',
    roles: ['admin'],
    children: [
      {
        // 后台账号：能登录这个后台系统的账号（与「用户列表」里的 C 端会员不是一回事）
        path: '/users',
        name: 'Users',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '后台账号', icon: 'User', roles: ['admin'] },
      },
    ],
  },
  {
    // 一级菜单：用户管理
    key: 'user',
    title: '用户管理',
    icon: 'UserFilled',
    roles: ['admin'],
    children: [
      {
        path: '/members',
        name: 'Members',
        component: () => import('@/views/member/index.vue'),
        meta: { title: '用户列表', icon: 'Avatar', roles: ['admin'] },
      },
    ],
  },
  {
    // 一级菜单：菜品管理
    key: 'dish',
    title: '菜品管理',
    icon: 'Bowl',
    roles: ['admin'],
    children: [
      {
        path: '/dishes',
        name: 'Dishes',
        component: () => import('@/views/dish/index.vue'),
        meta: { title: '菜品列表', icon: 'Dish', roles: ['admin'] },
      },
      {
        path: '/dish-categories',
        name: 'DishCategories',
        component: () => import('@/views/dish/category.vue'),
        meta: { title: '菜品分类', icon: 'FolderOpened', roles: ['admin'] },
      },
      {
        path: '/dish-tags',
        name: 'DishTags',
        component: () => import('@/views/dish/tag.vue'),
        meta: { title: '菜品标签', icon: 'CollectionTag', roles: ['admin'] },
      },
      {
        path: '/dish-orders',
        name: 'DishOrders',
        component: () => import('@/views/dish/order.vue'),
        meta: { title: '订单管理', icon: 'Tickets', roles: ['admin'] },
      },
    ],
  },
  {
    // 一级菜单：文章管理
    key: 'article',
    title: '文章管理',
    icon: 'Collection',
    roles: ['admin'],
    children: [
      {
        path: '/posts',
        name: 'Posts',
        component: () => import('@/views/article/post.vue'),
        meta: { title: '帖子管理', icon: 'Document', roles: ['admin'] },
      },
    ],
  },
  {
    // 一级菜单：代办事项
    key: 'todo',
    title: '代办事项',
    icon: 'Calendar',
    roles: ['admin'],
    children: [
      {
        path: '/countdowns',
        name: 'Countdowns',
        component: () => import('@/views/todo/countdown.vue'),
        meta: { title: '倒数日', icon: 'AlarmClock', roles: ['admin'] },
      },
    ],
  },
  {
    // 一级菜单：个人网站（站点设置 + 六块简历数据各自一页）
    key: 'resume',
    title: '个人网站',
    icon: 'Monitor',
    roles: ['admin'],
    children: [
      {
        path: '/site-welcome',
        name: 'SiteWelcome',
        component: () => import('@/views/site/welcome.vue'),
        meta: { title: '欢迎语', icon: 'HomeFilled', roles: ['admin'] },
      },
      {
        path: '/site-about-password',
        name: 'SiteAboutPassword',
        component: () => import('@/views/site/about-password.vue'),
        meta: { title: '解锁密码', icon: 'Lock', roles: ['admin'] },
      },
      {
        path: '/resume-personal',
        name: 'ResumePersonal',
        component: () => import('@/views/resume/profile.vue'),
        meta: { title: '个人信息', icon: 'User', roles: ['admin'] },
      },
      {
        // 个人信息下面是技能标签：分类 + 多个标签
        path: '/resume-skill',
        name: 'ResumeSkill',
        component: () => import('@/views/resume/skill.vue'),
        meta: { title: '技能标签', icon: 'PriceTag', roles: ['admin'] },
      },
      {
        path: '/resume-education',
        name: 'ResumeEducation',
        component: () => import('@/views/resume/education.vue'),
        meta: { title: '教育信息', icon: 'School', roles: ['admin'] },
      },
      {
        path: '/resume-experience',
        name: 'ResumeExperience',
        component: () => import('@/views/resume/experience.vue'),
        meta: { title: '工作经历', icon: 'Suitcase', roles: ['admin'] },
      },
      {
        path: '/resume-project',
        name: 'ResumeProject',
        component: () => import('@/views/resume/project.vue'),
        meta: { title: '项目经历', icon: 'Folder', roles: ['admin'] },
      },
      {
        path: '/resume-evaluation',
        name: 'ResumeEvaluation',
        component: () => import('@/views/resume/evaluation.vue'),
        meta: { title: '自我评价', icon: 'ChatLineSquare', roles: ['admin'] },
      },
    ],
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: { title: '个人中心', icon: 'Setting', hidden: true },
  },
]

/** 侧边栏菜单树（含分组），供 Layout 渲染使用 */
export const menuTree = menuStructure

/** 拍平后的真实路由，供 router 注册使用 */
export const menuRoutes = menuStructure.flatMap((item) => (item.children ? item.children : [item]))

/** 根据当前路径找出所属的一级菜单标题（用于面包屑） */
export function findParentTitle(path) {
  const group = menuStructure.find(
    (item) => item.children && item.children.some((child) => child.path === path),
  )
  return group?.title || ''
}

export default menuRoutes
