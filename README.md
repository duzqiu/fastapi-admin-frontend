# 后台管理系统 · Vue 前端

**后台管理系统**的管理界面，基于 **Vue 3 + Vite + Element Plus + Pinia**，
配套后端项目见 `../fastapi-admin-backend`，C 端 App 见 `../flet-post-app`。

设计目标：**简约实用、开箱可用**。与后端完全解耦，可单独部署，两者仅通过 HTTP 通讯。

系统名称集中在 `src/constants/index.js`：`APP_NAME` 为全称（浏览器标题、页脚版权），
`APP_BRAND_NAME` 为左上角品牌名（侧边栏与登录页共用）。

---

## 目录

- [一、项目简介](#一项目简介)
- [二、技术栈](#二技术栈)
- [三、目录结构](#三目录结构)
- [四、快速开始](#四快速开始)
- [五、环境变量与接口地址](#五环境变量与接口地址)
- [六、功能说明](#六功能说明)
- [七、与后端的接口约定](#七与后端的接口约定)
- [八、构建与部署](#八构建与部署)
- [九、常见问题](#九常见问题)

---

## 一、项目简介

| 能力 | 说明 |
| --- | --- |
| 登录认证 | JWT 登录、令牌本地持久化、access_token 过期自动静默续期并重放请求 |
| 仪表盘 | 统计卡片（注册会员 / 近 7 天新增 / 后台账号）+ 「常用入口」按访问频次排序 |
| 后台管理 ▸ 后台账号 | 列表搜索分页、新建、编辑、启用/禁用、重置密码、删除 |
| 用户管理 ▸ 用户列表 | 会员统计、10 位会员编号展示与检索、筛选、详情抽屉、编辑资料、头像/背景图上传、启禁用、重置密码、删除 |
| 文章管理 | 官号文章（发布/编辑/审核/访问量）、动态管理、评论管理（审核 / 删除） |
| 个人网站 | 站点欢迎语、关于我解锁密码、六类简历数据（个人信息 / 技能标签 / 教育 / 工作 / 项目 / 自我评价） |
| 个人中心 | 账号信息、修改密码 |
| 外观 | 浅色 / 深色主题切换（跟随系统或手动，偏好持久化） |
| 体验细节 | 面包屑、菜单权限过滤、加载态、空状态、统一错误提示、响应式布局 |

> 本项目定位是**后台管理端**，因此只包含「用户列表」。面向会员的注册 / 登录 / 忘记密码 /
> 个人中心属于 C 端 App（`flet-post-app`），直接调用后端 `/api/v1/member/**` 接口。

---

## 二、技术栈

| 组件 | 版本 | 用途 |
| --- | --- | --- |
| Vue | 3.5 | 组合式 API + `<script setup>` |
| Vite | 6.x | 构建与开发服务器 |
| Vue Router | 4.x | 路由与登录守卫 |
| Pinia | 2.3 | 状态管理（user / app / usage） |
| Element Plus | 2.9 | UI 组件库（中文语言包）+ 全量图标 |
| Axios | 1.7 | 请求封装（拦截器 + 令牌续期） |
| Sass | 1.83 | 样式预处理 |

**无 TypeScript**，全部为 `.js` / `.vue`；Node 要求 ≥ 18。

样式分三层：`styles/tokens.css`（设计令牌，明暗两套）、`styles/materials.css`（材质与动效）、
`styles/index.scss`（全局样式与 Element Plus 覆盖）。

---

## 三、目录结构

```
fastapi-admin-frontend/
├── index.html                      入口 HTML（含首屏加载动画）
├── vite.config.js                  别名、接口代理、分包
├── package.json
├── .env.development / .env.production
├── Dockerfile                      Node 构建 + Nginx 托管（多阶段）
├── nginx.conf                      SPA 回退 + /api 反向代理
├── docker-compose.yml              前端容器编排
├── .dockerignore / .env.docker.example
├── public/favicon.svg
│
└── src/
    ├── main.js                     入口：ElementPlus、Pinia、Router、主题初始化、401 跳转注入
    ├── App.vue
    │
    ├── api/                        ★ 接口层（一个后端模块一个文件）
    │   ├── request.js              Axios 实例：令牌注入、响应解包、错误提示、静默续期、失败重放
    │   ├── auth.js                 /auth/*          登录、当前用户、改密、登出
    │   ├── user.js                 /users/*         后台账号
    │   ├── member.js               /members/*       会员列表 / 统计 / 详情 / 编辑 / 启禁用 / 媒体上传
    │   ├── post.js                 /posts/*         动态列表、审核、删除、发布
    │   ├── comment.js              /comments/*      评论列表、审核、删除
    │   ├── official-article.js     /official-articles/*
    │   ├── resume.js               /resume/*        六类简历 CRUD + 启停 + 对外合并接口
    │   ├── site.js                 /site/admin/*    欢迎语、关于我密码
    │   └── system.js               /system/*        健康检查、运行信息、首页统计
    │
    ├── router/
    │   ├── menu.js                 菜单结构（同时被 Layout 与 router 使用）
    │   └── index.js                路由表 + 登录守卫 + 角色校验 + 标题设置
    │
    ├── stores/
    │   ├── user.js                 令牌、当前用户、登录/登出/拉取信息
    │   ├── app.js                  侧边栏折叠、二级菜单展开（会话内）
    │   └── usage.js                页面访问频次（仪表盘「常用入口」排序）
    │
    ├── layouts/DefaultLayout.vue   侧边栏 + 顶栏（主题切换 / 用户菜单）+ 面包屑 + 内容区
    │
    ├── components/
    │   ├── PageHeader.vue          页面标题栏（标题 / 描述 / 右侧插槽）
    │   ├── PageFooter.vue          页脚版权
    │   └── AvatarSelect.vue        头像选择（上传或填写地址 + 预览）
    │
    ├── composables/theme.js        浅色 / 深色切换（`<html data-theme>`）
    ├── constants/index.js          与后端一致的枚举与展示映射
    ├── utils/auth.js               令牌读写（localStorage 收口）
    ├── utils/format.js             日期、数字、文本格式化
    │
    ├── views/
    │   ├── login/index.vue         登录页
    │   ├── dashboard/index.vue     仪表盘
    │   ├── user/index.vue          后台账号
    │   ├── member/index.vue        用户列表（会员）
    │   ├── article/official.vue    官号文章
    │   ├── article/post.vue        动态管理
    │   ├── article/comment.vue     评论管理
    │   ├── site/welcome.vue        欢迎语
    │   ├── site/about-password.vue 解锁密码
    │   ├── resume/profile.vue      个人信息
    │   ├── resume/skill.vue        技能标签
    │   ├── resume/education.vue    教育信息
    │   ├── resume/experience.vue   工作经历
    │   ├── resume/project.vue      项目经历
    │   ├── resume/evaluation.vue   自我评价
    │   ├── profile/index.vue       个人中心
    │   └── error/404.vue           404
    │
    └── styles/                     index.scss / tokens.css / materials.css
```

**分层约定**

- `views` 只负责交互与展示，不直接写 `axios`，统一走 `api/`。
- `api/` 只描述「请求哪个接口、传什么参数」，不做业务判断。
- `stores/` 承载跨页面共享状态（登录态、折叠状态、访问频次）。
- `constants/` 与 `utils/` 为纯函数与常量，不依赖其他层。

---

## 四、快速开始

> 需要 Node.js ≥ 18。容器镜像默认 `node:26-alpine` 构建、`nginx:1.30-alpine` 托管，
> 均可通过 `.env` 覆盖。

### 1. 安装依赖

```powershell
cd fastapi-admin-frontend
npm install
```

### 2. 确认后端地址

`.env.development` 默认指向本地后端：

```dotenv
VITE_API_BASE_URL=/api/v1
VITE_PROXY_TARGET=http://127.0.0.1:8000
VITE_API_TIMEOUT=15000
```

### 3. 启动

```powershell
npm run dev
```

打开 http://localhost:5173 ，使用后端初始化账号 `admin / admin123` 登录。

> 开发环境 `/api` 由 Vite 代理转发，**本地调试无需配置跨域**。

### 4. 构建预览

```powershell
npm run build
npm run preview
```

---

## 五、环境变量与接口地址

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 接口基地址。同域用 `/api/v1`，独立域名用 `https://api.example.com/api/v1` |
| `VITE_PROXY_TARGET` | **仅开发 / 预览**有效，把 `/api` 代理到该地址（为空则不配代理） |
| `VITE_API_TIMEOUT` | 请求超时（毫秒） |

| 场景 | 配置 | 需要跨域 |
| --- | --- | --- |
| 本地开发 | `/api/v1` + `VITE_PROXY_TARGET=http://127.0.0.1:8000` | 否 |
| 生产同域 | `/api/v1`（Nginx 托管前端并反代 `/api`） | 否 |
| 生产分离域名 | `https://api.example.com/api/v1` | 是，后端需加 `BACKEND_CORS_ORIGINS` |

修改 `.env.*` 后需重启开发服务器。

---

## 六、功能说明

### 侧边栏菜单结构

菜单为「一级菜单（可折叠）+ 二级菜单」两层，定义在 `src/router/menu.js`：
带 `children` 的节点渲染为可展开分组，其子项被拍平后注册为真实路由（`DefaultLayout` 的 children）。

```
仪表盘                          /dashboard

后台管理（仅 admin）
  └ 后台账号                    /users

用户管理（仅 admin）
  └ 用户列表                    /members

文章管理（仅 admin）
  ├ 官号文章                    /official-articles
  ├ 动态管理                    /posts
  └ 评论管理                    /comments

个人网站（仅 admin）
  ├ 欢迎语                      /site-welcome
  ├ 解锁密码                    /site-about-password
  ├ 个人信息                    /resume-personal
  ├ 技能标签                    /resume-skill
  ├ 教育信息                    /resume-education
  ├ 工作经历                    /resume-experience
  ├ 项目经历                    /resume-project
  └ 自我评价                    /resume-evaluation

个人中心                        /profile（hidden，从头像菜单进入）
```

- 分组标题就是折叠开关，进入后台时默认全收起，本次会话内展开状态保留到刷新；
- 导航轨收成图标（76px）时各分组子项一律展开；
- 面包屑三级：`首页 / 一级菜单 / 当前页`，跳转到二级页时自动展开所属分组；
- 分组与子项都按角色过滤，**子项全被过滤时整组不展示**。

### 登录页 `/login`

左侧品牌介绍 + 右侧表单，支持回车提交、记住账号；登录成功跳 `redirect` 指定页，默认仪表盘。

### 仪表盘 `/dashboard`

- 统计卡片：注册会员（含启用数）/ 近 7 天新增 / 后台账号（含启用数），数据来自 `GET /system/dashboard`。
- **常用入口**：按当前浏览器使用频次排序，展示访问最多的 4 个菜单页；
  频次存在 `localStorage` 的 `admin_menu_usage`（`src/stores/usage.js`），清缓存会重新统计。

### 用户列表 `/members`（仅 admin）

面向会员（与「后台账号」不是一回事）：

- **统计概览**：注册总数、启用中、近 7 天新增、邮箱已验证。
- **列表**：内部 ID（主键）、**用户 ID（10 位会员编号）**、头像 / 昵称 / 邮箱、性别、生日、地区、
  邮箱验证、状态开关、最后登录、注册时间。
- **筛选**：关键词（**用户 ID** / 邮箱 / 昵称 / 手机号，支持片段匹配）、性别、启用状态、邮箱验证。
- **详情抽屉**：完整资料（含年龄、邮箱验证时间、最后登录、更新时间）与快捷操作。
- **编辑**：昵称、头像（直接上传或填地址 + 预览）、背景图（16:9 预览）、性别、生日、手机号、
  地区、简介、启用状态。
- **启用 / 禁用 / 重置密码 / 删除**：禁用后立即无法登录，已签发令牌同步失效。

### 文章管理

| 页面 | 能力 |
| --- | --- |
| 官号文章 `/official-articles` | 列表（关键词 / 状态 / 来源 / 用户 ID）、发布、编辑、审核、删除 |
| 动态管理 `/posts` | 列表筛选、查看详情、审核（通过 / 拒绝为终态）、删除 |
| 评论管理 `/comments` | 列表筛选（含动态 ID）、审核、删除；官号文章评论同样在此管理 |

### 个人网站

| 页面 | 能力 |
| --- | --- |
| 欢迎语 `/site-welcome` | 主标题 / 副标题 / 祝福语（首页中间展示） |
| 解锁密码 `/site-about-password` | 「关于我」访问密码开关与新密码设置；只存哈希、不回显原密码 |
| 个人信息 `/resume-personal` | 姓名、头像（可上传）、性别、生日、手机号、邮箱、现居城市、求职意向、当前状态、工作年限、个人主页、备注、启用、排序 |
| 技能标签 `/resume-skill` | 分类 + 多个标签（分号分隔，后端去重规整），可配色 |
| 教育信息 `/resume-education` | 学校、专业、学历、入学 / 毕业年月（YYYY-MM）、在校经历 |
| 工作经历 `/resume-experience` | 公司、职位、部门、入职 / 离职年月、工作内容与业绩 |
| 项目经历 `/resume-project` | 必须绑定某段工作经历，项目名称 / 角色 / 起止年月 / 描述 / 职责 / 业绩 |
| 自我评价 `/resume-evaluation` | 标题 + 评价内容、启用、排序 |

六页形状一致：分页列表 + 搜索、新增 / 编辑弹窗、启用停用、删除。
数据只用于「个人网站」对外展示，与会员体系无关。

### 个人中心 `/profile`

账号信息（ID、用户名、昵称、邮箱、角色、状态、最后登录、创建时间）+ 修改密码。

### 全局体验

- 菜单按角色过滤，无权限访问时提示并回 /dashboard。
- `access_token` 过期自动用 `refresh_token` 续期，期间失败的请求挂入队列、刷新完成后**自动重放**；
  续期失败才清令牌跳登录页。
- 401 跳转逻辑由 `main.js` 通过 `setUnauthorizedHandler` 注入，避免 `api` ↔ `router` 循环依赖。
- 主题在 `main.js` 挂载前初始化：优先本机偏好，其次跟随系统；切换后写入
  `localStorage` 的 `admin.appearance`。
- 所有接口错误统一以 `ElMessage` 提示（文案取后端 `message`）。

---

## 七、与后端的接口约定

### 基地址与请求头

```text
请求地址：{VITE_API_BASE_URL}{path}       # 默认 /api/v1
Content-Type: application/json
Authorization: Bearer <access_token>      # 登录后自动添加
```

### 响应

成功后拦截器直接解包为数据体（业务代码无需 `.data`）。分页固定：

```json
{ "items": [], "total": 0, "page": 1, "page_size": 10, "pages": 0 }
```

失败：`{ "code": 40100, "message": "用户名或密码错误", "data": null }`

| HTTP | 前端行为 |
| --- | --- |
| 400 / 409 | 弹出 `message` |
| 401 | 先尝试续期；失败则清令牌跳登录页 |
| 403 | 弹出「需要管理员权限」 |
| 404 | 资源不存在提示 |
| 422 | 参数校验失败提示 |
| 5xx / 网络异常 | 「网络异常，请检查后端服务是否已启动」 |

### 使用的接口

| 前端位置 | 接口 |
| --- | --- |
| 登录页 | `POST /auth/login` |
| 路由守卫 / 顶栏 | `GET /auth/me`、`POST /auth/refresh`、`POST /auth/logout` |
| 个人中心 | `POST /auth/change-password` |
| 仪表盘 | `GET /system/dashboard` |
| 后台账号 | `GET/POST /users`、`GET/PUT/DELETE /users/{id}`、`PATCH /users/{id}/status`、`PATCH /users/{id}/password` |
| 用户列表 | `GET /members`、`GET /members/stats`、`GET/PUT /members/{id}`、`POST/GET /members/{id}/avatar`、`POST/GET /members/{id}/background`、`PATCH /members/{id}/status`、`PATCH /members/{id}/password`、`DELETE /members/{id}` |
| 官号文章 | `GET/POST /official-articles`、`GET/PUT/DELETE /official-articles/{id}`、`PATCH /official-articles/{id}/status` |
| 动态 / 评论 | `GET /posts`、`GET /posts/{id}`、`PATCH /posts/{id}/status`、`DELETE /posts/{id}`、`GET /comments`、`PATCH /comments/{id}/status`、`DELETE /comments/{id}` |
| 站点设置 | `GET/PUT /site/admin/welcome`、`GET/PUT /site/admin/about-password` |
| 简历 | `/resume/personal-infos`、`/resume/educations`、`/resume/work-experiences`、`/resume/projects`、`/resume/evaluations`、`/resume/skill-tags` 的 CRUD + `/{id}/status`；`POST /resume/personal-infos/upload-avatar` |
| 简历对外 | `GET /resume/public/profiles` |

### 媒体地址

- **头像 / 背景图**：后端资料接口直接返回 `avatar_url` / `background_url`，
  形如 `/api/v1/static/avatars/{会员ID}/avatar_{会员ID}_{随机串}.png`，
  与接口同源，Vite 代理与 Nginx 反代都能直接访问，无需额外配置。
- **未上传**：`avatar_url` 为系统默认头像；接口不可用时界面退化为「昵称首字母 + 渐变」圆块。
- **上传**：`POST /members/{会员ID}/avatar`（multipart，字段名 `file`），后端按会员 ID 建目录。

> 接口契约以后端 `/docs` 的 OpenAPI 为准。

---

## 八、构建与部署

### 8.1 构建

```powershell
npm run build      # 产物在 dist/
```

### 8.2 方案 A：与后端同域（推荐）

```nginx
server {
    listen 80;
    server_name admin.example.com;

    root /var/www/admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8.3 方案 B：前后端分离域名

1. `.env.production` 设 `VITE_API_BASE_URL=https://api.example.com/api/v1`；
2. 后端 `.env` 增加 `BACKEND_CORS_ORIGINS=https://admin.example.com`；
3. 重新构建并部署 `dist/`。

### 8.4 方案 C：Docker（仓库自带编排）

两阶段镜像：`node:26-alpine` 构建 → `nginx:1.30-alpine` 托管。

| 文件 | 作用 |
| --- | --- |
| `Dockerfile` | 多阶段构建，`NODE_IMAGE` / `NPM_REGISTRY` / `NGINX_IMAGE` 可覆盖 |
| `nginx.conf` | SPA 回退、静态长缓存、`/api` 反代（后端地址启动时注入） |
| `docker-compose.yml` | `build.context` 指向 GitHub 仓库 |
| `.env.docker.example` | 变量模板（默认即可用） |

核心思路：**浏览器始终只访问前端一个源**，`VITE_API_BASE_URL` 保持 `/api/v1`，
由 Nginx 转发给后端，因此完全不需要 CORS；后端上传文件与内置资源也在 `/api` 前缀下。

```bash
mkdir -p /opt/fastapi-admin-web && cd /opt/fastapi-admin-web
cp .env.docker.example .env
docker compose up -d --build
curl http://<服务器IP>:8080/api/v1/system/health
```

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `FRONTEND_PORT` | 8080 | 宿主机端口 |
| `API_UPSTREAM` | `http://host.docker.internal:8000` | 后端地址；共享网络时用 `http://backend:8000` |
| `BACKEND_NETWORK` | `fastapi-admin_default` | 仅在共享网络接法生效 |
| `NPM_REGISTRY` | 官方源 | 国内建议 `https://registry.npmmirror.com` |
| `NODE_IMAGE` / `NGINX_IMAGE` | node:26-alpine / nginx:1.30-alpine | 拉不动时填完整仓库地址绕过加速器 |
| `VITE_API_BASE_URL` | `/api/v1` | 改完整地址即等于方案 B（需配 CORS） |

> `Dockerfile` / `.dockerignore` / `nginx.conf` 必须先 push，`build.context` 用的是远端文件。

### 8.5 部署检查清单

- [ ] `VITE_API_BASE_URL` 与实际接口地址一致
- [ ] history 路由已配 `try_files ... /index.html`
- [ ] 分离域名时后端 `BACKEND_CORS_ORIGINS` 已包含前端域名
- [ ] 浏览器控制台无 CORS / 401 报错
- [ ] `curl http://<服务器IP>:8080/api/v1/system/health` 正常

---

## 九、常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 登录提示「网络异常」 | 后端未启动或 `VITE_PROXY_TARGET` 不对；先访问 `/api/v1/system/health` |
| 控制台 CORS 报错 | 分离域名部署未加 `BACKEND_CORS_ORIGINS`（localhost 与 127.0.0.1 需一致） |
| 刷新页面 404 | 未配 `try_files $uri $uri/ /index.html` |
| 改 `.env` 不生效 | 需重启 `npm run dev`（变量在构建时静态替换） |
| 登录后一直跳回登录页 | 本地令牌失效，清理 `admin_access_token` / `admin_refresh_token` |
| 菜单看不到某分组 | 该分组及子项仅 `admin` 角色可见 |
| 会员头像显示为字母圆块 | 未上传且默认头像也未取到（预期降级）；已上传仍不显示时检查 `/api/v1/static/` 是否放行 |
| 用户 ID 与内部 ID 不一致 | 列表里「用户 ID」是注册时生成的 10 位会员编号，内部 ID 是数据库主键 |
| 端口被占用 | `npm run dev -- --port 5174` |
| 主题不跟随系统 | 手动切换过会写入 `admin.appearance`，清掉该 key 即恢复跟随系统 |
| Docker 页面能开但接口 502 | `API_UPSTREAM` 写错或容器不互通：`docker exec admin-frontend wget -qO- http://backend:8000/api/v1/system/health` |
| `network-scoped alias is supported only in user defined networks` | 网络指向了默认 `bridge`；去掉 compose 的 `networks` 声明即可 |
| `network xxx declared as external, but could not be found` | 网络名不对或后端没起；用 `docker inspect admin-backend --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'` 查 |
| `npm ci` 超时 | `.env` 里把 `NPM_REGISTRY` 换成国内源 |
