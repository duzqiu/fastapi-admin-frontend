# 后台管理前端镜像：Node 构建静态文件 + Nginx 托管并反向代理后端接口
#
# 构建：docker build -t fastapi-admin-frontend:1.0.0 .
# 运行：见 README「Docker 部署」，或直接用同目录的 docker-compose.yml
#
# —— 构建参数：默认值 = 官方源，网络受限时才需要覆盖 ——
#   NODE_IMAGE        构建阶段基础镜像（默认 node:26-alpine = Alpine 版，体积小、构建快）。
#                     Node 26 目前仍是 Current（预计 2026-10 转入 LTS）；该阶段只负责构建，
#                     产物 dist/ 会拷进 nginx 阶段。想用 LTS 就写 node:24（Node 20 已 EOL）。
#   NPM_REGISTRY      npm 源，国内可换 https://registry.npmmirror.com
#   NGINX_IMAGE       运行阶段基础镜像（默认 nginx:1.30-alpine，1.30 是 nginx 的 stable 分支；
#                     要完全固定可写 1.30.5-alpine，但补丁更新就得手动跟）
#   VITE_API_BASE_URL 接口基址：默认 /api/v1（相对路径 → 同源，由下面的 Nginx 反代，天然无跨域）
#   VITE_API_TIMEOUT  接口超时（毫秒）
# ⚠️ 两个基础镜像的 ARG 都必须写在「第一个 FROM 之前」：
#    ARG 的作用域在它所在 stage 结束时就失效，写在第一个 stage 里面的话，
#    第二个 FROM 引用的 ${NGINX_IMAGE} 会解析成空值 → base name (${NGINX_IMAGE}) should not be blank
ARG NODE_IMAGE=node:26-alpine
ARG NGINX_IMAGE=nginx:1.30-alpine

FROM ${NODE_IMAGE} AS build

# FROM 之后需要重新声明才能在这个阶段里使用
ARG NPM_REGISTRY=https://registry.npmjs.org
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_API_TIMEOUT=20000

WORKDIR /app

# 先装依赖，源码变动时可复用这一层缓存（用 package-lock.json 保证可复现）
COPY package.json package-lock.json ./
RUN npm ci --registry "$NPM_REGISTRY" --no-audit --no-fund

COPY . .

# Vite 会优先读取真实环境变量：同名的会覆盖 .env.production 里的值
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_API_TIMEOUT=$VITE_API_TIMEOUT
RUN npm run build

# ---------------------------- 运行阶段 ----------------------------
# NGINX_IMAGE 已在文件顶部（第一个 FROM 之前）声明，这里直接用即可
FROM ${NGINX_IMAGE}

# 只让 envsubst 替换 API_UPSTREAM，避免动到 nginx 自身的 $uri / $host 等变量
ENV API_UPSTREAM=http://backend:8000 \
    NGINX_ENVSUBST_FILTER=^API_UPSTREAM$

# 官方 nginx 镜像的入口脚本会在启动时把 templates/*.template 渲染到 conf.d/
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# 用 busybox wget 探活，省去额外安装 curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
