/** 通用格式化工具 */

/** 日期时间格式化：2026-10-08 12:30:00 */
export function formatDateTime(value) {
  if (!value) return '-'
  const date = typeof value === 'string' ? new Date(value.replace(' ', 'T')) : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const pad = (num) => String(num).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/** 数字千分位 */
export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '0'
  return Number(value).toLocaleString('en-US')
}

/** 金额格式化：￥12.50 */
export function formatMoney(value, prefix = '￥') {
  const amount = Number(value || 0)
  return `${prefix}${amount.toFixed(2)}`
}

/** 按分钟粒度生成时间下拉选项（00:00 - 23:30） */
export function timeOptions(step = 30) {
  const options = []
  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
    const mm = String(minutes % 60).padStart(2, '0')
    options.push(`${hh}:${mm}`)
  }
  return options
}
