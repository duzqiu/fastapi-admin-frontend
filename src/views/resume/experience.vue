<template>
  <div class="page-container">
    <PageHeader title="工作经历" description="个人网站 · 任职经历（独立类目）">
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 新增工作经历
      </el-button>
    </PageHeader>

    <el-card shadow="never" class="app-card">
      <!-- 筛选栏 -->
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="姓名 / 公司 / 职位 / 部门"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <AvatarSelect
            v-model="query.personal_info_id"
            :options="personalOptions"
            placeholder="全部个人"
            clearable
            style="width: 190px"
          />

          <el-select v-model="query.is_active" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="已启用" :value="true" />
            <el-option label="已停用" :value="false" />
          </el-select>

          <el-button type="primary" plain @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon> 重置
          </el-button>
        </div>
      </div>

      <!-- 数据表 -->
      <el-table
        v-loading="loading"
        :data="rows"
        stripe
        row-key="id"
        empty-text="暂无工作经历"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="姓名" min-width="110" show-overflow-tooltip />
        <el-table-column prop="company" label="公司" min-width="190" show-overflow-tooltip />
        <el-table-column prop="position" label="职位" min-width="150" show-overflow-tooltip />
        <el-table-column prop="department" label="部门" min-width="130" show-overflow-tooltip />
        <el-table-column label="在职时间" width="190">
          <template #default="{ row }">{{ periodText(row.start_month, row.end_month) }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="是否启用" width="110">
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

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑工作经历' : '新增工作经历'"
      width="560px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="92px">
        <el-form-item label="所属个人" prop="personal_info_id">
          <AvatarSelect
            v-model="form.personal_info_id"
            :options="personalOptions"
            placeholder="请选择个人信息（简历主体）"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="公司" prop="company">
          <el-input v-model="form.company" placeholder="公司名称" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="form.position" placeholder="选填，如：后端开发工程师" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="form.department" placeholder="选填" />
        </el-form-item>
        <el-form-item label="入职时间">
          <el-date-picker
            v-model="form.start_month"
            type="month"
            value-format="YYYY-MM"
            placeholder="选择年月"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="离职时间">
          <el-date-picker
            v-model="form.end_month"
            type="month"
            value-format="YYYY-MM"
            placeholder="选择年月，空为至今"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="工作内容">
          <el-input
            v-model="form.description"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 8 }"
            placeholder="选填，工作内容 / 业绩；支持换行，可按 1. 2. 3. 分条填写"
          />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
          <span class="form-tip">越小越靠前</span>
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
  createWork,
  deleteWork,
  fetchPersonalInfos,
  fetchWorks,
  updateWork,
  updateWorkStatus,
} from '@/api/resume'
import PageHeader from '@/components/PageHeader.vue'
import AvatarSelect from '@/components/AvatarSelect.vue'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const submitting = ref(false)
/** 正在切换启用状态的行 id，避免一行点多次 */
const statusLoadingId = ref(null)

const rows = ref([])
const total = ref(0)
/** 「所属个人」下拉数据源（公司经历必须绑定到某个个人信息） */
const personalOptions = ref([])

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  personal_info_id: '',
  is_active: undefined,
})

const formRef = ref(null)
const dialog = reactive({ visible: false, isEdit: false })

const defaultForm = () => ({
  id: null,
  personal_info_id: null,
  company: '',
  position: '',
  department: '',
  start_month: '',
  end_month: '',
  description: '',
  is_active: true,
  sort: 0,
})
const form = reactive(defaultForm())

const formRules = {
  personal_info_id: [{ required: true, message: '请选择所属个人', trigger: 'change' }],
  company: [
    { required: true, message: '请输入公司名称', trigger: 'blur' },
    { max: 100, message: '长度不超过 100 个字符', trigger: 'blur' },
  ],
}

/** 拉「所属个人」下拉选项；打开弹窗时也刷新一次，保证刚建的个人能选到 */
async function loadOptions() {
  try {
    const data = await fetchPersonalInfos({ page: 1, page_size: 200 })
    personalOptions.value = data.items
  } catch (error) {
    // 拦截器已提示
  }
}

/** 在职时间文案：2018-07 ~ 至今 */
function periodText(start, end) {
  const from = start || ''
  const to = end || '至今'
  if (!from && !to) return '-'
  return `${from || '—'} ~ ${to}`
}

/** 组装查询参数，过滤空值 */
function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword) params.keyword = query.keyword.trim()
  if (query.personal_info_id) params.personal_info_id = query.personal_info_id
  // 注意用 undefined 判断：false（已停用）是有效筛选值
  if (query.is_active !== undefined && query.is_active !== '') params.is_active = query.is_active
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchWorks(buildParams())
    rows.value = data.items
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.personal_info_id = ''
  query.is_active = undefined
  handleSearch()
}

function resetForm() {
  Object.assign(form, defaultForm())
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  loadOptions()
  dialog.isEdit = false
  dialog.visible = true
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    personal_info_id: row.personal_info_id ?? null,
    company: row.company,
    position: row.position || '',
    department: row.department || '',
    start_month: row.start_month || '',
    end_month: row.end_month || '',
    description: row.description || '',
    is_active: row.is_active,
    sort: row.sort || 0,
  })
  loadOptions()
  dialog.isEdit = true
  dialog.visible = true
}

/** 列表里直接启用 / 停用某条记录 */
async function handleStatusChange(row, value) {
  statusLoadingId.value = row.id
  try {
    await updateWorkStatus(row.id, value)
    row.is_active = value
    ElMessage.success(value ? '已启用' : '已停用')
  } catch (error) {
    // 拦截器已提示，保持原状态
  } finally {
    statusLoadingId.value = null
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  const payload = {
    personal_info_id: form.personal_info_id,
    company: form.company.trim(),
    position: form.position || '',
    department: form.department || '',
    start_month: form.start_month || '',
    end_month: form.end_month || '',
    description: form.description || '',
    is_active: form.is_active,
    sort: form.sort,
  }

  submitting.value = true
  try {
    if (dialog.isEdit) {
      await updateWork(form.id, payload)
      ElMessage.success('工作经历已更新')
    } else {
      await createWork(payload)
      ElMessage.success('工作经历已创建')
    }
    dialog.visible = false
    loadData()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.name}」在 ${row.company} 的工作经历吗？该操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch (error) {
    return
  }

  try {
    await deleteWork(row.id)
    ElMessage.success('删除成功')
    if (rows.value.length === 1 && query.page > 1) query.page -= 1
    loadData()
  } catch (error) {
    // 拦截器已提示
  }
}

onMounted(() => {
  loadData()
  loadOptions()
})
</script>

<style scoped lang="scss">
.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: var(--app-text-placeholder);
}
</style>
