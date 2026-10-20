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
          <el-tag :type="configured ? 'success' : 'warning'" effect="light" size="small">
            {{ configured ? '已设置' : '未设置' }}
          </el-tag>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="密码只保存哈希，后台不会回显原密码；修改时直接输入新密码即可。"
        description="支持中文、字母、数字，长度 4-64 个字符（中文按一个字计算）。首次部署默认密码为 123456，建议上线后立即修改。"
      />

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="password-form"
      >
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
        <el-form-item>
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
const configured = ref(false)

const form = reactive({
  password: '',
  confirm: '',
})

const passwordVisible = reactive({
  password: false,
  confirm: false,
})

const rules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 4, max: 64, message: '密码长度 4-64 位', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.password) return callback(new Error('两次输入的密码不一致'))
        return callback()
      },
      trigger: 'blur',
    },
  ],
}

function resetForm() {
  form.password = ''
  form.confirm = ''
  passwordVisible.password = false
  passwordVisible.confirm = false
  formRef.value?.clearValidate()
}

async function loadStatus() {
  loading.value = true
  try {
    const data = await fetchAboutPasswordStatus()
    configured.value = Boolean(data.configured)
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

  submitting.value = true
  try {
    await updateAboutPassword(form.password)
    configured.value = true
    resetForm()
    ElMessage.success('关于我访问密码已更新')
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
