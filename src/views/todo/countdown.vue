<template>
  <div class="page-container">
    <PageHeader
      title="倒数日"
      description="查看与管理会员的倒数日：归属用户、事项、重复周期、目标日期与有效状态。新增由小程序端完成，后台不提供新建入口"
    />

    <el-card shadow="never" class="app-card">
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="事项 / 备注"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select
            v-model="query.member_id"
            placeholder="全部用户"
            clearable
            filterable
            style="width: 160px"
          >
            <el-option
              v-for="item in memberOptions"
              :key="item.id"
              :label="`${item.member_no} · ${item.nickname || item.email}`"
              :value="item.id"
            />
          </el-select>

          <el-select v-model="query.cycle" placeholder="全部周期" clearable style="width: 130px">
            <el-option
              v-for="item in COUNTDOWN_CYCLES"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>

          <el-select v-model="query.is_active" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="有效" :value="true" />
            <el-option label="已停用" :value="false" />
          </el-select>

          <el-button type="primary" plain @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon> 重置
          </el-button>
        </div>

        <div class="stat-row">
          <el-tag effect="plain">共 {{ stats.total }} 条</el-tag>
          <el-tag type="success" effect="plain">有效 {{ stats.active }}</el-tag>
          <el-tag type="info" effect="plain">已停用 {{ stats.inactive }}</el-tag>
        </div>
      </div>

      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无倒数日">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户ID" width="96">
          <template #default="{ row }">
            <span class="member-no">{{ row.member_no || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用户" min-width="120">
          <template #default="{ row }">{{ row.member_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="title" label="倒数日事项" min-width="180" show-overflow-tooltip />
        <el-table-column label="周期" width="90">
          <template #default="{ row }">
            <el-tag :type="countdownCycleTagType(row.cycle)" size="small" effect="light">
              {{ countdownCycleLabel(row.cycle) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标日期" width="120">
          <template #default="{ row }">{{ row.target_date }}</template>
        </el-table-column>
        <el-table-column label="倒数日当天" min-width="170">
          <template #default="{ row }">
            <div>{{ row.next_date }}</div>
            <div class="sub-text">
              农历{{ row.lunar_text }}
              <el-tag
                v-if="row.lunar_festival"
                class="festival-tag"
                size="small"
                type="danger"
                effect="plain"
              >
                {{ row.lunar_festival }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="剩余天数" width="120" align="right">
          <template #default="{ row }">
            <span class="days" :class="daysClass(row.days_left)">{{ daysText(row.days_left) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="是否有效" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.is_active"
              :loading="statusLoadingId === row.id"
              @change="(value) => handleStatusChange(row, value)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
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

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑倒数日' : '新建倒数日'"
      width="520px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="用户" prop="member_id">
          <el-select
            v-model="form.member_id"
            filterable
            placeholder="请选择归属用户"
            style="width: 100%"
          >
            <el-option
              v-for="item in memberOptions"
              :key="item.id"
              :label="`${item.member_no} · ${item.nickname || item.email}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="事项" prop="title">
          <el-input v-model="form.title" maxlength="100" placeholder="如：春节 / 项目上线 / 生日" />
        </el-form-item>
        <el-form-item label="周期" prop="cycle">
          <el-select v-model="form.cycle" style="width: 100%">
            <el-option
              v-for="item in COUNTDOWN_CYCLES"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标日期" prop="target_date">
          <el-date-picker
            v-model="form.target_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="是否有效">
          <el-switch v-model="form.is_active" active-text="有效" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            maxlength="500"
            placeholder="选填"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  createCountdown,
  deleteCountdown,
  fetchCountdownStats,
  fetchCountdowns,
  updateCountdown,
  updateCountdownStatus,
} from '@/api/countdown'
import { fetchMembers } from '@/api/member'
import PageHeader from '@/components/PageHeader.vue'
import { COUNTDOWN_CYCLES, countdownCycleLabel, countdownCycleTagType } from '@/constants'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const submitting = ref(false)
const statusLoadingId = ref(null)

const rows = ref([])
const total = ref(0)
const memberOptions = ref([])
const stats = reactive({ total: 0, active: 0, inactive: 0 })

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  member_id: undefined,
  cycle: '',
  is_active: undefined,
})

const formRef = ref(null)
const dialog = reactive({ visible: false, isEdit: false })

const defaultForm = () => ({
  id: null,
  member_id: null,
  title: '',
  cycle: 'once',
  target_date: '',
  is_active: true,
  remark: '',
})
const form = reactive(defaultForm())

const formRules = {
  member_id: [{ required: true, message: '请选择归属用户', trigger: 'change' }],
  title: [{ required: true, message: '请输入倒数日事项', trigger: 'blur' }],
  target_date: [{ required: true, message: '请选择目标日期', trigger: 'change' }],
}

/** 剩余天数文案：一次性事项过期后 days_left 为负数 */
const daysText = (days) => {
  if (days < 0) return `已过 ${Math.abs(days)} 天`
  if (days === 0) return '就是今天'
  return `还有 ${days} 天`
}

const daysClass = (days) => {
  if (days < 0) return 'is-expired'
  if (days <= 3) return 'is-urgent'
  if (days <= 7) return 'is-soon'
  return ''
}

/** 组装查询参数，过滤空值避免后端枚举校验失败 */
function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword) params.keyword = query.keyword.trim()
  if (query.member_id) params.member_id = query.member_id
  if (query.cycle) params.cycle = query.cycle
  if (query.is_active !== undefined && query.is_active !== '') params.is_active = query.is_active
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchCountdowns(buildParams())
    rows.value = data.items
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    Object.assign(stats, await fetchCountdownStats())
  } catch (error) {
    // 拦截器已提示
  }
}

async function loadMembers() {
  try {
    const data = await fetchMembers({ page: 1, page_size: 100 })
    memberOptions.value = data.items
  } catch (error) {
    // 拦截器已提示
  }
}

function handleSearch() {
  query.page = 1
  loadData()
  loadStats()
}

function handleReset() {
  query.keyword = ''
  query.member_id = undefined
  query.cycle = ''
  query.is_active = undefined
  handleSearch()
}

function resetForm() {
  Object.assign(form, defaultForm())
  formRef.value?.clearValidate()
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    member_id: row.member_id || null,
    title: row.title,
    cycle: row.cycle,
    target_date: row.target_date,
    is_active: row.is_active,
    remark: row.remark || '',
  })
  dialog.isEdit = true
  dialog.visible = true
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  submitting.value = true
  try {
    const payload = {
      member_id: form.member_id,
      title: form.title.trim(),
      cycle: form.cycle,
      target_date: form.target_date,
      is_active: form.is_active,
      remark: form.remark.trim(),
    }

    if (dialog.isEdit) {
      await updateCountdown(form.id, payload)
      ElMessage.success('倒数日已更新')
    } else {
      await createCountdown(payload)
      ElMessage.success('倒数日已创建')
    }
    dialog.visible = false
    loadData()
    loadStats()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function handleStatusChange(row, value) {
  statusLoadingId.value = row.id
  try {
    await updateCountdownStatus(row.id, value)
    row.is_active = value
    ElMessage.success(value ? '已启用' : '已停用')
    loadStats()
  } catch (error) {
    // 拦截器已提示，保持原状态
  } finally {
    statusLoadingId.value = null
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除倒数日「${row.title}」吗？该操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }

  try {
    await deleteCountdown(row.id)
    ElMessage.success('删除成功')
    if (rows.value.length === 1 && query.page > 1) query.page -= 1
    loadData()
    loadStats()
  } catch (error) {
    // 拦截器已提示
  }
}

onMounted(() => {
  loadMembers()
  loadData()
  loadStats()
})
</script>

<style scoped lang="scss">
.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-text {
  margin-top: 2px;
  color: #9ca3af;
  font-size: 12px;
}

.member-no {
  font-weight: 600;
  letter-spacing: 0.4px;
  font-variant-numeric: tabular-nums;
  color: var(--app-text);
}

.festival-tag {
  margin-left: 6px;
}

.days {
  font-weight: 600;
  color: var(--app-text);

  &.is-urgent {
    color: var(--el-color-danger);
  }

  &.is-soon {
    color: var(--el-color-warning);
  }

  &.is-expired {
    font-weight: 400;
    color: var(--app-text-placeholder);
  }
}
</style>
