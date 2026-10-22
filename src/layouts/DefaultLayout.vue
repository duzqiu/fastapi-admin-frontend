<template>
  <!-- 舞台：整页衬底，外面一圈深色外框，里面才是导航轨 + 工作区 -->
  <div class="stage">
    <div
      class="app-frame"
      :class="{ 'is-collapsed': appStore.sidebarCollapsed, 'is-mobile-open': mobileOpen }"
    >
      <!-- ── 导航轨 ─────────────────────────────────────────── -->
      <aside class="rail m-rail" aria-label="主导航">
        <div class="rail-brand">
          <span class="brand-mark" aria-hidden="true"><span class="brand-dot" /></span>
          <div class="brand-text">
            <div class="brand-name">{{ appStore.projectName }}</div>
            <div class="brand-sub">Admin Console</div>
          </div>
        </div>

        <nav ref="navEl" class="rail-nav">
          <span ref="thumbEl" class="nav-thumb m-pill" :style="thumbStyle" aria-hidden="true" />

          <div v-for="group in groups" :key="group.key" class="nav-group">
            <button
              v-if="group.title"
              type="button"
              class="nav-group-title"
              :class="{ 'is-collapsed': !isGroupOpen(group.key) }"
              :aria-expanded="isGroupOpen(group.key)"
              :title="group.title"
              @click="toggleGroup(group.key)"
            >
              <span class="nav-group-title__text">{{ group.title }}</span>
              <el-icon class="nav-group-caret" :size="12"><ArrowDown /></el-icon>
            </button>

            <!-- 直接切换显示：高度动画会让下面的分组「撑开」，选中框也会飘 -->
            <div v-show="isGroupOpen(group.key)" class="nav-list">
              <RouterLink
                v-for="item in group.items"
                :key="item.path"
                :to="item.path"
                class="nav-item"
                :class="{
                  'is-active': route.path === item.path,
                  'nav-item--top': group.topLevel,
                }"
                :title="appStore.sidebarCollapsed ? item.label : undefined"
              >
                <!-- 一级叶子菜单（仪表盘）：展开时不带图标，收成图标轨时再显示 -->
                <el-icon
                  v-if="!group.topLevel || railIconOnly()"
                  class="nav-ico"
                  :size="17"
                >
                  <component :is="item.icon" />
                </el-icon>
                <span class="nav-label">{{ item.label }}</span>
              </RouterLink>
            </div>
          </div>
        </nav>

        <div class="rail-foot">
          <button
            type="button"
            class="nav-item rail-foot__btn"
            :aria-label="appStore.sidebarCollapsed ? '展开导航' : '收起导航'"
            @click="appStore.toggleSidebar()"
          >
            <el-icon class="nav-ico" :size="17">
              <component :is="appStore.sidebarCollapsed ? 'Expand' : 'Fold'" />
            </el-icon>
            <span class="nav-label">收起导航</span>
          </button>
        </div>
      </aside>

      <!-- 窄屏抽屉遮罩 -->
      <div v-if="mobileOpen" class="rail-scrim" @click="mobileOpen = false" />

      <!-- ── 工作区 ─────────────────────────────────────────── -->
      <div class="workspace">
        <header class="topbar">
          <button
            type="button"
            class="icon-btn"
            aria-label="切换导航"
            @click="toggleRail"
          >
            <el-icon :size="17"><Operation /></el-icon>
          </button>

          <nav class="crumbs" aria-label="当前位置">
            <span>首页</span>
            <template v-if="parentTitle">
              <el-icon class="crumb-sep" :size="12"><ArrowRight /></el-icon>
              <span>{{ parentTitle }}</span>
            </template>
            <template v-if="currentTitle && currentTitle !== '仪表盘'">
              <el-icon class="crumb-sep" :size="12"><ArrowRight /></el-icon>
              <span class="crumb-current">{{ currentTitle }}</span>
            </template>
          </nav>

          <div class="topbar__spacer" />

          <button type="button" class="icon-btn" aria-label="切换外观" @click="toggleTheme">
            <el-icon :size="17">
              <component :is="theme === 'dark' ? 'Sunny' : 'Moon'" />
            </el-icon>
          </button>

          <el-dropdown trigger="click" @command="onCommand">
            <button type="button" class="user-chip">
              <el-avatar :size="32" class="user-chip__avatar">{{ userStore.avatarText }}</el-avatar>
              <span class="user-chip__meta">
                <span class="user-chip__name">{{ userStore.displayName }}</span>
                <span class="user-chip__role">{{ roleLabel(userStore.profile?.role) }}</span>
              </span>
              <el-icon class="user-chip__arrow" :size="14"><ArrowDown /></el-icon>
            </button>
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
        </header>

        <main class="content">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </main>

        <div class="workspace__footer">
          <PageFooter />
        </div>
      </div>
    </div>

    <div class="grain-layer" aria-hidden="true" />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import PageFooter from '@/components/PageFooter.vue'
import { useTheme } from '@/composables/theme'
import { roleLabel } from '@/constants'
import { findParentTitle, menuTree } from '@/router/menu'
import { useAppStore } from '@/stores/app'
import { useUsageStore } from '@/stores/usage'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const usageStore = useUsageStore()
const userStore = useUserStore()
const { theme, toggleTheme } = useTheme()

const mobileOpen = ref(false)
const navEl = ref(null)
const thumbEl = ref(null)
const thumbStyle = ref({ opacity: 0 })

const currentTitle = computed(() => route.meta?.title || '')
const parentTitle = computed(() => findParentTitle(route.path))

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

/**
 * 导航分组：一级叶子节点单独成组（不显示组标题），
 * 带 children 的分组渲染成「组标题 + 若干导航项」。
 */
const groups = computed(() =>
  visibleMenus.value.map((item) =>
    item.children
      ? {
          key: item.key,
          title: item.title,
          items: item.children.map((child) => ({
            path: child.path,
            label: child.meta.title,
            icon: child.meta.icon,
          })),
        }
      : {
          key: item.path,
          title: '',
          // 一级叶子菜单（仪表盘）：和分组标题同一套字号，不显示图标
          topLevel: true,
          items: [{ path: item.path, label: item.meta.title, icon: item.meta.icon }],
        },
  ),
)

/* ── 二级菜单展开 / 收起 ───────────────────────────────────── */
const narrowQuery = window.matchMedia('(max-width: 820px)')

/**
 * 导航轨收起（桌面 76px）时只剩图标：没有可点的组标题，子项一律展开，
 * 否则被收起来的分组会整组消失、再也点不开。
 */
function railIconOnly() {
  return appStore.sidebarCollapsed && !(narrowQuery.matches && mobileOpen.value)
}

function isGroupOpen(key) {
  if (railIconOnly()) return true
  // 只有本次会话里手动展开过的才显示，默认全部收起
  return appStore.expandedMenus.includes(key)
}

function toggleGroup(key) {
  if (railIconOnly()) return

  // 子项是瞬间增减的：选中框直接落到新位置，别做滑动，否则看起来像错位
  const nav = navEl.value
  nav?.classList.add('is-snapping')
  appStore.toggleMenu(key)
  nextTick(syncThumb)
  window.setTimeout(() => nav?.classList.remove('is-snapping'), 60)
}

/** 切换到某个分组下的页面时把它展开（进入后台时不会调用，保持全部收起） */
function expandActiveGroup(path) {
  const group = groups.value.find(
    (entry) => entry.title && entry.items.some((item) => item.path === path),
  )
  if (group) appStore.expandMenu(group.key)
}

/**
 * 选中项背后那块玻璃：量出当前项的位置，滑过去。
 * 必须用 rect 相对 nav 计算 —— offsetTop 的 offsetParent 是 .nav-list，
 * 量出来的是它在列表内的偏移，跨分组时会差一整段。
 */
function syncThumb() {
  const nav = navEl.value
  const active = nav?.querySelector('.nav-item.is-active')
  if (!nav || !active || !thumbEl.value) {
    thumbStyle.value = { opacity: 0 }
    return
  }

  const navRect = nav.getBoundingClientRect()
  const activeRect = active.getBoundingClientRect()
  // 当前页所在分组被收起时，选中项是隐藏的（高度 0）：不画那块玻璃
  if (!activeRect.height) {
    thumbStyle.value = { opacity: 0 }
    return
  }

  thumbStyle.value = {
    opacity: 1,
    height: `${activeRect.height}px`,
    transform: `translateY(${activeRect.top - navRect.top + nav.scrollTop}px)`,
  }
}

/* ── 一级菜单展开 / 收起 ───────────────────────────────────── */
function toggleRail() {
  if (window.matchMedia('(max-width: 820px)').matches) {
    mobileOpen.value = !mobileOpen.value
    return
  }
  appStore.toggleSidebar()
}

let observer = null

onMounted(() => {
  // 进入后台时二级菜单默认全部收起，这里不展开当前页所在分组
  // 首次进入的那一页也要计入使用频次
  usageStore.record(route.path)
  nextTick(syncThumb)
  observer = new ResizeObserver(syncThumb)
  if (navEl.value) observer.observe(navEl.value)
})

onBeforeUnmount(() => observer?.disconnect())

// 路由变化：进入哪个分组就把它展开，并记一次使用频次
watch(
  () => route.path,
  (path) => {
    expandActiveGroup(path)
    usageStore.record(path)
  },
)

watch(
  () => [route.path, appStore.sidebarCollapsed],
  () => {
    mobileOpen.value = false
    nextTick(syncThumb)
  },
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
/* ── 舞台与外框 ─────────────────────────────────────────────── */
.stage {
  position: relative;
  height: 100dvh;
  padding: 8px;
  overflow: clip;
  background: var(--stage);
}

.app-frame {
  position: relative;
  display: grid;
  grid-template-columns: var(--rail-w) minmax(0, 1fr);
  height: calc(100dvh - 16px);
  min-height: 560px;
  overflow: clip;
  border: 10px solid var(--frame);
  border-radius: 38px;
  /* 画布：两团静态漫射光，不参与动画 */
  background:
    radial-gradient(55% 45% at 92% 0%, var(--ambient-a), transparent 70%),
    radial-gradient(45% 40% at 20% 100%, var(--ambient-b), transparent 70%),
    var(--canvas);
  box-shadow: 0 24px 70px rgba(17, 23, 27, 0.24), 0 3px 12px rgba(17, 23, 27, 0.16);

  &.is-collapsed {
    --rail-w: 76px;
  }
}

/* ── 导航轨 ─────────────────────────────────────────────────── */
.rail {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--line-strong);
}

.rail-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  height: var(--topbar-h);
  padding: 0 18px;
  flex: none;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--r-sm);
  flex: none;
  background: var(--dark-surface);
  box-shadow:
    0 1px 3px rgba(14, 18, 20, 0.16),
    0 6px 16px rgba(14, 18, 20, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.brand-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--lime);
  box-shadow: 0 0 0 4px rgba(130, 221, 45, 0.2), 0 0 12px rgba(130, 221, 45, 0.6);
}

.brand-text {
  min-width: 0;
  /* 品牌名比下面的英文长，让两行按中线对齐 */
  text-align: center;
}

.brand-name {
  font-size: 15px;
  font-weight: 720;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.brand-sub {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
  white-space: nowrap;
  text-transform: uppercase;
}

.rail-nav {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: clip;
  padding: 8px 12px 16px;
}

.nav-group + .nav-group {
  margin-top: 14px;
}

/* 组标题就是二级菜单的折叠开关 */
.nav-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  border: 0;
  border-radius: var(--r-xs);
  background: none;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.06em;
  color: var(--ink-faint);
  white-space: nowrap;
  text-align: left;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;

  &:hover {
    color: var(--ink-muted);
    background: var(--hover-bg);
  }
}

.nav-group-title__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-group-caret {
  flex: none;
  color: var(--ink-faint);
  transition: transform 0.24s var(--ease-premium);
}

.nav-group-title.is-collapsed .nav-group-caret {
  transform: rotate(-90deg);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 滑动玻璃块：一块材质在导航项之间滑，标签与图标不动 */
.nav-thumb {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 0;
  border-radius: var(--r-sm);
  z-index: 0;
  pointer-events: none;
  transition:
    transform 0.34s var(--ease-premium),
    height 0.34s var(--ease-premium),
    opacity 0.2s ease;
}

/* 折叠 / 展开分组的这一下：不要过渡，选中框直接跟到新位置 */
.rail-nav.is-snapping .nav-thumb {
  transition: none;
}

.nav-item {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  height: 38px;
  padding: 0 11px;
  border-radius: var(--r-sm);
  font-size: 12px;
  font-weight: 560;
  color: var(--ink-muted);
  text-align: left;
  white-space: nowrap;
  transition: color 0.2s ease, opacity 0.2s ease;

  .nav-ico {
    color: var(--ink-soft);
    transition: color 0.2s ease;
  }

  &:hover {
    color: var(--ink);
  }

  &.is-active {
    color: var(--ink);
    font-weight: 650;

    .nav-ico {
      color: var(--blue);
    }
  }
}

/* 一级叶子菜单（仪表盘）：字号与分组标题一致；图标只在收起成图标轨时渲染 */
.nav-item--top {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.06em;
  color: var(--ink-faint);

  &:hover {
    color: var(--ink-muted);
  }

  &.is-active {
    color: var(--ink);
  }
}

.nav-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 兄弟项让位：被指向的那一个更清楚 */
@media (hover: hover) {
  .nav-list:has(.nav-item:hover) .nav-item:not(:hover):not(.is-active) {
    opacity: 0.62;
  }
}

.rail-foot {
  padding: 10px 12px 14px;
  border-top: 1px solid var(--line);
  flex: none;
}

.rail-foot__btn {
  color: var(--ink-faint);

  .nav-label {
    font-size: 12.5px;
  }
}

/* 收起态 */
.app-frame.is-collapsed {
  .brand-text,
  .nav-label,
  .nav-group-title {
    display: none;
  }

  .rail-brand {
    padding: 0;
    justify-content: center;
  }

  .nav-item {
    justify-content: center;
    padding: 0;
  }

  /* 只剩图标时，一级叶子项没有文字，得把图标放回来，不然是一行空白 */
  .nav-item--top {
    height: 38px;
  }

  .nav-group + .nav-group {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--line);
  }
}

/* ── 工作区 ─────────────────────────────────────────────────── */
.workspace {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: var(--topbar-h) minmax(0, 1fr) auto;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 0 20px 0 14px;
  border-bottom: 1px solid var(--line);
}

.topbar__spacer {
  flex: 1;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: var(--r-xs);
  color: var(--ink-soft);
  transition: color 0.2s ease, background 0.2s ease;

  &:hover {
    color: var(--ink);
    background: var(--hover-bg);
  }
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12.5px;
  color: var(--ink-soft);
  white-space: nowrap;
}

.crumb-sep {
  color: var(--ink-faint);
}

.crumb-current {
  color: var(--ink);
  font-weight: 620;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 40px;
  padding: 0 10px 0 4px;
  border-radius: 999px;
  background: transparent;
  transition: background 0.2s ease;

  &:hover {
    background: var(--hover-bg);
  }
}

.user-chip__avatar {
  background: linear-gradient(135deg, var(--blue), #6ea3ff);
  color: #fff;
  font-size: 13px;
  flex: none;
}

.user-chip__meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  text-align: left;
}

.user-chip__name {
  font-size: 12.5px;
  font-weight: 640;
  color: var(--ink);
}

.user-chip__role {
  font-size: 11px;
  color: var(--ink-soft);
}

.user-chip__arrow {
  color: var(--ink-soft);
}

.content {
  position: relative;
  min-height: 0;
  overflow-y: auto;
  overflow-x: clip;
  overscroll-behavior: contain;
}

.workspace__footer {
  flex: none;
  padding: 10px 20px;
  border-top: 1px solid var(--line);
}

/* ── 窄屏：导航轨变抽屉 ─────────────────────────────────────── */
.rail-scrim {
  position: fixed;
  inset: 0;
  z-index: 105;
  background: var(--overlay);
}

@media (max-width: 1180px) {
  .app-frame:not(.is-collapsed) {
    --rail-w: 192px;
  }
}

@media (max-width: 1080px) {
  .user-chip__meta {
    display: none;
  }
}

@media (max-width: 820px) {
  .stage {
    padding: 0;
  }

  .app-frame {
    height: 100dvh;
    border: 0;
    border-radius: 0;
    grid-template-columns: minmax(0, 1fr);
  }

  .rail {
    position: fixed;
    inset: 0 auto 0 0;
    width: 260px;
    z-index: 110;
    box-shadow: var(--e3);
    translate: -105% 0;
    transition: translate 0.42s var(--ease-premium);
  }

  .app-frame.is-mobile-open .rail {
    translate: 0 0;
  }

  .app-frame.is-collapsed {
    --rail-w: 0px;
  }

  .app-frame.is-collapsed {
    .brand-text,
    .nav-label {
      display: revert;
    }

    /* 组标题是 button：revert 会回到 UA 默认的 flow-root，这里显式还原成 flex */
    .nav-group-title {
      display: flex;
    }

    .nav-item {
      justify-content: flex-start;
      padding: 0 11px;
    }

    /* 抽屉里文字是可见的，叶子项保持 28px 的标题高度 */
    .nav-item--top {
      height: 28px;
      padding: 0 10px;
    }

    .rail-brand {
      padding: 0 18px;
      justify-content: flex-start;
    }
  }

  .crumbs {
    display: none;
  }

  .topbar {
    padding: 0 12px;
  }

  .workspace__footer {
    padding: 8px 14px;
  }
}
</style>
