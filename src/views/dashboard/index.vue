<template>
  <div class="page-container">
    <PageHeader :title="`你好，${userStore.displayName}`" description="这里是系统运行概览" />

    <!-- 统计卡片 -->
    <div v-loading="loading" class="stat-grid">
      <div v-for="card in cards" :key="card.key" class="stat-card app-card">
        <div class="stat-card__icon" :style="{ background: card.bg, color: card.color }">
          <el-icon :size="20"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__label">{{ card.label }}</span>
          <strong class="stat-card__value">{{ formatNumber(card.value) }}</strong>
          <span class="stat-card__extra">{{ card.extra }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

import { fetchDashboard } from '@/api/system'
import PageHeader from '@/components/PageHeader.vue'
import { useUserStore } from '@/stores/user'
import { formatNumber } from '@/utils/format'

const userStore = useUserStore()

const loading = ref(false)
const stats = ref({
  user_total: 0,
  user_active: 0,
  member_total: 0,
  member_active: 0,
  member_disabled: 0,
  member_new_7_days: 0,
  article_total: 0,
  article_published: 0,
  article_draft: 0,
  article_views: 0,
})

const cards = computed(() => [
  {
    key: 'members',
    label: '注册会员',
    value: stats.value.member_total,
    extra: `启用中 ${stats.value.member_active} 人`,
    icon: 'Avatar',
    color: '#4f46e5',
    bg: 'rgba(79, 70, 229, 0.12)',
  },
  {
    key: 'member_new',
    label: '近 7 天新增',
    value: stats.value.member_new_7_days,
    extra: '新注册会员',
    icon: 'TrendCharts',
    color: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.12)',
  },
  {
    key: 'users',
    label: '后台账号',
    value: stats.value.user_total,
    extra: `启用中 ${stats.value.user_active} 人`,
    icon: 'User',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
  },
  {
    key: 'articles',
    label: '文章总数',
    value: stats.value.article_total,
    extra: `已发布 ${stats.value.article_published} 篇`,
    icon: 'Document',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
  },
  {
    key: 'draft',
    label: '草稿',
    value: stats.value.article_draft,
    extra: '待完善',
    icon: 'EditPen',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.14)',
  },
  {
    key: 'views',
    label: '累计浏览量',
    value: stats.value.article_views,
    extra: '详情页访问',
    icon: 'View',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
])

async function loadAll() {
  loading.value = true
  try {
    stats.value = await fetchDashboard()
  } catch (error) {
    // 请求失败已由 axios 拦截器统一提示
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped lang="scss">
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(176px, 1fr));
  gap: 14px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 16px;

  &__icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__label {
    font-size: 12px;
    color: var(--app-text-secondary);
  }

  &__value {
    font-size: 22px;
    line-height: 1.3;
    color: var(--app-text);
  }

  &__extra {
    font-size: 11px;
    color: var(--app-text-placeholder);
  }
}
</style>
