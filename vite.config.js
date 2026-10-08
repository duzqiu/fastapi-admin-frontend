import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

/** 生成 dev / preview 的接口代理配置，本地调试无需处理跨域 */
function buildProxy(target) {
  if (!target) return {}
  const proxy = {
    '/api': {
      target,
      changeOrigin: true,
    },
  }
  return {
    server: { host: '0.0.0.0', port: 5173, open: false, proxy },
    preview: { host: '0.0.0.0', port: 4173, proxy },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    ...buildProxy(env.VITE_PROXY_TARGET),
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            element: ['element-plus', '@element-plus/icons-vue'],
          },
        },
      },
    },
  }
})
