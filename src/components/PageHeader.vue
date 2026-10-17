<template>
  <div class="page-head">
    <div class="page-head__main">
      <h2 class="page-head__title">
        <slot name="title">{{ title }}</slot>
      </h2>
      <p v-if="description" class="page-head__desc">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="page-head__side">
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
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-bottom: 20px;

  &__main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: 28px;
    font-weight: 740;
    line-height: 1.15;
    letter-spacing: -0.03em;
    color: var(--ink);
    text-wrap: balance;
  }

  &__desc {
    margin-top: 6px;
    max-width: 680px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--ink-muted);
    text-wrap: pretty;
  }

  &__side {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
}

@media (max-width: 640px) {
  .page-head__title {
    font-size: 22px;
  }
}
</style>
