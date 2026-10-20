<template>
  <div class="page-container">
    <PageHeader
      title="解锁密码"
      description="个人网站 · 进入「关于我」页面前需要输入的访问密码"
    />

    <el-card v-loading="loading" shadow="never" class="app-card password-card">
      <template #header>
        <div class="card-head">
          <span class="card-title">访问密码</span>
          <el-tag :type="serverEnabled ? 'success' : 'info'" effect="light" size="small">
            {{ serverEnabled ? '已开启' : '已关闭' }}
          </el-tag>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="关闭开关后立即生效，不需要保存；开启后才校验密码。"
        description="密码只保存哈希，后台不会回显原密码。支持中文、字母、数字，长度 4-64 个字符（中文按一个字计算）。首次部署默认密码为 123456，建议上线后立即修改。"
      />

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="password-form"
      >
        <el-form-item label="密码校验">
          <el-switch
            v-model="form.enabled"
            :loading="switching"
            :disabled="switching"
            active-text="开启"
            inactive-text="关闭"
            @change="handleEnabledChange"
          />
          <span class="form-tip">
            {{ form.enabled ? '保存密码后开启校验' : '关闭立即生效，无需保存' }}
          </span>
        </el-form-item>

        <template v-if="form.enabled">
        <el-form-item label="新密码" prop="password">
          <!-- 不用 type=password：部分浏览器会禁用中文输入法的候选框 -->
          <div
            class="password-field"
            :class="{ 'is-visible': passwordVisible.password }"
          >
            <el-input
              v-model="form.password"
              type="text"
              maxlength="64"
              autocomplete="new-password"
              placeholder="支持中文、字母、数字，4-64 位"
            >
              <template #suffix>
                <el-icon
                  class="password-eye"
                  :title="passwordVisible.password ? '隐藏密码' : '显示密码'"
                  @click.stop="passwordVisible.password = !passwordVisible.password"
                >
                  <Hide v-if="passwordVisible.password" />
                  <View v-else />
                </el-icon>
              </template>
            </el-input>
          </div>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <div
            class="password-field"
            :class="{ 'is-visible': passwordVisible.confirm }"
          >
            <el-input
              v-model="form.confirm"
              type="text"
              maxlength="64"
              autocomplete="new-password"
              placeholder="再次输入新密码"
            >
              <template #suffix>
                <el-icon
                  class="password-eye"
                  :title="passwordVisible.confirm ? '隐藏密码' : '显示密码'"
                  @click.stop="passwordVisible.confirm = !passwordVisible.confirm"
                >
                  <Hide v-if="passwordVisible.confirm" />
                  <View v-else />
                </el-icon>
              </template>
            </el-input>
          </div>
        </el-form-item>
        </template>

        <el-form-item v-if="form.enabled">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            保存密码
          </el-button>
          <el-button @click="resetForm">清空</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'

import {
  fetchAboutPasswordStatus,
  updateAboutPassword,
} from '@/api/site'
import { ElMessage } from 'element-plus'

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const switching = ref(false)
const configured = ref(false)
const serverEnabled = ref(true)
/** 后台回显的当前密码，用于关闭再开启时恢复 */
const storedPassword = ref('')

const form = reactive({
  enabled: true,
  password: '',
  confirm: '',
})

// 默认明文展示，点右侧图标可临时隐藏
const passwordVisible = reactive({
  password: true,
  confirm: true,
})

const rules = {
  password: [
    {
      validator: (_rule, value, callback) => {
        if (!value) return callback()
        if (value.length < 4 || value.length > 64) {
          return callback(new Error('密码长度 4-64 位'))
        }
        return callback()
      },
      trigger: 'blur',
    },
  ],
  confirm: [
    {
      validator: (_rule, value, callback) => {
        if (!form.password) return callback()
        if (!value) return callback(new Error('请再次输入新密码'))
        if (value !== form.password) return callback(new Error('两次输入的密码不一致'))
        return callback()
      },
      trigger: 'blur',
    },
  ],
}

async function handleEnabledChange(enabled) {
  form.password = ''
  form.confirm = ''
  passwordVisible.password = true
  passwordVisible.confirm = true
  formRef.value?.clearValidate()

  // 开启只是展开密码输入框，等点「保存密码」才真正生效；
  // 有旧密码时直接回显，修改不需要再校验旧密码
  if (enabled) {
    if (storedPassword.value) {
      form.password = storedPassword.value
      form.confirm = storedPassword.value
    }
    return
  }

  // 关闭立即提交，不需要再点保存
  switching.value = true
  try {
    const data = await updateAboutPassword({ enabled: false })
    serverEnabled.value = Boolean(data.enabled)
    form.enabled = Boolean(data.enabled)
    ElMessage.success('解锁密码已关闭')
  } catch (error) {
    // 失败时把开关拨回去，避免界面状态和后台不一致
    form.enabled = true
    ElMessage.error(error.message || '关闭密码失败')
  } finally {
    switching.value = false
  }
}

function restoreForm() {
  form.password = storedPassword.value
  form.confirm = storedPassword.value
  passwordVisible.password = true
  passwordVisible.confirm = true
  formRef.value?.clearValidate()
}

function resetForm() {
  form.password = ''
  form.confirm = ''
  passwordVisible.password = true
  passwordVisible.confirm = true
  formRef.value?.clearValidate()
}

async function loadStatus() {
  loading.value = true
  try {
    const data = await fetchAboutPasswordStatus()
    configured.value = Boolean(data.configured)
    form.enabled = Boolean(data.enabled)
    serverEnabled.value = Boolean(data.enabled)
    storedPassword.value = data.password || ''
    form.password = storedPassword.value
    form.confirm = storedPassword.value
  } catch (error) {
    ElMessage.error(error.message || '密码状态加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  // 从关闭状态重新开启时必须设置密码；已开启状态留空表示保持原密码
  if (
    !form.password &&
    (!serverEnabled.value || !configured.value)
  ) {
    ElMessage.warning('请设置访问密码后再开启')
    return
  }

  submitting.value = true
  try {
    const data = await updateAboutPassword({
      enabled: true,
      password: form.password || null,
    })
    configured.value = Boolean(data.configured)
    form.enabled = Boolean(data.enabled)
    serverEnabled.value = Boolean(data.enabled)
    storedPassword.value = data.password || storedPassword.value
    restoreForm()
    ElMessage.success('密码已保存')
  } catch (error) {
    ElMessage.error(error.message || '密码保存失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadStatus)
</script>

<style scoped>
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
}

.password-form {
  max-width: 520px;
  margin-top: 20px;
}

.password-field {
  width: 100%;
}

/* type=text 才能稳定调起中文输入法；默认用文字安全掩码显示圆点 */
.password-field:not(.is-visible) :deep(.el-input__inner) {
  -webkit-text-security: disc;
  text-security: disc;
}

.password-eye {
  color: var(--el-text-color-placeholder);
  cursor: pointer;
}

.password-eye:hover {
  color: var(--el-color-primary);
}
</style>
