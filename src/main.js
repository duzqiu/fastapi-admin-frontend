import { createApp } from 'vue'
import { createPinia } from 'pinia'

import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from '@/api/request'
import { initTheme } from '@/composables/theme'
import '@/styles/tokens.css'
import '@/styles/materials.css'
import '@/styles/index.scss'

// 先把外观落到 <html data-theme>，避免首屏闪一下浅色
initTheme()

const app = createApp(App)

// 全局注册 Element Plus 图标，模板中可直接 <component :is="'User'" />
Object.entries(ElementPlusIconsVue).forEach(([name, component]) => {
  app.component(name, component)
})

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn, size: 'default' })

// 令牌失效时统一跳转登录页（在此注入，避免 api 层反向依赖 router）
setUnauthorizedHandler(() => {
  const redirect = router.currentRoute.value.fullPath
  router.replace({ path: '/login', query: redirect === '/login' ? {} : { redirect } })
})

app.mount('#app')
