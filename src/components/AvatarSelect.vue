<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    filterable
    @update:model-value="handleChange"
  >
    <!-- 选中后在输入框里回显该人的头像 -->
    <template v-if="selected" #prefix>
      <el-avatar :size="20" :src="selected.avatar || undefined" class="avatar-select__avatar">
        {{ initial(selected) }}
      </el-avatar>
    </template>

    <!-- 下拉里每条也带头像 -->
    <el-option v-for="item in options" :key="item.id" :label="textOf(item)" :value="item.id">
      <span class="avatar-select__option">
        <el-avatar :size="24" :src="item.avatar || undefined" class="avatar-select__avatar">
          {{ initial(item) }}
        </el-avatar>
        <span class="avatar-select__name">{{ textOf(item) }}</span>
      </span>
    </el-option>
  </el-select>
</template>

<script setup>
/**
 * 带人员头像的下拉：选项与选中态都在文案前显示该人的头像。
 *
 * 简历类目里凡是「绑定到某个人」的下拉都用它：
 *   - 所属个人（教育 / 工作 / 自我评价 / 项目）→ 直接用 `personalOptions`；
 *   - 所属公司（项目）→ 选项是工作经历，人名在 `name`、公司名在 `company`，
 *     文案用 `labelOf` 定制成「姓名 · 公司」，头像仍取该条上的 `avatar`。
 *
 * 用法与 `el-select` 一致，`style` / `class` 等会透传到内部 select 上：
 *   <AvatarSelect v-model="query.personal_info_id" :options="personalOptions"
 *                 placeholder="全部个人" clearable style="width: 190px" />
 */
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [Number, String], default: null },
  /** 选项数据源，取用其中的 id / name / avatar */
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  clearable: { type: Boolean, default: false },
  /** 自定义选项与选中态文案；不传则用「姓名（手机号）」 */
  labelOf: { type: Function, default: null },
})

const emit = defineEmits(['update:modelValue'])

/** 当前选中的那条，用来在输入框里回显头像 */
const selected = computed(() => props.options.find((item) => item.id === props.modelValue))

/** 下拉文案：默认「姓名（手机号）」，重名时用手机号区分 */
function textOf(item) {
  if (props.labelOf) return props.labelOf(item)
  return item.phone ? `${item.name}（${item.phone}）` : item.name
}

/** 没有头像时用姓名首字兜底，与列表保持一致 */
function initial(item) {
  return (item.name || '').charAt(0)
}

function handleChange(value) {
  emit('update:modelValue', value)
}
</script>

<style scoped lang="scss">
.avatar-select {
  &__option {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__avatar {
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--app-primary), var(--app-primary-light));
    color: #fff;
    font-size: 12px;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* 输入框前缀里的头像：收一点间距，别把选择框撑高 */
:deep(.el-select__prefix) {
  display: flex;
  align-items: center;
  margin-right: 6px;
}
</style>
