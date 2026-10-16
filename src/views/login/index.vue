<template>
  <div class="login">
    <!-- 登录表单：整页居中 -->
    <div class="login__form">
      <div class="login__form-inner">
        <h2>欢迎回来 👋</h2>
        <p class="login__subtitle">请使用管理员账号登录</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          label-position="top"
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

          <el-form-item>
            <div class="login__row">
              <el-checkbox v-model="remember">记住账号</el-checkbox>
              <span class="login__hint">默认账号：admin / admin123</span>
            </div>
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="login__submit"
            :loading="loading"
            @click="onSubmit"
          >
            登录
          </el-button>
        </el-form>

        <p class="login__footer">
          前端可独立部署，接口地址由 <code>VITE_API_BASE_URL</code> 配置
        </p>
      </div>
    </div>

    <!-- 底部监管信息（版权 + 备案号） -->
    <PageFooter />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import PageFooter from '@/components/PageFooter.vue'
import { useUserStore } from '@/stores/user'

const REMEMBER_KEY = 'admin_remember_username'

const route = useRoute()
const router = useRouter()
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

onMounted(() => {
  const saved = localStorage.getItem(REMEMBER_KEY)
  if (saved) {
    form.username = saved
    form.password = ''
  }
})
</script>

<style scoped lang="scss">
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 40px 24px;
  background: var(--app-surface);

  // 加边框示意登录区的范围；内边距让边框不贴着表单控件
  &__form {
    width: 100%;
    // 全局是 border-box，416 = 360（原来的表单控件宽度）+ 28*2 内边距
    max-width: 416px;
    padding: 32px 28px;
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);
    // 上下 auto 吸掉剩余空间：表单在「顶部 ~ 底部监管信息」之间垂直居中，footer 自然贴底
    margin: auto;
  }

  &__form-inner {
    width: 100%;

    h2 {
      margin: 0 0 6px;
      font-size: 25px;
      color: var(--app-text);
    }
  }

  &__subtitle {
    margin: 0 0 26px;
    color: var(--app-text-secondary);
    font-size: 14px;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  &__hint {
    font-size: 12px;
    color: var(--app-text-placeholder);
  }

  &__submit {
    width: 100%;
    height: 44px;
    font-size: 15px;
    letter-spacing: 2px;
    box-shadow: 0 10px 22px rgba(79, 70, 229, 0.28);
  }

  &__footer {
    margin: 22px 0 0;
    text-align: center;
    font-size: 12px;
    color: var(--app-text-placeholder);

    code {
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--app-primary-soft);
      color: var(--app-primary);
    }
  }

}
</style>
