<template>
  <div class="page-container">
    <PageHeader title="个人中心" description="查看账号信息并修改登录密码" />

    <el-row :gutter="16">
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="app-card profile-card">
          <el-avatar :size="72" class="profile-card__avatar">{{ userStore.avatarText }}</el-avatar>
          <h3 class="profile-card__name">{{ userStore.displayName }}</h3>
          <p class="profile-card__sub">@{{ profile.username || '-' }}</p>
          <el-tag :type="roleTagType(profile.role)" effect="light">{{ roleLabel(profile.role) }}</el-tag>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="app-card">
          <template #header><span class="card-title">账号信息</span></template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="用户 ID">{{ profile.id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户名">{{ profile.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ profile.nickname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ profile.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="profile.is_active ? 'success' : 'danger'" size="small" effect="light">
                {{ profile.is_active ? '已启用' : '已禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最后登录">
              {{ formatDateTime(profile.last_login_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDateTime(profile.created_at) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="app-card password-card">
      <template #header><span class="card-title">修改密码</span></template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="94px" style="max-width: 460px">
        <el-form-item label="当前密码" prop="old_password">
          <el-input v-model="form.old_password" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="form.new_password" type="password" show-password placeholder="6-64 位，需含字母和数字" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input v-model="form.confirm_password" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存修改</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="修改成功后当前登录态仍然有效；如需更严格的安全策略，可在后端为密码变更增加令牌失效逻辑。"
      />
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

import { changePassword } from '@/api/auth'
import PageHeader from '@/components/PageHeader.vue'
import { roleLabel, roleTagType } from '@/constants'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/format'

const userStore = useUserStore()
const profile = computed(() => userStore.profile || {})

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({ old_password: '', new_password: '', confirm_password: '' })

const rules = {
  old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value) return callback()
        if (value.length < 6 || value.length > 64) return callback(new Error('密码长度 6-64 位'))
        if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
          return callback(new Error('密码需同时包含字母和数字'))
        }
        if (value === form.old_password) return callback(new Error('新密码不能与原密码相同'))
        return callback()
      },
      trigger: 'blur',
    },
  ],
  confirm_password: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) =>
        value === form.new_password ? callback() : callback(new Error('两次输入的密码不一致')),
      trigger: 'blur',
    },
  ],
}

function resetForm() {
  form.old_password = ''
  form.new_password = ''
  form.confirm_password = ''
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  submitting.value = true
  try {
    await changePassword({
      old_password: form.old_password,
      new_password: form.new_password,
    })
    resetForm()
  } catch (error) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  userStore.fetchProfile(true)
})
</script>

<style scoped lang="scss">
.card-title {
  font-weight: 600;
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 20px 30px;
  text-align: center;

  &__avatar {
    background: linear-gradient(135deg, var(--app-primary), #22d3ee);
    color: #fff;
    font-size: 28px;
    font-weight: 700;
  }

  &__name {
    margin: 14px 0 2px;
    font-size: 18px;
    color: var(--app-text);
  }

  &__sub {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--app-text-placeholder);
  }
}

.password-card {
  margin-top: 16px;
}
</style>
