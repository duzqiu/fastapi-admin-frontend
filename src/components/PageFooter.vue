<template>
  <footer class="page-footer">
    <p>{{ SITE_LEGAL.copyright }}</p>
    <p>
      <a :href="SITE_LEGAL.icp.link" target="_blank" rel="noopener noreferrer">
        {{ SITE_LEGAL.icp.label }}
      </a>
      <span class="page-footer__sep">·</span>
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 10px;
  width: 100%;
  font-size: 11.5px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--ink-faint) 82%, transparent);

  p {
    margin: 0;
  }

  a {
    color: inherit;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--ink-soft);
    }
  }

  &__sep {
    margin: 0 2px;
    color: var(--ink-faint);
  }
}
</style>
