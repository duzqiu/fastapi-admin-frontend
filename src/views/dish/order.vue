<template>
  <div class="page-container">
    <PageHeader title="订单管理" description="查看点菜下单情况，接单、完成或取消订单（取消会自动回滚库存与销量）" />

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div v-for="card in cards" :key="card.key" class="stat-card app-card">
        <div class="stat-card__icon" :style="{ background: card.bg, color: card.color }">
          <el-icon :size="18"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__label">{{ card.label }}</span>
          <strong class="stat-card__value">{{ card.money ? formatMoney(card.value) : formatNumber(card.value) }}</strong>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="app-card">
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="订单号 / 桌号"
            clearable
            style="width: 190px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option v-for="item in ORDER_STATUS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm:ss"
            range-separator="至"
            start-placeholder="下单开始时间"
            end-placeholder="结束时间"
            style="width: 360px"
          />

          <el-button type="primary" plain @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon> 重置
          </el-button>
        </div>
      </div>

      <!-- 除「菜品明细」用 min-width 自适应外，其余列固定宽：保证表格始终填满容器，右侧不留空白 -->
      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无订单">
        <el-table-column prop="order_no" label="订单号" width="186" show-overflow-tooltip />
        <el-table-column
          prop="item_summary"
          label="菜品明细"
          min-width="140"
          show-overflow-tooltip
          :formatter="(row) => row.item_summary || '-'"
        />
        <el-table-column label="桌号" width="62" show-overflow-tooltip>
          <template #default="{ row }">{{ row.table_no || '-' }}</template>
        </el-table-column>
        <el-table-column label="下单人" width="88" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.member_name">{{ row.member_name }}</span>
            <span v-else class="text-muted">扫码点单</span>
          </template>
        </el-table-column>
        <el-table-column label="份数" width="62" align="right">
          <template #default="{ row }">{{ row.total_quantity }}</template>
        </el-table-column>
        <el-table-column label="金额" width="84" align="right">
          <template #default="{ row }">
            <span class="price">{{ formatMoney(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="78">
          <template #default="{ row }">
            <el-tag :type="orderStatusTagType(row.status)" size="small" effect="light">
              {{ orderStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="164" show-overflow-tooltip>
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="186" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending'" link type="success" @click="changeStatus(row, 'confirmed')">
              接单
            </el-button>
            <el-button v-if="row.status === 'confirmed'" link type="success" @click="changeStatus(row, 'completed')">
              完成
            </el-button>
            <el-button
              v-if="row.status === 'pending' || row.status === 'confirmed'"
              link
              type="warning"
              @click="changeStatus(row, 'cancelled')"
            >
              取消
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 订单详情 -->
    <el-drawer v-model="detail.visible" title="订单详情" size="640px">
      <template v-if="detail.data">
        <div class="order-head">
          <div class="order-head__no">{{ detail.data.order_no }}</div>
          <el-tag :type="orderStatusTagType(detail.data.status)" effect="light">
            {{ orderStatusLabel(detail.data.status) }}
          </el-tag>
        </div>

        <el-descriptions :column="2" border size="small" class="order-desc">
          <el-descriptions-item label="桌号">{{ detail.data.table_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="下单人">{{ detail.data.member_name || '扫码点单' }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDateTime(detail.data.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="接单时间">{{ formatDateTime(detail.data.confirmed_at) }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ formatDateTime(detail.data.completed_at) }}</el-descriptions-item>
          <el-descriptions-item label="取消时间">{{ formatDateTime(detail.data.cancelled_at) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detail.data.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-table :data="detail.data.items" size="small" border class="order-items">
          <el-table-column label="菜品" min-width="200">
            <template #default="{ row }">
              <div class="order-item">
                <el-image v-if="row.image" :src="row.image" fit="cover" class="order-item__img" />
                <div v-else class="order-item__img order-item__img--empty"><el-icon><Bowl /></el-icon></div>
                <div class="order-item__info">
                  <span class="order-item__name">{{ row.dish_name }}</span>
                  <span class="order-item__sub">{{ row.spec_name || '单点' }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="90" align="right">
            <template #default="{ row }">{{ formatMoney(row.price) }}</template>
          </el-table-column>
          <el-table-column label="数量" width="70" align="right">
            <template #default="{ row }">x{{ row.quantity }}</template>
          </el-table-column>
          <el-table-column label="小计" width="100" align="right">
            <template #default="{ row }">
              <span class="price">{{ formatMoney(row.amount) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="order-total">
          <span>共 {{ detail.data.total_quantity }} 份</span>
          <span class="order-total__amount">合计 {{ formatMoney(detail.data.total_amount) }}</span>
        </div>

        <div class="order-actions">
          <el-button
            v-if="detail.data.status === 'pending'"
            type="success"
            @click="changeStatus(detail.data, 'confirmed', true)"
          >
            接单
          </el-button>
          <el-button
            v-if="detail.data.status === 'confirmed'"
            type="success"
            @click="changeStatus(detail.data, 'completed', true)"
          >
            完成订单
          </el-button>
          <el-button
            v-if="detail.data.status === 'pending' || detail.data.status === 'confirmed'"
            type="warning"
            plain
            @click="changeStatus(detail.data, 'cancelled', true)"
          >
            取消订单
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  deleteDishOrder,
  fetchDishOrder,
  fetchDishOrders,
  fetchDishOrderStats,
  updateDishOrderStatus,
} from '@/api/dish'
import PageHeader from '@/components/PageHeader.vue'
import { ORDER_STATUS, orderStatusLabel, orderStatusTagType } from '@/constants'
import { formatDateTime, formatMoney, formatNumber } from '@/utils/format'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const dateRange = ref([])
const stats = ref({
  total: 0,
  pending: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
  today_orders: 0,
  today_amount: 0,
  today_quantity: 0,
})
const detail = reactive({ visible: false, data: null })

const query = reactive({ page: 1, page_size: 10, keyword: '', status: '' })

const cards = computed(() => [
  { key: 'total', label: '订单总数', value: stats.value.total, icon: 'Tickets', color: 'var(--blue)', bg: 'var(--blue-soft)' },
  { key: 'pending', label: '待接单', value: stats.value.pending, icon: 'Bell', color: '#b47f18', bg: 'rgba(232, 190, 96, 0.18)' },
  { key: 'today', label: '今日订单', value: stats.value.today_orders, icon: 'Calendar', color: 'var(--cat-2-ink)', bg: 'var(--cat-2-bg)' },
  { key: 'amount', label: '今日营业额', value: stats.value.today_amount, icon: 'Money', color: 'var(--leaf-text)', bg: 'var(--lime-soft)', money: true },
])

function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword) params.keyword = query.keyword.trim()
  if (query.status) params.status = query.status
  if (dateRange.value?.length === 2) {
    params.created_after = dateRange.value[0]
    params.created_before = dateRange.value[1]
  }
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchDishOrders(buildParams())
    rows.value = data.items
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    stats.value = await fetchDishOrderStats()
  } catch (error) {
    // 拦截器已提示
  }
}

function loadAll() {
  loadData()
  loadStats()
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.status = ''
  dateRange.value = []
  handleSearch()
}

async function openDetail(row) {
  try {
    detail.data = await fetchDishOrder(row.id)
    detail.visible = true
  } catch (error) {
    // 拦截器已提示
  }
}

async function changeStatus(row, status, closeDetail = false) {
  const tips = {
    confirmed: '确认接单？',
    completed: '确认该订单已完成？',
    cancelled: '取消订单会自动回滚菜品与套餐的库存、扣减对应销量，确认取消？',
  }
  try {
    await ElMessageBox.confirm(tips[status] || '确认操作？', '操作确认', {
      type: status === 'cancelled' ? 'warning' : 'info',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }

  try {
    const updated = await updateDishOrderStatus(row.id, status)
    ElMessage.success(`订单已${orderStatusLabel(status)}`)
    if (closeDetail) detail.visible = false
    else if (detail.data && detail.data.id === updated.id) detail.data = updated
    loadAll()
  } catch (error) {
    // 拦截器已提示
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除订单「${row.order_no}」吗？该操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }
  try {
    await deleteDishOrder(row.id)
    ElMessage.success('删除成功')
    if (rows.value.length === 1 && query.page > 1) query.page -= 1
    loadAll()
  } catch (error) {
    // 拦截器已提示
  }
}

onMounted(loadAll)
</script>

<style scoped lang="scss">
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 16px 18px;

  &__icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: var(--r-sm);
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink-soft);
  }

  &__value {
    font-family: var(--font-mono);
    font-size: 24px;
    font-weight: 650;
    line-height: 1.15;
    letter-spacing: -0.03em;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
}

.price {
  font-weight: 600;
  color: #ef4444;
}

.text-muted {
  font-size: 12px;
  color: var(--app-text-placeholder);
}

.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;

  &__no {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
}

.order-desc {
  margin-bottom: 16px;
}

.order-items {
  margin-bottom: 14px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 8px;

  &__img {
    width: 34px;
    height: 34px;
    border-radius: 7px;
    flex-shrink: 0;
    background: var(--app-bg);

    &--empty {
      display: grid;
      place-items: center;
      color: var(--app-text-placeholder);
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  &__name {
    font-weight: 600;
  }

  &__sub {
    font-size: 12px;
    color: var(--app-text-placeholder);
  }
}

.order-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: var(--app-radius-sm);
  background: var(--app-primary-soft);
  font-size: 13px;

  &__amount {
    font-size: 17px;
    font-weight: 700;
    color: #ef4444;
  }
}

.order-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;

  .el-button {
    flex: 1;
    margin-left: 0;
  }
}
</style>
