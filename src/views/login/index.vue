<template>
  <div class="login">
    <div class="login-main">
      <div class="login-brand">
        <span class="brand-mark" aria-hidden="true"><span class="brand-dot" /></span>
        <div class="brand-text">
          <div class="brand-name">{{ appStore.projectName }}</div>
          <div class="brand-sub">Admin Console</div>
        </div>
      </div>

      <section class="login-card">
        <span class="eyebrow">账号登录</span>
        <h1 class="login-card__title">登录</h1>
        <p class="login-card__sub">使用管理员分配的账号登录系统</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          label-position="top"
          class="login-form"
          @keyup.enter="onSubmit"
        >
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" clearable>
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
              clearable
            >
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>

          <div class="login-options">
            <el-checkbox v-model="remember">记住账号</el-checkbox>
            <span class="login-hint">默认账号：admin / admin123</span>
          </div>

          <el-button
            type="primary"
            class="login-submit"
            :loading="loading"
            @click="onSubmit"
          >
            登录
          </el-button>
        </el-form>

        <p class="login-note">
          接口地址由 <code>VITE_API_BASE_URL</code> 配置
        </p>
      </section>
    </div>

    <PageFooter class="login-footer" />
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import PageFooter from '@/components/PageFooter.vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const REMEMBER_KEY = 'admin_remember_username'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const remember = ref(true)

const form = reactive({
  username: 'admin',
  password: 'admin123',
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为 3-50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度为 6-64 个字符', trigger: 'blur' },
  ],
}

async function onSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  loading.value = true
  try {
    await userStore.login({ username: form.username.trim(), password: form.password })
    if (remember.value) {
      localStorage.setItem(REMEMBER_KEY, form.username.trim())
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }
    ElMessage.success(`欢迎回来，${userStore.displayName}`)
    const redirect = route.query.redirect
    router.replace(typeof redirect === 'string' && redirect ? redirect : '/dashboard')
  } catch (error) {
    // 错误提示已由 axios 拦截器统一处理
  } finally {
    loading.value = false
  }
}

const saved = localStorage.getItem(REMEMBER_KEY)
if (saved) {
  form.username = saved
  form.password = ''
}
</script>

<style scoped lang="scss">
.login {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: 40px 20px 72px;
  overflow: hidden;
  background:
    radial-gradient(42% 38% at 80% 6%, var(--ambient-a), transparent 70%),
    radial-gradient(46% 42% at 8% 96%, var(--ambient-b), transparent 72%),
    var(--canvas);
}

.login-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  width: 100%;
  max-width: 396px;
}

/* ── 品牌 ───────────────────────────────────────────────────── */
.login-brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.brand-text {
  min-width: 0;
  /* 品牌名比下面的英文长，让两行按中线对齐 */
  text-align: center;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: var(--r-sm);
  background: var(--dark-surface);
  box-shadow:
    0 1px 3px rgba(14, 18, 20, 0.16),
    0 6px 16px rgba(14, 18, 20, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.brand-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--lime);
  box-shadow: 0 0 0 4px rgba(130, 221, 45, 0.2), 0 0 12px rgba(130, 221, 45, 0.6);
}

.brand-name {
  font-size: 14.5px;
  font-weight: 720;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--ink);
}

.brand-sub {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  text-transform: uppercase;
}

/* ── 登录卡 ─────────────────────────────────────────────────── */
.login-card {
  width: 100%;
  padding: 30px 30px 22px;
  border: 1px solid var(--glass-line);
  border-radius: var(--r-xl);
  background: var(--surface);
  box-shadow: var(--e3), var(--edge);
}

.eyebrow {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: var(--track-eyebrow);
  text-transform: uppercase;
  color: var(--ink-faint);
}

.login-card__title {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 740;
  letter-spacing: -0.03em;
  color: var(--ink);
}

.login-card__sub {
  margin-top: 4px;
  margin-bottom: 22px;
  font-size: 12.5px;
  color: var(--ink-soft);
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 6px;
  }
}

.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
}

.login-hint {
  font-size: 11.5px;
  color: var(--ink-faint);
}

.login-submit {
  width: 100%;
  height: 44px;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.login-note {
  margin-top: 18px;
  text-align: center;
  font-size: 11.5px;
  color: var(--ink-faint);

  code {
    padding: 2px 6px;
    border-radius: 6px;
    background: var(--blue-soft);
    color: var(--blue);
    font-family: var(--font-mono);
    font-size: 10.5px;
  }
}

.login-footer {
  position: absolute;
  right: 24px;
  bottom: 18px;
  left: 24px;
}

@media (max-width: 480px) {
  .login {
    padding: 28px 16px 64px;
  }

  .login-card {
    padding: 24px 20px 18px;
  }

  .login-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
