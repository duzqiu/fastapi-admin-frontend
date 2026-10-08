<template>
  <div class="page-header">
    <div class="page-header__main">
      <h2 class="page-header__title">
        <slot name="title">{{ title }}</slot>
      </h2>
      <p v-if="description" class="page-header__desc">{{ description }}</p>
    </div>
    <div class="page-header__extra">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
})
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--app-text);
    letter-spacing: 0.2px;
  }

  &__desc {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--app-text-secondary);
  }

  &__extra {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}
</style>
