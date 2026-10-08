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
    // 一级菜单（叶子）：后台账号
    path: '/users',
    name: 'Users',
    component: () => import('@/views/user/index.vue'),
    meta: { title: '后台账号', icon: 'User', roles: ['admin'] },
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
        meta: { title: '会员管理', icon: 'Avatar', roles: ['admin'] },
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
        path: '/dish-meta',
        name: 'DishMeta',
        component: () => import('@/views/dish/meta.vue'),
        meta: { title: '分类与标签', icon: 'CollectionTag', roles: ['admin'] },
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
    // 一级菜单：内容管理
    key: 'content',
    title: '内容管理',
    icon: 'Files',
    children: [
      {
        path: '/articles',
        name: 'Articles',
        component: () => import('@/views/article/index.vue'),
        meta: { title: '文章管理', icon: 'Document' },
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
