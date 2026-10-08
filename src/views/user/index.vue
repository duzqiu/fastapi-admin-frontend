<template>
  <div class="page-container">
    <PageHeader title="后台账号" description="维护后台账号、角色与启用状态">
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 新建用户
      </el-button>
    </PageHeader>

    <el-card shadow="never" class="app-card">
      <!-- 筛选栏 -->
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="用户名 / 邮箱 / 昵称"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="query.role" placeholder="全部角色" clearable style="width: 140px">
            <el-option v-for="item in USER_ROLES" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>

          <el-select v-model="query.is_active" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="已启用" :value="true" />
            <el-option label="已禁用" :value="false" />
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
      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无用户数据">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" class="user-cell__avatar">
                {{ (row.nickname || row.username).charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="user-cell__info">
                <span class="user-cell__name">{{ row.nickname || row.username }}</span>
                <span class="user-cell__sub">@{{ row.username }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)" size="small" effect="light">
              {{ roleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.is_active"
              :loading="statusLoadingId === row.id"
              :disabled="row.id === currentUserId"
              @change="(value) => handleStatusChange(row, value)"
            />
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="170">
          <template #default="{ row }">{{ formatDateTime(row.last_login_at) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="openReset(row)">重置密码</el-button>
            <el-button link type="danger" :disabled="row.id === currentUserId" @click="handleDelete(row)">
              删除
            </el-button>
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

    <!-- 新建 / 编辑弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.isEdit ? '编辑用户' : '新建用户'"
      width="520px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="86px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="dialog.isEdit" placeholder="3-50 位字母或数字" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="user@example.com" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="选填，默认与用户名相同" />
        </el-form-item>
        <el-form-item v-if="!dialog.isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="至少 6 位，需含字母和数字" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option v-for="item in USER_ROLES" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="resetDialog.visible" title="重置密码" width="440px" destroy-on-close>
      <el-form ref="resetFormRef" :model="resetDialog" :rules="resetRules" label-width="86px">
        <el-form-item label="用户">
          <el-input :model-value="resetDialog.username" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetDialog.newPassword" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="resetDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleResetPassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  createUser,
  deleteUser,
  fetchUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from '@/api/user'
import PageHeader from '@/components/PageHeader.vue'
import { USER_ROLES, roleLabel, roleTagType } from '@/constants'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/format'

const userStore = useUserStore()
const currentUserId = computed(() => userStore.profile?.id)

const loading = ref(false)
const submitting = ref(false)
const statusLoadingId = ref(null)

const rows = ref([])
const total = ref(0)

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  role: '',
  is_active: undefined,
})

const formRef = ref(null)
const resetFormRef = ref(null)

const dialog = reactive({ visible: false, isEdit: false })
const resetDialog = reactive({ visible: false, userId: null, username: '', newPassword: '' })

const defaultForm = () => ({
  id: null,
  username: '',
  email: '',
  nickname: '',
  password: '',
  role: 'user',
  is_active: true,
})
const form = reactive(defaultForm())

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度 3-50 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value) return callback()
        if (value.length < 6 || value.length > 64) return callback(new Error('密码长度 6-64 位'))
        if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
          return callback(new Error('密码需同时包含字母和数字'))
        }
        return callback()
      },
      trigger: 'blur',
    },
  ],
}

const resetRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度 6-64 位', trigger: 'blur' },
  ],
}

/** 组装查询参数，过滤空值避免后端枚举校验失败 */
function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword) params.keyword = query.keyword.trim()
  if (query.role) params.role = query.role
  if (query.is_active !== undefined && query.is_active !== '') params.is_active = query.is_active
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchUsers(buildParams())
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
  query.role = ''
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
    username: row.username,
    email: row.email,
    nickname: row.nickname,
    password: '',
    role: row.role,
    is_active: row.is_active,
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
    if (dialog.isEdit) {
      await updateUser(form.id, {
        email: form.email,
        nickname: form.nickname,
        role: form.role,
        is_active: form.is_active,
      })
      ElMessage.success('用户已更新')
    } else {
      await createUser({
        username: form.username.trim(),
        email: form.email,
        nickname: form.nickname,
        password: form.password,
        role: form.role,
        is_active: form.is_active,
      })
      ElMessage.success('用户已创建')
    }
    dialog.visible = false
    loadData()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function handleStatusChange(row, value) {
  statusLoadingId.value = row.id
  try {
    await updateUserStatus(row.id, value)
    row.is_active = value
    ElMessage.success(value ? '已启用' : '已禁用')
  } catch (error) {
    // 拦截器已提示，保持原状态
  } finally {
    statusLoadingId.value = null
  }
}

function openReset(row) {
  resetDialog.userId = row.id
  resetDialog.username = row.nickname || row.username
  resetDialog.newPassword = ''
  resetDialog.visible = true
}

async function handleResetPassword() {
  try {
    await resetFormRef.value.validate()
  } catch (error) {
    return
  }

  submitting.value = true
  try {
    await resetUserPassword(resetDialog.userId, resetDialog.newPassword)
    ElMessage.success('密码已重置')
    resetDialog.visible = false
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除用户「${row.nickname || row.username}」吗？该操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch (error) {
    return
  }

  try {
    await deleteUser(row.id)
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
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  &__avatar {
    background: linear-gradient(135deg, var(--app-primary), var(--app-primary-light));
    color: #fff;
    font-size: 13px;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    line-height: 1.35;
    min-width: 0;
  }

  &__name {
    font-weight: 600;
    color: var(--app-text);
  }

  &__sub {
    font-size: 12px;
    color: var(--app-text-placeholder);
  }
}
</style>
