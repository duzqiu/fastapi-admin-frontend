<template>
  <div class="login">
    <!-- 左侧品牌区 -->
    <div class="login__banner">
      <div class="login__banner-inner">
        <div class="login__logo">后</div>
        <h1>{{ APP_NAME }}</h1>

        <!-- 后台已有功能简介 -->
        <div class="login__intro">
          <ul class="login__intro-list">
            <li v-for="item in MODULES" :key="item.name">
              <span class="login__intro-icon">
                <el-icon><component :is="item.icon" /></el-icon>
              </span>
              <span class="login__intro-name">{{ item.name }}</span>
              <span class="login__intro-desc">{{ item.desc }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="login__glow login__glow--1" />
      <div class="login__glow login__glow--2" />
    </div>

    <!-- 右侧表单区 -->
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
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { APP_NAME } from '@/constants'
import { useUserStore } from '@/stores/user'

const REMEMBER_KEY = 'admin_remember_username'

/** 后台已有功能模块 */
const MODULES = [
  { icon: 'Avatar', name: '会员管理', desc: '注册会员资料与状态' },
  { icon: 'Document', name: '文章管理', desc: '内容编辑与发布撤稿' },
  { icon: 'Setting', name: '个人中心', desc: '账号信息与密码修改' },
]

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
  min-height: 100vh;

  &__banner {
    position: relative;
    flex: 1.1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%);
    color: #fff;
  }

  &__banner-inner {
    position: relative;
    z-index: 2;
    max-width: 420px;
    padding: 40px;

    h1 {
      margin: 18px 0 0;
      font-size: 32px;
      letter-spacing: 0.5px;
    }
  }

  &__logo {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #6366f1, #22d3ee);
    color: #fff;
    font-size: 28px;
    font-weight: 700;
    box-shadow: 0 12px 28px rgba(99, 102, 241, 0.45);
  }

  &__intro {
    margin-top: 26px;
  }

  &__intro-list {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: 10px;
      transition: background 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.07);
      }
    }
  }

  &__intro-icon {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
    color: #c7d2fe;
    font-size: 14px;
  }

  &__intro-name {
    width: 66px;
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  &__intro-desc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.62);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(10px);
    opacity: 0.5;

    &--1 {
      width: 320px;
      height: 320px;
      right: -90px;
      top: -80px;
      background: radial-gradient(circle, rgba(34, 211, 238, 0.55), transparent 65%);
    }

    &--2 {
      width: 380px;
      height: 380px;
      left: -120px;
      bottom: -140px;
      background: radial-gradient(circle, rgba(129, 140, 248, 0.5), transparent 65%);
    }
  }

  &__form {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    background: var(--app-surface);
  }

  &__form-inner {
    width: 100%;
    max-width: 360px;

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

@media (max-width: 860px) {
  .login__banner {
    display: none;
  }
}
</style>
