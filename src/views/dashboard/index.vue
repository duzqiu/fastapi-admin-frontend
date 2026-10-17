<template>
  <div class="page-container">
    <PageHeader :title="`你好，${userStore.displayName}`" description="今天的运行概览：会员、账号与近一周新增">
      <span class="stamp">{{ today }}</span>
    </PageHeader>

    <div v-loading="loading" class="metrics">
      <article v-for="card in cards" :key="card.key" class="metric">
        <span class="metric__label">{{ card.label }}</span>
        <strong class="metric__value">{{ formatNumber(card.value) }}</strong>
        <span class="metric__foot">
          <span class="metric__dot" :style="{ background: card.color }" />
          {{ card.extra }}
        </span>
        <span class="metric__rule" :style="{ background: card.color }" aria-hidden="true" />
      </article>
    </div>

    <!-- 常用入口：避免首页只剩几张读数卡，顺手就能进到最常维护的几页 -->
    <section class="quick">
      <div class="quick__head">
        <span class="section-label">常用入口</span>
        <span class="quick__hint">日常维护频率最高的几页</span>
      </div>

      <div class="quick__grid">
        <RouterLink v-for="item in quickLinks" :key="item.path" :to="item.path" class="quick__item">
          <span class="quick__icon">
            <el-icon :size="17"><component :is="item.icon" /></el-icon>
          </span>
          <span class="quick__text">
            <span class="quick__label">{{ item.label }}</span>
            <span class="quick__desc">{{ item.desc }}</span>
          </span>
          <el-icon class="quick__arrow" :size="14"><ArrowRight /></el-icon>
        </RouterLink>
      </div>
    </section>
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
})

const today = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
})

const quickLinks = [
  { path: '/dishes', label: '菜品列表', desc: '菜名、价格、库存与套餐', icon: 'Bowl' },
  { path: '/members', label: '用户列表', desc: '会员档案与启用状态', icon: 'Avatar' },
  { path: '/dish-orders', label: '订单管理', desc: '接单、完成与取消', icon: 'Tickets' },
  { path: '/countdowns', label: '倒数日', desc: '会员的纪念日与提醒', icon: 'AlarmClock' },
]

const cards = computed(() => [
  {
    key: 'members',
    label: '注册会员',
    value: stats.value.member_total,
    extra: `启用中 ${stats.value.member_active} 人`,
    color: 'var(--cat-2-ink)',
  },
  {
    key: 'member_new',
    label: '近 7 天新增',
    value: stats.value.member_new_7_days,
    extra: '新注册会员',
    color: 'var(--leaf-text)',
  },
  {
    key: 'users',
    label: '后台账号',
    value: stats.value.user_total,
    extra: `启用中 ${stats.value.user_active} 人`,
    color: 'var(--cat-3-ink)',
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
.stamp {
  padding: 5px 11px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--input-bg);
  box-shadow: var(--edge);
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-soft);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

/* 读数卡：标签 → 显示级数字 → 脚注，底边一道分类色细线 */
.metric {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 22px 22px;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: var(--edge), var(--e1);

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink-soft);
  }

  &__value {
    font-family: var(--font-mono);
    font-size: var(--fs-display-l);
    font-weight: 650;
    line-height: 1.05;
    letter-spacing: -0.04em;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  &__foot {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 4px;
    font-size: 11.5px;
    color: var(--ink-faint);
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    flex: none;
  }

  &__rule {
    position: absolute;
    left: 22px;
    right: 22px;
    bottom: 0;
    height: 2px;
    opacity: 0.55;
  }
}

/* ── 常用入口 ───────────────────────────────────────────────── */
.quick {
  margin-top: 26px;
}

.quick__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}

.quick__hint {
  font-size: 11.5px;
  color: var(--ink-faint);
}

.quick__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}

.quick__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: var(--edge), var(--e1);
  color: var(--ink);
  transition:
    box-shadow 0.2s ease,
    transform 0.24s var(--ease-premium),
    border-color 0.2s ease;

  &:hover {
    border-color: rgba(var(--shade), 0.16);
    box-shadow: var(--e2), var(--edge-strong);
    transform: translateY(-1px);
  }
}

.quick__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: var(--r-xs);
  background: var(--blue-soft);
  color: var(--blue);
}

.quick__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.quick__label {
  font-size: 13px;
  font-weight: 640;
}

.quick__desc {
  font-size: 11.5px;
  color: var(--ink-soft);
}

.quick__arrow {
  margin-left: auto;
  color: var(--ink-faint);
  transition: color 0.2s ease, transform 0.2s ease;
}

.quick__item:hover .quick__arrow {
  color: var(--blue);
  transform: translateX(2px);
}
</style>
