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
    font-family: var(--font-mono);
    font-size: 96px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.05em;
    background: linear-gradient(135deg, var(--blue), var(--lime));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  h2 {
    margin: 8px 0 0;
    color: var(--ink);
  }

  p {
    margin: 0 0 18px;
    color: var(--ink-muted);
  }
}
</style>
