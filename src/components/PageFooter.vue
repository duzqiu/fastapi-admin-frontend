<template>
  <footer class="page-footer">
    <p>{{ SITE_LEGAL.copyright }}</p>
  </footer>
</template>

<script setup>
/**
 * 页面底部版权行（目前只保留「© 年份 系统名」，备案信息已按需去掉）。
 *
 * 内容取自 `SITE_LEGAL`，组件只负责排版，左右/底部留白交给使用方，
 * 所以登录页与主框架能共用一份。
 */
import { SITE_LEGAL } from '@/constants'
</script>

<style scoped lang="scss">
.page-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 11.5px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--ink-faint) 82%, transparent);

  p {
    margin: 0;
  }
}
</style>
