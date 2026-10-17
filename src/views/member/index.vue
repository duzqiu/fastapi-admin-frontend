<template>
  <div class="page-container">
    <PageHeader title="用户列表" description="查看用户中心注册用户，修改资料、启用禁用、重置密码" />

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div v-for="card in cards" :key="card.key" class="stat-card app-card">
        <div class="stat-card__icon" :style="{ background: card.bg, color: card.color }">
          <el-icon :size="18"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-card__body">
          <span class="stat-card__label">{{ card.label }}</span>
          <strong class="stat-card__value">{{ formatNumber(card.value) }}</strong>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="app-card">
      <!-- 筛选栏 -->
      <div class="toolbar">
        <div class="toolbar__filters">
          <el-input
            v-model="query.keyword"
            placeholder="用户ID / 邮箱 / 昵称 / 手机号"
            clearable
            style="width: 250px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="query.gender" placeholder="全部性别" clearable style="width: 130px">
            <el-option
              v-for="item in MEMBER_GENDERS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>

          <el-select v-model="query.is_active" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="已启用" :value="true" />
            <el-option label="已禁用" :value="false" />
          </el-select>

          <el-select
            v-model="query.email_verified"
            placeholder="邮箱验证"
            clearable
            style="width: 130px"
          >
            <el-option label="已验证" :value="true" />
            <el-option label="未验证" :value="false" />
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
      <el-table v-loading="loading" :data="rows" stripe row-key="id" empty-text="暂无会员数据">
        <!-- 除「会员」用 min-width 自适应外，其余列固定宽：保证表格始终填满容器、右侧不留白 -->
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column label="用户ID" width="86" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="member-no">{{ row.member_no || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="会员" min-width="190">
          <template #default="{ row }">
            <div class="member-cell">
              <el-avatar :size="34" :src="avatarSrc(row)" class="member-cell__avatar">
                {{ (row.nickname || row.email).charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="member-cell__info">
                <span class="member-cell__name">{{ row.nickname || '（未设置昵称）' }}</span>
                <span class="member-cell__sub">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="性别" width="72">
          <template #default="{ row }">
            <el-tag :type="genderTagType(row.gender)" size="small" effect="light">
              {{ genderLabel(row.gender) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="生日" width="104">
          <template #default="{ row }">{{ row.birthday || '-' }}</template>
        </el-table-column>

        <el-table-column label="地区" width="96" show-overflow-tooltip>
          <template #default="{ row }">{{ row.region || '-' }}</template>
        </el-table-column>

        <el-table-column label="邮箱验证" width="86">
          <template #default="{ row }">
            <el-tag :type="row.email_verified ? 'success' : 'warning'" size="small" effect="plain">
              {{ row.email_verified ? '已验证' : '未验证' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="74">
          <template #default="{ row }">
            <el-switch
              :model-value="row.is_active"
              :loading="statusLoadingId === row.id"
              @change="(value) => handleStatusChange(row, value)"
            />
          </template>
        </el-table-column>

        <el-table-column label="最后登录" width="168">
          <template #default="{ row }">{{ formatDateTime(row.last_login_at) }}</template>
        </el-table-column>

        <el-table-column label="注册时间" width="168">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="216" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="openReset(row)">重置密码</el-button>
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

    <!-- 详情抽屉 -->
    <el-drawer v-model="detail.visible" title="会员详情" size="440px">
      <template v-if="detail.data">
        <div class="detail-head">
          <el-avatar :size="72" :src="avatarSrc(detail.data)" class="detail-head__avatar">
            {{ (detail.data.nickname || detail.data.email).charAt(0).toUpperCase() }}
          </el-avatar>
          <h3 class="detail-head__name">{{ detail.data.display_name }}</h3>
          <p class="detail-head__email">{{ detail.data.email }}</p>
          <div class="detail-head__tags">
            <el-tag :type="detail.data.is_active ? 'success' : 'danger'" size="small" effect="light">
              {{ detail.data.is_active ? '已启用' : '已禁用' }}
            </el-tag>
            <el-tag :type="genderTagType(detail.data.gender)" size="small" effect="light">
              {{ genderLabel(detail.data.gender) }}
            </el-tag>
            <el-tag :type="detail.data.email_verified ? 'success' : 'warning'" size="small" effect="plain">
              {{ detail.data.email_verified ? '邮箱已验证' : '邮箱未验证' }}
            </el-tag>
          </div>
        </div>

        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="用户 ID">{{ detail.data.member_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="内部 ID">{{ detail.data.id }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detail.data.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="背景图">
            <el-image
              v-if="backgroundSrc(detail.data)"
              :src="backgroundSrc(detail.data)"
              fit="cover"
              class="detail-background"
            />
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="性别">{{ genderLabel(detail.data.gender) }}</el-descriptions-item>
          <el-descriptions-item label="生日">{{ detail.data.birthday || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ detail.data.age ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detail.data.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地区">{{ detail.data.region || '-' }}</el-descriptions-item>
          <el-descriptions-item label="个人简介">{{ detail.data.bio || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱验证时间">
            {{ formatDateTime(detail.data.email_verified_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录">
            {{ formatDateTime(detail.data.last_login_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ formatDateTime(detail.data.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(detail.data.updated_at) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-actions">
          <el-button type="primary" @click="openEdit(detail.data, true)">编辑资料</el-button>
          <el-button
            :type="detail.data.is_active ? 'danger' : 'success'"
            plain
            @click="handleStatusChange(detail.data, !detail.data.is_active, true)"
          >
            {{ detail.data.is_active ? '禁用账号' : '启用账号' }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      title="编辑会员资料"
      width="560px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="82px">
        <el-form-item label="邮箱">
          <el-input :model-value="form.email" disabled />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" maxlength="50" show-word-limit placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="头像">
          <div class="avatar-editor">
            <el-avatar :size="52" :src="avatarSrc(form)">
              {{ (form.nickname || form.email || 'M').charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="avatar-editor__body">
              <el-input v-model="form.avatar" placeholder="头像图片地址（可留空）" clearable />
              <div class="avatar-editor__actions">
                <el-upload
                  :show-file-list="false"
                  :before-upload="handleAvatarUpload"
                  accept="image/*"
                  class="upload-inline"
                >
                  <el-button size="small" :loading="uploading">
                    <el-icon><Upload /></el-icon> 上传头像
                  </el-button>
                </el-upload>
                <span class="avatar-editor__hint">支持 jpg / png / webp / gif / heic，≤ 5MB</span>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 背景图：与头像同一套规则（按会员 ID 存 backgrounds/{会员ID}/），只是没有默认图 -->
        <el-form-item label="背景图">
          <div class="avatar-editor">
            <div class="background-preview">
              <el-image
                v-if="backgroundSrc(form)"
                :src="backgroundSrc(form)"
                fit="cover"
                class="background-preview__img"
              />
              <span v-else class="background-preview__empty">未设置</span>
            </div>
            <div class="avatar-editor__body">
              <el-input v-model="form.background" placeholder="背景图地址（可留空）" clearable />
              <div class="avatar-editor__actions">
                <el-upload
                  :show-file-list="false"
                  :before-upload="handleBackgroundUpload"
                  accept="image/*"
                  class="upload-inline"
                >
                  <el-button size="small" :loading="bgUploading">
                    <el-icon><Upload /></el-icon> 上传背景图
                  </el-button>
                </el-upload>
                <span class="avatar-editor__hint">支持 jpg / png / webp / gif / heic，≤ 5MB</span>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="form.gender" style="width: 100%">
                <el-option
                  v-for="item in MEMBER_GENDERS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生日">
              <el-date-picker
                v-model="form.birthday"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" maxlength="20" placeholder="选填，仅数字" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地区" prop="region">
              <el-input v-model="form.region" maxlength="64" placeholder="选填，如：杭州" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="简介" prop="bio">
          <el-input
            v-model="form.bio"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="选填"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="resetDialog.visible" title="重置会员密码" width="440px" destroy-on-close>
      <el-form ref="resetFormRef" :model="resetDialog" :rules="resetRules" label-width="82px">
        <el-form-item label="会员">
          <el-input :model-value="resetDialog.email" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetDialog.newPassword"
            type="password"
            show-password
            placeholder="至少 6 位，需含字母和数字"
          />
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
  deleteMember,
  fetchMember,
  fetchMemberStats,
  fetchMembers,
  memberAvatarUrl,
  resetMemberPassword,
  updateMember,
  updateMemberStatus,
  uploadMemberAvatar,
  uploadMemberBackground,
} from '@/api/member'
import PageHeader from '@/components/PageHeader.vue'
import { MEMBER_GENDERS, genderLabel, genderTagType } from '@/constants'
import { formatDateTime, formatNumber } from '@/utils/format'

const loading = ref(false)
const submitting = ref(false)
const uploading = ref(false)
const bgUploading = ref(false)
const statusLoadingId = ref(null)

const rows = ref([])
const total = ref(0)
const stats = ref({ total: 0, active: 0, disabled: 0, verified: 0, new_in_7_days: 0 })

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  gender: '',
  is_active: undefined,
  email_verified: undefined,
})

const formRef = ref(null)
const resetFormRef = ref(null)
const dialog = reactive({ visible: false })
const detail = reactive({ visible: false, data: null })
const resetDialog = reactive({ visible: false, memberId: null, email: '', newPassword: '' })

const defaultForm = () => ({
  id: null,
  email: '',
  nickname: '',
  avatar: '',
  avatar_url: '',
  background: '',
  background_url: '',
  gender: 'unknown',
  birthday: null,
  phone: '',
  region: '',
  bio: '',
  is_active: true,
})
const form = reactive(defaultForm())

/**
 * 头像展示地址：优先用资料接口给出的 `avatar_url`（后端按会员 ID 解析，未上传时是默认
 * 头像），其次是会员自己设置的头像地址，最后兜底走后台「按会员 ID 读头像」接口。
 */
function avatarSrc(row) {
  if (!row) return undefined
  return row.avatar_url || row.avatar || memberAvatarUrl(row.id) || undefined
}

/**
 * 背景图展示地址。**背景没有默认图**：没设置过就返回空串，页面摆「未设置」，
 * 别去调「按会员 ID 读背景图」那个接口（它会 404）。
 */
function backgroundSrc(row) {
  if (!row) return ''
  return row.background_url || row.background || ''
}

const cards = computed(() => [
  {
    key: 'total',
    label: '注册会员总数',
    value: stats.value.total,
    icon: 'Avatar',
    color: 'var(--blue)',
    bg: 'var(--blue-soft)',
  },
  {
    key: 'active',
    label: '启用中',
    value: stats.value.active,
    icon: 'CircleCheck',
    color: 'var(--leaf-text)',
    bg: 'var(--lime-soft)',
  },
  {
    key: 'new',
    label: '近 7 天新增',
    value: stats.value.new_in_7_days,
    icon: 'TrendCharts',
    color: 'var(--cat-2-ink)',
    bg: 'var(--cat-2-bg)',
  },
  {
    key: 'verified',
    label: '邮箱已验证',
    value: stats.value.verified,
    icon: 'Message',
    color: '#b47f18',
    bg: 'rgba(232, 190, 96, 0.18)',
  },
])

const formRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 50, message: '昵称最多 50 个字符', trigger: 'blur' },
  ],
  phone: [
    {
      validator: (_rule, value, callback) => {
        if (!value) return callback()
        return /^[0-9-+]{5,20}$/.test(value) ? callback() : callback(new Error('手机号格式不正确'))
      },
      trigger: 'blur',
    },
  ],
}

const resetRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
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

function buildParams() {
  const params = { page: query.page, page_size: query.page_size }
  if (query.keyword) params.keyword = query.keyword.trim()
  if (query.gender) params.gender = query.gender
  if (query.is_active !== undefined && query.is_active !== '') params.is_active = query.is_active
  if (query.email_verified !== undefined && query.email_verified !== '') {
    params.email_verified = query.email_verified
  }
  return params
}

async function loadData() {
  loading.value = true
  try {
    const data = await fetchMembers(buildParams())
    rows.value = data.items
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    stats.value = await fetchMemberStats()
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
  query.gender = ''
  query.is_active = undefined
  query.email_verified = undefined
  handleSearch()
}

function resetForm() {
  Object.assign(form, defaultForm())
  formRef.value?.clearValidate()
}

function openEdit(row, fromDetail = false) {
  Object.assign(form, {
    id: row.id,
    email: row.email,
    nickname: row.nickname || '',
    avatar: row.avatar || '',
    avatar_url: row.avatar_url || '',
    background: row.background || '',
    background_url: row.background_url || '',
    gender: row.gender || 'unknown',
    birthday: row.birthday || null,
    phone: row.phone || '',
    region: row.region || '',
    bio: row.bio || '',
    is_active: row.is_active,
  })
  dialog.visible = true
  if (fromDetail) detail.visible = false
}

async function openDetail(row) {
  try {
    detail.data = await fetchMember(row.id)
    detail.visible = true
  } catch (error) {
    // 拦截器已提示
  }
}

async function handleAvatarUpload(file) {
  if (!form.id) return false

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  uploading.value = true
  try {
    // 后端按会员 ID 存：data/uploads/avatars/{会员ID}/，返回的地址直接写回头像字段
    const data = await uploadMemberAvatar(form.id, file)
    form.avatar = data.url
    form.avatar_url = data.url
    ElMessage.success('头像上传成功')
  } catch (error) {
    // 拦截器已提示
  } finally {
    uploading.value = false
  }
  return false // 阻止组件自带的上传行为
}

async function handleBackgroundUpload(file) {
  if (!form.id) return false

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  bgUploading.value = true
  try {
    // 与头像同一套规则：data/uploads/backgrounds/{会员ID}/
    const data = await uploadMemberBackground(form.id, file)
    form.background = data.url
    form.background_url = data.url
    ElMessage.success('背景图上传成功')
  } catch (error) {
    // 拦截器已提示
  } finally {
    bgUploading.value = false
  }
  return false // 阻止组件自带的上传行为
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  submitting.value = true
  try {
    await updateMember(form.id, {
      nickname: form.nickname,
      avatar: form.avatar,
      background: form.background,
      gender: form.gender,
      birthday: form.birthday || null,
      phone: form.phone,
      region: form.region,
      bio: form.bio,
      is_active: form.is_active,
    })
    ElMessage.success('会员资料已更新')
    dialog.visible = false
    loadAll()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

async function handleStatusChange(row, value, closeDetail = false) {
  statusLoadingId.value = row.id
  try {
    const updated = await updateMemberStatus(row.id, value)
    row.is_active = updated.is_active
    if (detail.data && detail.data.id === row.id) detail.data.is_active = updated.is_active
    ElMessage.success(value ? '已启用' : '已禁用')
    if (closeDetail) detail.visible = false
    loadStats()
  } catch (error) {
    // 拦截器已提示，保持原状态
  } finally {
    statusLoadingId.value = null
  }
}

function openReset(row) {
  resetDialog.memberId = row.id
  resetDialog.email = row.email
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
    await resetMemberPassword(resetDialog.memberId, resetDialog.newPassword)
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
      `确定删除会员「${row.nickname || row.email}」吗？该操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch (error) {
    return
  }

  try {
    await deleteMember(row.id)
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
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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

/* 6 位用户 ID：等宽数字并加粗，便于快速核对 */
.member-no {
  font-weight: 600;
  letter-spacing: 0.4px;
  font-variant-numeric: tabular-nums;
  color: var(--app-text);
}

.member-cell {
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

.detail-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 18px;
  margin-bottom: 16px;
  border-bottom: 1px dashed var(--app-border);

  &__avatar {
    background: linear-gradient(135deg, var(--app-primary), #22d3ee);
    color: #fff;
    font-size: 26px;
    font-weight: 700;
  }

  &__name {
    margin: 12px 0 2px;
    font-size: 17px;
    color: var(--app-text);
  }

  &__email {
    margin: 0 0 10px;
    font-size: 13px;
    color: var(--app-text-placeholder);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
  }
}

.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;

  .el-button {
    flex: 1;
    margin-left: 0;
  }
}

.avatar-editor {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  :deep(.el-avatar) {
    background: linear-gradient(135deg, var(--app-primary), var(--app-primary-light));
    color: #fff;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }

  &__hint {
    font-size: 12px;
    color: var(--app-text-placeholder);
  }
}

.upload-inline {
  :deep(.el-upload) {
    display: inline-block;
  }
}

/* 背景图预览：16:9 的小缩略图，没设置时摆「未设置」 */
.background-preview {
  flex-shrink: 0;
  width: 96px;
  height: 54px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--app-fill-lighter, #f5f7fa);
  display: flex;
  align-items: center;
  justify-content: center;

  &__img {
    width: 100%;
    height: 100%;
    display: block;
  }

  &__empty {
    font-size: 12px;
    color: var(--app-text-placeholder);
  }
}

.detail-background {
  width: 120px;
  height: 68px;
  border-radius: 6px;
  display: block;
}
</style>
