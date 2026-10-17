<template>
  <div class="page-container">
    <PageHeader title="个人信息" description="个人简历 · 基本信息（独立类目）">
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 新增个人信息
      </el-button>
    </PageHeader>

    <el-card shadow="never" class="app-card">
      <!-- 筛选栏 -->
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="姓名 / 手机号 / 邮箱 / 城市 / 求职意向"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="query.gender" placeholder="全部性别" clearable style="width: 140px">
            <el-option
              v-for="item in RESUME_GENDERS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>

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
        empty-text="暂无个人信息"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="姓名" min-width="170">
          <template #default="{ row }">
            <div class="name-cell">
              <el-avatar :size="32" :src="row.avatar || undefined" class="name-cell__avatar">
                {{ (row.name || '').charAt(0) }}
              </el-avatar>
              <span class="name-cell__name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="性别" width="90">
          <template #default="{ row }">
            <el-tag :type="resumeGenderTagType(row.gender)" size="small" effect="light">
              {{ row.gender_text || resumeGenderLabel(row.gender) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="出生日期" width="120">
          <template #default="{ row }">{{ row.birthday || '-' }}</template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="140" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" min-width="190" show-overflow-tooltip />
        <el-table-column prop="city" label="现居城市" width="120" show-overflow-tooltip />
        <el-table-column prop="job_intention" label="求职意向" min-width="150" show-overflow-tooltip />
        <el-table-column label="目前状态" width="150">
          <template #default="{ row }">
            <el-tag
              :type="resumeCurrentStatusTagType(row.current_status)"
              size="small"
              effect="light"
            >
              {{ row.current_status_text || resumeCurrentStatusLabel(row.current_status) }}
            </el-tag>
          </template>
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
      :title="dialog.isEdit ? '编辑个人信息' : '新增个人信息'"
      width="560px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="92px">
        <el-form-item label="头像">
          <div class="avatar-editor">
            <el-avatar :size="64" :src="form.avatar || undefined" class="avatar-editor__preview">
              {{ (form.name || '新').charAt(0) }}
            </el-avatar>
            <div class="avatar-editor__main">
              <el-input v-model="form.avatar" placeholder="图片地址，也可直接上传" clearable />
              <div class="avatar-editor__actions">
                <el-upload
                  :show-file-list="false"
                  :before-upload="handleUpload"
                  accept="image/*"
                  class="upload-inline"
                >
                  <el-button size="small" :loading="uploading">
                    <el-icon><Upload /></el-icon> 上传头像
                  </el-button>
                </el-upload>
                <span class="form-tip">支持 jpg / png / webp / gif，≤ 5MB</span>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="简历主体姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.gender" style="width: 100%">
            <el-option
              v-for="item in RESUME_GENDERS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="出生日期">
          <el-date-picker
            v-model="form.birthday"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="选填" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="选填" />
        </el-form-item>
        <el-form-item label="现居城市">
          <el-input v-model="form.city" placeholder="选填，如：杭州" />
        </el-form-item>
        <el-form-item label="求职意向">
          <el-input v-model="form.job_intention" placeholder="选填，如：后端工程师" />
        </el-form-item>
        <el-form-item label="目前状态" prop="current_status">
          <el-select v-model="form.current_status" style="width: 100%">
            <el-option
              v-for="item in RESUME_CURRENT_STATUSES"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="个人主页">
          <el-input v-model="form.website" placeholder="选填，作品集 / 博客地址" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="选填" />
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
  createPersonalInfo,
  deletePersonalInfo,
  fetchPersonalInfos,
  updatePersonalInfo,
  updatePersonalInfoStatus,
  uploadResumeAvatar,
} from '@/api/resume'
import PageHeader from '@/components/PageHeader.vue'
import {
  RESUME_CURRENT_STATUSES,
  RESUME_GENDERS,
  resumeCurrentStatusLabel,
  resumeCurrentStatusTagType,
  resumeGenderLabel,
  resumeGenderTagType,
} from '@/constants'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const submitting = ref(false)
const uploading = ref(false)
/** 正在切换启用状态的行 id，避免一行点多次 */
const statusLoadingId = ref(null)

const rows = ref([])
const total = ref(0)

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  gender: '',
  is_active: undefined,
})

const formRef = ref(null)
const dialog = reactive({ visible: false, isEdit: false })

const defaultForm = () => ({
  id: null,
  name: '',
  avatar: '',
  gender: 'secret',
  birthday: null,
  phone: '',
  email: '',
  city: '',
  job_intention: '',
  current_status: 'employed_open',
  website: '',
  remark: '',
  is_active: true,
  sort: 0,
})
const form = reactive(defaultForm())

const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { max: 50, message: '长度不超过 50 个字符', trigger: 'blur' },
  ],
  email: [
    {
      validator: (_rule, value, callback) => {
        // 选填：只在填了的时候校验格式
        if (!value) return callback()
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? callback()
          : callback(new Error('邮箱格式不正确'))
      },
      trigger: 'blur',
    },
  ],
}

/** 组装查询参数，过滤空值避免后端枚举校验失败 */
function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword) params.keyword = query.keyword.trim()
  if (query.gender) params.gender = query.gender
  // 注意用 undefined 判断：false（已停用）是有效筛选值
  if (query.is_active !== undefined && query.is_active !== '') params.is_active = query.is_active
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchPersonalInfos(buildParams())
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
  query.gender = ''
  query.is_active = undefined
  handleSearch()
}

function resetForm() {
  Object.assign(form, defaultForm())
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  dialog.isEdit = false
  dialog.visible = true
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    avatar: row.avatar || '',
    gender: row.gender,
    birthday: row.birthday || null,
    phone: row.phone || '',
    email: row.email || '',
    city: row.city || '',
    job_intention: row.job_intention || '',
    current_status: row.current_status || 'employed_open',
    website: row.website || '',
    remark: row.remark || '',
    is_active: row.is_active,
    sort: row.sort || 0,
  })
  dialog.isEdit = true
  dialog.visible = true
}

/** 列表里直接启用 / 停用某条记录 */
async function handleStatusChange(row, value) {
  statusLoadingId.value = row.id
  try {
    await updatePersonalInfoStatus(row.id, value)
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
    name: form.name.trim(),
    avatar: form.avatar || '',
    gender: form.gender,
    birthday: form.birthday || null,
    phone: form.phone || '',
    email: form.email || '',
    city: form.city || '',
    job_intention: form.job_intention || '',
    current_status: form.current_status,
    website: form.website || '',
    remark: form.remark || '',
    is_active: form.is_active,
    sort: form.sort,
  }

  submitting.value = true
  try {
    if (dialog.isEdit) {
      await updatePersonalInfo(form.id, payload)
      ElMessage.success('个人信息已更新')
    } else {
      await createPersonalInfo(payload)
      ElMessage.success('个人信息已创建')
    }
    dialog.visible = false
    loadData()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

/** 上传头像：只负责拿地址写回表单，真正的保存交给 handleSubmit */
async function handleUpload(file) {
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  uploading.value = true
  try {
    const data = await uploadResumeAvatar(file)
    form.avatar = data.url
    ElMessage.success('头像上传成功')
  } catch (error) {
    // 拦截器已提示
  } finally {
    uploading.value = false
  }
  return false // 阻止组件自带的上传行为
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」的个人信息吗？该操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (error) {
    return
  }

  try {
    await deletePersonalInfo(row.id)
    ElMessage.success('删除成功')
    if (rows.value.length === 1 && query.page > 1) query.page -= 1
    loadData()
  } catch (error) {
    // 拦截器已提示
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: var(--app-text-placeholder);
}

/* 表单里的头像编辑区：左侧预览，右侧地址 + 上传按钮 */
.avatar-editor {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  :deep(.el-avatar) {
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--app-primary), var(--app-primary-light));
    color: #fff;
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
  }
}

.upload-inline {
  :deep(.el-upload) {
    display: inline-block;
  }
}

/* 列表姓名列：头像 + 姓名 */
.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  &__avatar {
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--app-primary), var(--app-primary-light));
    color: #fff;
    font-size: 13px;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
