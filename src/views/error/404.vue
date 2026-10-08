<template>
  <div class="not-found">
    <div class="not-found__code">404</div>
    <h2>页面走丢了</h2>
    <p>你访问的页面不存在或已被移除</p>
    <el-button type="primary" @click="router.replace('/dashboard')">返回首页</el-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped lang="scss">
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 10px;

  &__code {
    font-size: 96px;
    font-weight: 800;
    line-height: 1;
    background: linear-gradient(135deg, var(--app-primary), #22d3ee);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  h2 {
    margin: 8px 0 0;
    color: var(--app-text);
  }

  p {
    margin: 0 0 18px;
    color: var(--app-text-secondary);
  }
}
</style>
