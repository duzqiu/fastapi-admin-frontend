<template>
  <div class="layout" :class="{ 'layout--collapsed': appStore.sidebarCollapsed }">
    <!-- 侧边栏 -->
    <aside class="layout__aside">
      <div class="brand">
        <transition name="fade">
          <span v-show="!appStore.sidebarCollapsed" class="brand__name">
            {{ appStore.projectName }}
          </span>
        </transition>
      </div>

      <el-scrollbar class="layout__menu-wrap">
        <el-menu
          :default-active="activeMenu"
          :default-openeds="defaultOpeneds"
          :collapse="appStore.sidebarCollapsed"
          :collapse-transition="false"
          class="layout__menu"
          router
          background-color="transparent"
          text-color="var(--app-sidebar-text)"
          active-text-color="#ffffff"
        >
          <template v-for="item in visibleMenus">
            <!-- 一级菜单（分组）：可展开的子菜单 -->
            <el-sub-menu v-if="item.children" :key="item.key" :index="item.key">
              <template #title>
                <el-icon><component :is="item.icon" /></el-icon>
                <span>{{ item.title }}</span>
              </template>

              <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
                <el-icon><component :is="child.meta.icon" /></el-icon>
                <template #title>{{ child.meta.title }}</template>
              </el-menu-item>
            </el-sub-menu>

            <!-- 普通菜单项 -->
            <el-menu-item v-else :key="item.path" :index="item.path">
              <el-icon><component :is="item.meta.icon" /></el-icon>
              <template #title>{{ item.meta.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </aside>

    <!-- 主体 -->
    <div class="layout__body">
      <header class="layout__header">
        <div class="layout__header-left">
          <el-button text class="collapse-btn" @click="appStore.toggleSidebar()">
            <el-icon :size="18">
              <component :is="appStore.sidebarCollapsed ? 'Expand' : 'Fold'" />
            </el-icon>
          </el-button>

          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="parentTitle">{{ parentTitle }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle !== '仪表盘'">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="layout__header-right">
          <el-dropdown trigger="click" @command="onCommand">
            <div class="user-chip">
              <el-avatar :size="30" class="user-chip__avatar">{{ userStore.avatarText }}</el-avatar>
              <div class="user-chip__info">
                <span class="user-chip__name">{{ userStore.displayName }}</span>
                <span class="user-chip__role">{{ roleLabel(userStore.profile?.role) }}</span>
              </div>
              <el-icon class="user-chip__arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="layout__main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>

      <!-- 监管信息：常驻页面最底部，不随内容滚动 -->
      <div class="layout__footer">
        <PageFooter />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import PageFooter from '@/components/PageFooter.vue'
import { findParentTitle, menuTree } from '@/router/menu'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { roleLabel } from '@/constants'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '')
const parentTitle = computed(() => findParentTitle(route.path))

/** 默认展开当前页所在的一级菜单（直接通过 URL 进入子页面时也能看到选中项） */
const defaultOpeneds = computed(() => {
  const group = menuTree.find((item) => item.children?.some((child) => child.path === route.path))
  return group ? [group.key] : []
})

function canAccess(roles) {
  return !roles?.length || roles.includes(userStore.profile?.role)
}

/** 按角色过滤菜单；分组会先过滤子项，子项全被过滤掉时整组不展示 */
const visibleMenus = computed(() =>
  menuTree
    .filter((item) =>
      item.children ? canAccess(item.roles) : !item.meta?.hidden && canAccess(item.meta?.roles),
    )
    .map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.filter(
              (child) => !child.meta?.hidden && canAccess(child.meta?.roles),
            ),
          }
        : item,
    )
    .filter((item) => !item.children || item.children.length > 0),
)

async function onCommand(command) {
  if (command === 'profile') {
    router.push('/profile')
    return
  }
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        type: 'warning',
        confirmButtonText: '退出',
        cancelButtonText: '取消',
      })
    } catch (error) {
      return
    }
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  }
}

</script>

<style scoped lang="scss">
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--app-bg);

  &__aside {
    display: flex;
    flex-direction: column;
    width: var(--app-sidebar-width);
    flex-shrink: 0;
    background: linear-gradient(180deg, #161d2f 0%, var(--app-sidebar-bg) 100%);
    transition: width 0.24s ease;
  }

  &--collapsed &__aside {
    width: var(--app-sidebar-collapsed-width);
  }

  &__menu-wrap {
    flex: 1;
    padding: 8px;
  }

  &__menu {
    border-right: none;

    /* 折叠态：EP 把菜单写死成 64px（24px 图标 + 20px 内边距 ×2），
       而菜单外层 __menu-wrap 还有 8px 内边距，可用宽度只有 48px，
       于是溢出 16px —— 高亮块右半边被裁掉（右侧圆角消失）。
       所以先让它填满可用宽度。 */
    &.el-menu--collapse {
      width: 100%;

      /* 宽度不再是 64px 后，EP 那套「靠左右各 20px 内边距凑出居中」就失准了，
         所以这里显式做内容居中。两类行的内部结构不同，都要覆盖：
         - el-sub-menu__title：图标/文字是直接子元素，靠 justify-content 居中；
         - el-menu-item：内容被包进一层绝对定位的 .el-menu-tooltip__trigger
           （它自带 padding: 0 var(--el-menu-base-level-padding)=20px），
           给 item 设 justify-content 对它无效，必须落到那一层上。 */
      :deep(> .el-menu-item),
      :deep(> .el-sub-menu > .el-sub-menu__title) {
        padding: 0 !important;
        justify-content: center;
      }

      :deep(> .el-menu-item > .el-menu-tooltip__trigger),
      :deep(> .el-sub-menu > .el-sub-menu__title > .el-menu-tooltip__trigger) {
        padding: 0;
        justify-content: center;
      }
    }

    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      height: 44px;
      margin-bottom: 4px;
      border-radius: var(--app-radius-sm);
      font-size: 14px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.06) !important;
        color: #fff !important;
      }
    }

    :deep(.el-menu-item.is-active) {
      background: linear-gradient(90deg, var(--app-primary) 0%, var(--app-primary-light) 100%);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
    }

    :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
      color: #fff !important;
    }

    /* 展开状态下的二级菜单：加深底色 + 缩进，层级更清晰 */
    :deep(.el-menu--inline) {
      padding: 4px;
      border-radius: var(--app-radius-sm);
      background-color: rgba(0, 0, 0, 0.18) !important;
    }

    :deep(.el-menu--inline .el-menu-item) {
      height: 40px;
      margin-bottom: 2px;
      padding-left: 34px !important;
      font-size: 13px;
    }

    /* 折叠状态下的弹出子菜单样式在全局样式中定义：
       弹出层被 teleport 到 body，组件内的 scoped 样式无法命中 */
  }

  &__body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--app-header-height);
    padding: 0 20px 0 8px;
    background: var(--app-surface);
    border-bottom: 1px solid var(--app-border);
    flex-shrink: 0;
  }

  &__header-left,
  &__header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__main {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  // 监管信息常驻底部：放在 __main 之外，flex-shrink: 0 保证不被挤掉，
  // 做成底栏样式（上边框 + 底色）与 __header 呼应
  &__footer {
    flex-shrink: 0;
    padding: 10px 20px;
    background: var(--app-surface);
    border-top: 1px solid var(--app-border);
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--app-header-height);
  padding: 0 16px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &__name {
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
  }
}

.collapse-btn {
  color: var(--app-text-secondary);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border-radius: 24px;
  cursor: pointer;
  outline: none;
  transition: background 0.2s ease;

  &:hover {
    background: var(--app-primary-soft);
  }

  &__avatar {
    background: linear-gradient(135deg, var(--app-primary), var(--app-primary-light));
    color: #fff;
    font-size: 14px;
  }

  &__info {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  &__name {
    font-size: 13px;
    font-weight: 600;
    color: var(--app-text);
  }

  &__role {
    font-size: 11px;
    color: var(--app-text-placeholder);
  }

  &__arrow {
    color: var(--app-text-placeholder);
    font-size: 12px;
  }
}

</style>
