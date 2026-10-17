/**
 * 外观（浅色 / 深色）
 *
 * 状态只落在 `<html data-theme="...">` 上，具体颜色全在两套设计令牌里
 * （见 styles/tokens.css）。偏好保存在 localStorage，刷新后保持。
 */
import { ref } from 'vue'

const STORAGE_KEY = 'admin.appearance'

const theme = ref('light')
let initialized = false

function apply(value) {
  theme.value = value
  document.documentElement.dataset.theme = value
}

/** 在挂载前调用一次：优先本机偏好，其次跟随系统 */
export function initTheme() {
  if (initialized) return
  initialized = true

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') {
    apply(saved)
    return
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  apply(prefersDark ? 'dark' : 'light')
}

export function useTheme() {
  function toggleTheme() {
    const next = theme.value === 'dark' ? 'light' : 'dark'
    apply(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { theme, toggleTheme }
}
