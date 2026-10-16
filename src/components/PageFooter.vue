<template>
  <footer class="page-footer">
    <p>{{ SITE_LEGAL.copyright }}</p>
    <p>
      <a :href="SITE_LEGAL.icp.link" target="_blank" rel="noopener noreferrer">
        {{ SITE_LEGAL.icp.label }}
      </a>
      <span class="page-footer__sep">|</span>
      <a :href="SITE_LEGAL.police.link" target="_blank" rel="noopener noreferrer">
        {{ SITE_LEGAL.police.label }}
      </a>
    </p>
  </footer>
</template>

<script setup>
/**
 * 页面底部监管信息：版权 + ICP 备案 + 公安联网备案。
 *
 * 内容取自 `SITE_LEGAL`（目前是带 `-demo` 后缀的假数据）。
 * 组件只负责排版，左右/底部留白交给使用方，所以登录页与主框架能共用一份。
 */
import { SITE_LEGAL } from '@/constants'
</script>

<style scoped lang="scss">
.page-footer {
  width: 100%;
  text-align: center;
  font-size: 12px;
  line-height: 1.9;
  color: var(--app-text-placeholder);

  p {
    margin: 0;
  }

  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--app-primary);
      text-decoration: underline;
    }
  }

  &__sep {
    margin: 0 8px;
    color: var(--app-border);
  }
}
</style>
