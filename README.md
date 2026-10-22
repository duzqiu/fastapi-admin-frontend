# 后台管理系统 · Vue 前端

**后台管理系统** 的管理界面，基于 **Vue 3 + Vite + Element Plus + Pinia**，
配套后端项目见 `../fastapi-admin-backend`。

设计目标：**简约实用、开箱可用、看得舒服点得顺手**。与后端**完全解耦**，可单独部署，
两者仅通过 HTTP 接口通讯。

系统名称集中在 `src/constants/index.js`：`APP_NAME` 是全称（浏览器标题、底部版权行），
`APP_BRAND_NAME` 是左上角的品牌名（侧边栏与登录页共用，比全称短）。

---

## 目录

- [一、项目简介](#一项目简介)
- [二、技术栈](#二技术栈)
- [三、目录结构与各文件功能](#三目录结构与各文件功能)
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
| 登录认证 | JWT 登录、令牌本地持久化、access_token 过期自动静默续期 |
| 仪表盘 | 统计卡片（注册会员 / 近 7 天新增会员 / 后台账号） |
| 后台管理（一级菜单） | 收纳「后台账号」子菜单 |
| └ 后台账号 | 列表搜索分页、新建、编辑、启用/禁用、重置密码、删除 |
| 用户管理（一级菜单） | 收纳「用户列表」子菜单 |
| └ 用户列表 | 用户中心注册用户：统计概览、6 位用户 ID 展示与检索、列表筛选、详情抽屉、编辑资料（昵称/头像上传/**背景图上传**/性别/生日/手机号/地区/简介）、启用/禁用、重置密码、删除 |
| 菜品管理（一级菜单） | 收纳「菜品列表 / 菜品分类 / 菜品标签 / 订单管理」四个子菜单，侧边栏可折叠展开 |
| ├ 菜品列表 | 菜名/图片（可上传）/价格/库存/单位/状态、分类与标签、**套餐与售卖规则**（起购/限购/每日限量/供应时段）、库存调整、上架下架、销量与统计 |
| ├ 菜品分类 | 分类 CRUD，展示每个分类下的菜品数；分类下仍有菜品时禁止删除 |
| ├ 菜品标签 | 标签 CRUD，可选语义色，展示关联菜品数与**启用状态**；停用后不再出现在 C 端菜单标签中 |
| └ 订单管理 | 点菜订单列表（含**菜品明细**摘要、表格自适应满宽不留白）与筛选、订单详情（含明细快照）、接单/完成/取消（取消自动回滚库存与销量）、删除、今日经营统计 |
| 个人中心 | 查看账号信息、修改密码 |
| 体验细节 | 面包屑、菜单权限过滤、加载态、空状态、统一错误提示、响应式布局 |

> **关于「用户中心」前端页面**：本项目的定位是**后台管理端**，因此只包含「用户列表」。
> 面向会员的注册 / 登录 / 忘记密码 / 个人中心页面属于另一个 C 端应用，
> 直接调用后端已提供的 `/api/v1/member/**` 接口即可（接口清单见后端 README 第八节）。

---

## 二、技术栈

| 组件 | 版本 | 用途 |
| --- | --- | --- |
| Vue | 3.5 | 前端框架（组合式 API + `<script setup>`） |
| Vite | 6.x | 构建与开发服务器 |
| Vue Router | 4.x | 路由与登录守卫 |
| Pinia | 2.x | 状态管理（用户 / 应用） |
| Element Plus | 2.9 | UI 组件库（中文语言包） |
| Axios | 1.7 | HTTP 请求封装（拦截器 + 令牌续期） |
| Sass | 1.83 | 样式预处理 |

---

## 三、目录结构与各文件功能

```
fastapi-admin-frontend/
├── index.html                      入口 HTML（含首屏加载动画）
├── vite.config.js                  构建配置：别名、接口代理、分包
├── package.json                    依赖与脚本
├── .env.development                开发环境变量（代理目标指向本地后端）
├── .env.production                 生产环境变量（接口基地址）
├── Dockerfile                      ★ 容器镜像：Node 构建 + Nginx 托管（参数可覆盖基础镜像 / npm 源）
├── nginx.conf                      ★ Nginx 模板：SPA 回退 + /api 反向代理到后端（地址启动时注入）
├── docker-compose.yml              ★ 前端容器编排：复用后端 compose 网络，浏览器只访问前端，无跨域
├── .dockerignore                   构建上下文排除项（node_modules / dist / 本地 .env）
├── .env.docker.example             compose 变量模板（cp 成 .env 后使用）
├── public/favicon.svg              站点图标
│
└── src/
    ├── main.js                     应用入口：Pinia、Router、Element Plus、全局图标、401 跳转注入
    ├── App.vue                     根组件（仅承载 router-view）
    │
    ├── api/                        ★ 接口层：一个后端模块对应一个文件
    │   ├── request.js              Axios 实例：令牌注入、响应解包、错误提示、静默续期、失败重放
    │   ├── auth.js                 /auth/*     登录、当前用户、改密、登出
    │   ├── user.js                 /users/*    后台账号 CRUD、启禁用、重置密码
    │   ├── member.js               /members/*  用户中心会员：列表、统计、详情、编辑、启禁用、重置密码、头像 / 背景图上传与按 ID 读取
    │   ├── dish.js                 /dishes/*   菜品 / 套餐 / 分类 / 标签 / 订单管理（点菜菜单）
    │   └── system.js               /system/*   健康检查、系统信息（接口封装）、首页统计
    │
    ├── router/                     ★ 路由
    │   ├── menu.js                 侧边栏菜单路由（含 title / icon / roles 元信息）
    │   └── index.js                路由表 + 登录守卫 + 角色校验 + 标题设置
    │
    ├── stores/                     ★ 状态管理
    │   ├── user.js                 令牌、当前用户、登录/登出/拉取信息
    │   ├── app.js                  侧边栏折叠、二级菜单展开状态（会话内）、项目名
    │   └── usage.js                页面访问频次（仪表盘「常用入口」按它排序）
    │
    ├── layouts/
    │   └── DefaultLayout.vue       后台主框架：侧边栏 + 顶栏 + 面包屑 + 内容区
    │
    ├── components/
    │   └── PageHeader.vue          页面标题栏（标题 / 描述 / 右侧操作插槽）
    │
    ├── views/                      ★ 页面
    │   ├── login/index.vue         登录页（左侧品牌介绍 + 右侧表单）
    │   ├── dashboard/index.vue     仪表盘（统计卡片）
    │   ├── user/index.vue          用户管理（表格 / 搜索 / 弹窗表单 / 密码重置）
    │   ├── member/index.vue        用户列表（统计卡片 / 筛选 / 详情抽屉 / 编辑弹窗 / 启禁用）
    │   ├── dish/index.vue          菜品管理（图片上传 / 分类标签 / 套餐与规则抽屉 / 库存调整）
    │   ├── dish/category.vue       菜品分类管理（表格 + 弹窗表单）
    │   ├── dish/tag.vue            菜品标签管理（表格 + 弹窗表单）
    │   ├── dish/order.vue          订单管理（统计卡片 / 筛选 / 详情抽屉 / 状态流转）
    │   ├── profile/index.vue       个人中心（账号信息 + 修改密码）
    │   └── error/404.vue           404 页面
    │
    ├── constants/index.js          与后端一致的枚举（角色、会员性别、菜品/订单状态）及展示映射
    ├── utils/
    │   ├── auth.js                 令牌读写（localStorage 收口）
    │   └── format.js               日期、数字、文本格式化
    └── styles/index.scss           全局样式、主题 CSS 变量、Element Plus 主题覆盖
```

**分层约定（与后端一致的高内聚低耦合思路）**

- 页面（`views`）只负责交互与展示，不直接写 `axios` 调用，统一走 `api/`。
- `api/` 只描述「请求哪个接口、传什么参数」，不做业务判断。
- `stores/` 承载跨页面共享状态（登录态、折叠状态），页面不互相传参。
- `constants/` 与 `utils/` 为纯函数与常量，不依赖其他层。

---

## 四、快速开始

> 需要 Node.js ≥ 18；**Node 18 / 20 均已 EOL**。容器镜像默认用 `node:26-alpine` 构建
> （Node 26 目前是 Current，预计 2026-10 转入 LTS）；想要 LTS 就写 `node:24`。
> 该阶段只负责构建，产物会拷进 nginx 阶段，不影响最终镜像体积。

### 1. 安装依赖

```powershell
cd fastapi-admin-frontend
npm install
```

### 2. 确认后端地址

`.env.development` 默认已指向本地后端：

```dotenv
VITE_API_BASE_URL=/api/v1
VITE_PROXY_TARGET=http://127.0.0.1:8000
```

如果后端不在本机 8000 端口，只改 `VITE_PROXY_TARGET` 即可。

### 3. 启动开发服务器

```powershell
npm run dev
```

打开 http://localhost:5173 ，使用后端初始账号登录：

```
账号：admin
密码：admin123
```

> 开发环境下 `/api` 由 Vite 代理转发到后端，**本地调试无需配置跨域**。

### 4. 可选：正式构建并本地预览

```powershell
npm run build
npm run preview
```

---

## 五、环境变量与接口地址

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 接口基地址。同域部署用 `/api/v1`；后端独立域名用 `https://api.example.com/api/v1` |
| `VITE_PROXY_TARGET` | **仅开发/预览环境有效**，把 `/api` 代理到该地址 |
| `VITE_API_TIMEOUT` | 请求超时（毫秒） |

三种典型组合：

| 场景 | 配置 | 是否需要跨域 |
| --- | --- | --- |
| 本地开发 | `VITE_API_BASE_URL=/api/v1` + `VITE_PROXY_TARGET=http://127.0.0.1:8000` | 不需要 |
| 生产同域（Nginx 同域托管前端并反代 `/api`） | `VITE_API_BASE_URL=/api/v1` | 不需要 |
| 生产分离域名 | `VITE_API_BASE_URL=https://api.example.com/api/v1` | **需要把前端域名加入后端 `BACKEND_CORS_ORIGINS`** |

修改 `.env.*` 后需要**重启**开发服务器才会生效。

---

## 六、功能说明

### 侧边栏菜单结构

菜单为「一级菜单（可折叠）+ 二级菜单」两层，全部定义在 `src/router/menu.js`：
带 `children` 的节点渲染为可展开的一级菜单，其子项会被拍平成真实路由。

```
仪表盘              /dashboard

后台管理            （仅 admin）
  └ 后台账号        /users

用户管理            （仅 admin）
  └ 用户列表        /members

菜品管理            （仅 admin）
  ├ 菜品列表        /dishes
  ├ 菜品分类        /dish-categories
  ├ 菜品标签        /dish-tags
  └ 订单管理        /dish-orders
```

- 菜单项分两类：**叶子菜单**（如仪表盘，直接是一级菜单）与**分组菜单**（带子菜单，可折叠展开）；
- 分组标题就是折叠开关（右侧箭头跟着转），**进入后台时二级菜单默认全部收起**；
  本次会话里手动展开过的分组会保留到刷新为止（不落盘，刷新 / 重新登录回到全收起）；
  切换是即时的（不做高度动画，免得下面的分组被「撑开」、选中框跟着飘）；
- 导航轨收成图标（76px）时没有可点的组标题，各分组子项一律展开；
- 面包屑显示三级：`首页 / 一级菜单 / 当前页`（叶子一级菜单只显示两级）；
- 从其它页面跳到某个二级页面时，所属分组会自动展开（直接进入后台时保持全收起）；
- 分组与其子项都按角色过滤：**子项全部被过滤时，该分组不展示**；
- `个人中心 /profile` 保留路由但不在菜单中展示（通过右上角头像菜单进入）。

### 登录页 `/login`

- 左侧品牌介绍区，右侧登录表单，支持回车提交、记住账号。
- 登录成功后跳转到 `redirect` 参数指定的页面，默认进入仪表盘。

### 仪表盘 `/dashboard`

- 统计卡片：注册会员 / 近 7 天新增 / 后台账号。
- **常用入口**：按当前浏览器的使用频次自动排序，展示访问次数最多的 4 个菜单页（副标题显示「访问 N 次」）；
  还没攒够记录时用默认入口补齐。频次在每次进入菜单页面时累加，存在 `localStorage` 的
  `admin_menu_usage` 里（`src/stores/usage.js`），换浏览器 / 清缓存会重新统计。
- 数据在进入页面时自动拉取。

### 用户列表 `/members`（用户管理 ▸ 用户列表，仅 `admin` 角色可见）

面向**用户中心自助注册的用户**（与「用户管理」的后台账号概念不同）：

- **统计概览**：注册会员总数、启用中、近 7 天新增、邮箱已验证。
- **列表**：内部ID（数据库主键）、**用户ID**（注册时生成的 6 位唯一编号）、会员（头像 / 昵称 / 邮箱）、
  性别、生日、**地区**、邮箱验证、状态开关、最后登录、注册时间。
- **筛选**：关键词（**用户ID** / 邮箱 / 昵称 / 手机号，支持片段匹配）、性别、启用状态、邮箱验证状态。
- **详情抽屉**：用户 ID、内部 ID、头像、昵称、邮箱、性别、生日、年龄、手机号、**地区**、个人简介、
  邮箱验证时间、最后登录、注册时间、更新时间，并提供「编辑资料 / 禁用账号」快捷操作。
- **编辑**：昵称、头像（**可直接上传**，也支持填图片地址，带实时预览）、**背景图**（同样可直接
  上传，16:9 缩略图预览；没设置时显示「未设置」）、性别、生日（日期选择器）、手机号、**地区**、
  简介、启用状态。
- **启用 / 禁用**：表格内开关一键切换；禁用后该会员立即无法登录，已签发令牌同步失效。
- **重置密码**：管理员直接设置新密码，无需邮箱验证码。
- **删除**：二次确认后删除。

### 后台账号 `/users`（二级菜单，收纳在「后台管理」下，仅 `admin` 角色可见）

- 关键词（用户名/邮箱/昵称）、角色、启用状态组合筛选。
- 新建 / 编辑用户（含密码强度校验：6–64 位且同时包含字母与数字）。
- 表格内一键启用 / 禁用；重置密码；删除（带二次确认）。
- 当前登录账号的禁用与删除按钮自动置灰，后端同时有「最后一个管理员」保护。

> 下面四页统一收纳在侧边栏的一级菜单 **菜品管理** 下（`菜品管理 ▸ 菜品列表 / 菜品分类 / 菜品标签 / 订单管理`），
> 面包屑会显示「首页 / 菜品管理 / 当前页」。

### 菜品列表 `/dishes`（菜品管理 ▸ 菜品列表，仅 `admin` 角色可见）

- **统计卡片**：菜品总数、在售中、库存告急（库存 < 10）、累计销量。
- **筛选**：菜名/描述关键词、分类、标签、售卖状态、只看库存告急。
- **新建 / 编辑**：菜名、描述、**图片（支持本地上传或直接填地址）**、价格、库存、单位、分类、标签（多选）、状态、排序、是否推荐。
- **套餐与规则**：点「套餐」打开抽屉，可为同一道菜维护多个套餐，每个套餐独立设置
  价格 / 库存 / 默认选中 / 是否可售，以及**起购份数、每单限购、每日限量、供应时段**；
  抽屉内展示每个套餐的已售、今日已售、规则摘要。
  未配置套餐的菜品会直接按菜品自身的价格与库存售卖。
- **库存调整**：支持「补货 / 报损（在原库存上增减）」与「直接设为」两种方式。
- **一键上下架**；表格中实时展示每个菜品的**已售数量**。

### 菜品分类 `/dish-categories`（菜品管理 ▸ 菜品分类，仅 `admin` 角色可见）

- 分类 CRUD（名称 / 描述 / 排序 / 启用状态），表格展示每个分类下的菜品数。
- 分类下仍有菜品时后端会拒绝删除并给出提示。

### 菜品标签 `/dish-tags`（菜品管理 ▸ 菜品标签，仅 `admin` 角色可见）

- 标签 CRUD（名称 / 语义色 / 排序 / **启用状态**），表格展示关联菜品数、颜色名称与状态。
- **停用**后该标签不再出现在 C 端菜单的标签列表与菜品标签中；后台仍可查看、编辑，
  也可以继续挂在菜品上（不影响历史数据）。重新启用即可恢复展示。
- 删除标签只解除关联，不会删除菜品本身。

### 订单管理 `/dish-orders`（菜品管理 ▸ 订单管理，仅 `admin` 角色可见）

- **统计卡片**：订单总数、待接单、今日订单、今日营业额。
- **筛选**：订单号 / 桌号关键词、订单状态、下单时间范围。
- **列表**：订单号、菜品明细摘要、桌号、下单人（会员昵称或「扫码点单」）、份数、金额、状态、下单时间；
  列宽自适应容器满宽，窄屏自动省略号 + 悬停查看完整内容。
- **详情抽屉**：订单信息 + 菜品明细（菜名、套餐名、图片、单价快照、数量、小计）+ 合计金额 + 快捷操作。
- **状态流转**：待接单 →（接单）→ 已接单 →（完成）→ 已完成；待接单 / 已接单可取消。
  **取消确认时会明确提示会回滚库存与销量**；已完成 / 已取消为终态。

> 点菜菜单（`/api/v1/menu/**`）是面向顾客的 C 端接口：浏览无需登录、下单支持扫码匿名，
> 本管理端只消费其中的后台管理接口。如需顾客端页面，可直接对接后端 `/menu/**` 接口。

### 个人中心 `/profile`

- 展示账号信息（ID、用户名、昵称、邮箱、状态、最后登录、创建时间）。
- 修改密码（校验原密码、新密码强度、两次输入一致）。

### 全局体验

- 菜单按角色自动过滤；无权限访问时提示并跳回仪表盘。
- `access_token` 过期时自动用 `refresh_token` 续期，并把期间失败的请求**自动重放**；
  续期失败才跳转登录页。
- 所有接口错误统一以 `ElMessage` 提示（文案取自后端 `message` 字段）。

---

## 七、与后端的接口约定

### 基地址

所有请求形如 `{VITE_API_BASE_URL}{path}`，默认 `/api/v1`。

### 请求头

```
Content-Type: application/json
Authorization: Bearer <access_token>     # 登录后自动添加
```

### 成功响应

直接返回数据体（不使用 `code/message/data` 包裹）。分页接口固定为：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 10,
  "pages": 0
}
```

### 错误响应

```json
{ "code": 40100, "message": "用户名或密码错误", "data": null }
```

| HTTP 状态 | 前端行为 |
| --- | --- |
| 400 / 409 | 弹出 `message` 提示 |
| 401 | 尝试刷新令牌；失败则清除本地令牌并跳转登录页 |
| 403 | 弹出「需要管理员权限」 |
| 404 | 弹出资源不存在的提示 |
| 422 | 弹出参数校验失败提示 |
| 5xx / 网络异常 | 弹出「网络异常，请检查后端服务是否已启动」 |

### 使用的接口

| 前端位置 | 接口 |
| --- | --- |
| 登录页 | `POST /auth/login` |
| 路由守卫 / 顶栏 | `GET /auth/me` |
| 令牌续期 | `POST /auth/refresh` |
| 退出登录 | `POST /auth/logout` |
| 修改密码 | `POST /auth/change-password` |
| 仪表盘 | `GET /system/dashboard` |
| 用户管理（后台账号） | `GET/POST /users`、`PUT /users/{id}`、`PATCH /users/{id}/status`、`PATCH /users/{id}/password`、`DELETE /users/{id}` |
| 用户列表（用户中心） | `GET /members`（`keyword` 支持用户ID / 邮箱 / 昵称 / 手机号）、`GET /members/stats`、`GET/PUT /members/{id}`、`POST /members/{id}/avatar`（上传头像）、`GET /members/{id}/avatar`（按会员 ID 读头像）、`POST /members/{id}/background`（上传背景图）、`GET /members/{id}/background`（按会员 ID 读背景图）、`PATCH /members/{id}/status`、`PATCH /members/{id}/password`、`DELETE /members/{id}` |
| 菜品管理 | `GET/POST /dishes`、`GET/PUT/DELETE /dishes/{id}`、`PATCH /dishes/{id}/status`、`PATCH /dishes/{id}/stock`、`POST /dishes/upload-image`、`GET /dishes/stats` |
| 套餐管理 | `GET/POST /dishes/{id}/specs`、`PUT/DELETE /dishes/{id}/specs/{spec_id}` |
| 分类 / 标签 | `GET/POST /dish-categories`、`PUT/DELETE /dish-categories/{id}`、`GET/POST /dish-tags`（支持 `only_active`）、`PUT/DELETE /dish-tags/{id}` |
| 订单管理 | `GET /dish-orders`、`GET /dish-orders/{id}`、`PATCH /dish-orders/{id}/status`、`DELETE /dish-orders/{id}`、`GET /dish-orders/stats`、`GET /dish-orders/dish-sales` |

### 会员头像的显示

- **已上传**：后端返回的头像地址形如 `/api/v1/static/avatars/{会员ID}/avatar_{会员ID}_{随机串}.png`，
  与接口同源（在 `/api` 前缀下），因此本地 Vite 代理和生产 Nginx 的 `/api` 反向代理都能直接访问，
  无需单独配置。
- **未上传**：资料接口返回的 `avatar_url` 会自动变成系统默认头像地址；接口也不可用时，
  界面退化为「昵称首字母 + 主题渐变」的圆形头像。
  （后端会员侧已不再提供单独的「获取头像」接口，地址统一由资料接口的 `avatar_url` 给出。）
- **上传**：编辑弹窗里的「上传头像」走 `POST /members/{会员ID}/avatar`（multipart，字段名 `file`），
  后端按会员 ID 建目录存放（`data/uploads/avatars/{会员ID}/`），并自动把新地址写回会员头像字段。

> 接口契约以后端 `http://<后端地址>/docs` 的 OpenAPI 文档为准。

---

## 八、构建与部署

### 8.1 构建

```powershell
npm run build      # 产物输出到 dist/
```

### 8.2 方案 A：与后端同域（推荐，零跨域配置）

Nginx 同时托管前端静态文件并把 `/api` 反向代理到后端：

```nginx
server {
    listen 80;
    server_name admin.example.com;

    root /var/www/admin;              # 把 dist/ 里的内容放这里
    index index.html;

    # 前端路由使用 history 模式，未命中的路径回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 接口反向代理到 FastAPI 服务
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

`.env.production` 保持 `VITE_API_BASE_URL=/api/v1` 后重新 `npm run build` 即可。

### 8.3 方案 B：前后端分离域名

1. `.env.production` 设置 `VITE_API_BASE_URL=https://api.example.com/api/v1`；
2. **后端** `.env` 增加前端域名：

```dotenv
BACKEND_CORS_ORIGINS=https://admin.example.com
```

3. 重新构建并部署静态文件到任意静态服务器（Nginx / CDN / 对象存储）。

### 8.4 方案 C：Docker 一键托管（仓库自带编排）

仓库根目录已经放好了完整的容器化文件，镜像是**两阶段**的：`node:26-alpine` 里构建出 `dist/`，
再拷进 `nginx:1.30-alpine` 托管：

| 文件 | 作用 |
| --- | --- |
| `Dockerfile` | 多阶段构建；`NODE_IMAGE` / `NPM_REGISTRY` / `NGINX_IMAGE` 等构建参数可覆盖，便于受限网络 |
| `nginx.conf` | Nginx 模板：SPA 回退、静态资源长缓存、`/api` 反向代理（后端地址在容器启动时注入） |
| `docker-compose.yml` | 前端服务编排，`build.context` 指向 GitHub 仓库；默认走宿主机端口，也可选择**与后端共享网络** |
| `.env.docker.example` | 变量模板（`cp` 成 `.env` 后使用，**默认配置直接可用**） |

**核心思路：浏览器自始至终只访问前端这一个源。** `VITE_API_BASE_URL` 保持相对路径 `/api/v1`，
由 Nginx 转发给后端，因此**完全不需要配置 CORS**；后端的上传文件（`/api/v1/static/*`）与内置静态资源
（`/api/v1/assets/*`）也都在 `/api` 前缀下，同一条代理规则即可覆盖。

Nginx 转发到后端有两种接法：

| 接法 | `API_UPSTREAM` | 网络声明 | 说明 |
| --- | --- | --- | --- |
| **A · 默认（零配置）** | `http://host.docker.internal:8000` | **不声明 `networks`** | 走宿主机映射端口。Compose 会自动建一个用户自定义网络，别名与容器互访都正常 |
| B · 共享网络 | `http://backend:8000` | 打开 compose 里两处「接法 B」注释块，并设 `BACKEND_NETWORK` | 少一层 NAT，后端 8000 可以不对宿主机暴露；但该网络必须先存在 |

> ⚠️ **不要把网络指向 Docker 默认的 `bridge`**：Compose 会给容器设置 network-scoped alias（服务名 / 容器名），
> 而 Docker 只允许在**用户自定义网络**上使用别名，指向默认 `bridge` 会直接报
> `network-scoped alias is supported only for containers in user defined networks`。

```bash
# 0) 先确认后端已经在跑（前端要能访问到它的 8000 端口）
docker ps --format "table {{.Names}}\t{{.Status}}"

# 1) 在服务器上准备两个文件（不用拷源码）
mkdir -p /opt/fastapi-admin-web && cd /opt/fastapi-admin-web
#   docker-compose.yml
#   .env.docker.example
cp .env.docker.example .env      # 默认即为接法 A，一个字符都不用改

# 2) 构建并启动
docker compose up -d --build
docker compose logs -f frontend
```

> **想换成接法 B（共享网络）**：需要三处一起改 ——
> ① 打开 `docker-compose.yml` 里两处标注「接法 B」的 `networks` 注释块；
> ② `.env` 的 `API_UPSTREAM` 改成 `http://backend:8000`；
> ③ `.env` 的 `BACKEND_NETWORK` 改成后端的真实网络名：
>
> ```bash
> docker compose ls        # 确认后端 compose 项目在跑；默认网络名 = 「项目名_default」
> docker inspect admin-backend --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
> ```
>
> 如果报 `network xxx declared as external, but could not be found`，说明名字不对或后端没起 ——
> 把 ① 的两处注释块改回注释状态即可退回接法 A，功能上没有任何区别，只是多一层宿主机转发。

访问 `http://<服务器IP>:8080/`。想确认反代是否打通，直接看
`http://<服务器IP>:8080/api/v1/system/health`，能返回后端的健康检查结果即为正常。

> ⚠️ 仓库里的 `Dockerfile` / `.dockerignore` / `nginx.conf` **必须先 push**：
> `build.context` 指向 GitHub 仓库，构建用的是远端文件。

常用变量（写在 `.env` 里）：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `FRONTEND_PORT` | `8080` | 宿主机端口（80 常被系统 / NAS 面板占用） |
| `API_UPSTREAM` | `http://host.docker.internal:8000` | 后端地址。接法 B 时改成 `http://backend:8000`（服务名）或 `http://admin-backend:8000`（容器名） |
| `BACKEND_NETWORK` | `fastapi-admin_default` | **只在接法 B 生效**（compose 里那段 `networks` 默认处于注释状态）：填后端 compose 的真实网络名。接法 A 完全不读它 |
| `NPM_REGISTRY` | 官方源 | 国内建议 `https://registry.npmmirror.com` |
| `NODE_IMAGE` / `NGINX_IMAGE` | `node:26-alpine` / `nginx:1.30-alpine` | Node 26（Current，预计 2026-10 转 LTS；仅用于构建阶段）；nginx 1.30 为 stable 分支。拉不动时填**完整仓库地址**绕过失效的镜像加速器 |
| `VITE_API_BASE_URL` | `/api/v1` | 保持相对路径；改成完整地址即等于方案 B（此时必须配 CORS） |

不想用 compose、只想单容器跑也可以（不共享网络，改走宿主机端口）：

```bash
docker build -t admin-web .
docker run -d --name admin-web -p 8080:80 \
  --add-host=host.docker.internal:host-gateway \
  -e API_UPSTREAM=http://host.docker.internal:8000 \
  admin-web
```

### 8.5 部署检查清单

- [ ] `VITE_API_BASE_URL` 与实际接口地址一致
- [ ] 使用 history 路由时，Nginx 已配置 `try_files ... /index.html`
- [ ] 分离域名部署时，后端 `BACKEND_CORS_ORIGINS` 已包含前端域名
- [ ] 通过浏览器控制台确认没有 CORS / 401 报错

Docker 部署（方案 C）额外确认：

- [ ] 前端仓库的 `Dockerfile` / `.dockerignore` / `nginx.conf` 已 push 到 GitHub
- [ ] 确认走的是接法 A（默认，compose 里不声明 `networks`）还是接法 B（已打开两处 `networks` 注释块，且 `API_UPSTREAM` / `BACKEND_NETWORK` 配套）
- [ ] `curl http://<服务器IP>:8080/api/v1/system/health` 能返回后端健康检查结果
- [ ] `docker compose ps` 里 `admin-frontend` 为 `healthy`

---

## 九、常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 登录提示「网络异常」 | 后端未启动或 `VITE_PROXY_TARGET` 地址不对；先访问 `http://127.0.0.1:8000/api/v1/system/health` 确认 |
| 控制台出现 CORS 报错 | 分离域名部署时未把前端域名加入后端 `BACKEND_CORS_ORIGINS`（或用了 `localhost` 访 `127.0.0.1`，需保持一致） |
| 刷新页面 404 | 服务器未配置 `try_files $uri $uri/ /index.html` |
| 改了 `.env` 不生效 | 需重启 `npm run dev`；`.env` 在构建时被静态替换 |
| 登录后一直跳回登录页 | 本地令牌已失效，清理浏览器 `localStorage` 中的 `admin_access_token` / `admin_refresh_token` 后重试 |
| 菜单里看不到「后台账号 / 用户管理 / 菜品管理」 | 这些一级菜单及其子项仅 `admin` 角色可见 |
| 会员头像显示为字母圆块 | 该会员未上传头像且默认头像也没取到（属于预期降级）；已上传却仍不显示时，检查 `/api/v1/static/` 是否被代理放行 |
| 端口被占用 | `npm run dev -- --port 5174` 指定其他端口 |
| Docker 里页面能打开但所有接口 502 | Nginx 代理不到后端：`API_UPSTREAM` 写错，或前端容器没和后端在同一网络。在容器内直接验证：`docker exec admin-frontend wget -qO- http://backend:8000/api/v1/system/health` |
| 启动报 `network-scoped alias is supported only for containers in user defined networks` | 你把网络指向了 Docker 默认的 `bridge`。别名只能用在**用户自定义网络**上，而 Compose 必定会给容器加服务名 / 容器名别名。去掉 compose 里的 `networks` 声明（即接法 A，默认配置）即可；想共享后端网络就把 `BACKEND_NETWORK` 填成后端那个**用户自定义**网络名 |
| 启动报 `network xxx declared as external, but could not be found` | `external: true` 的网络必须**先存在**。接法 A 根本不声明网络，不会遇到；若在用接法 B，用 `docker compose ls` / `docker inspect admin-backend --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'` 查真实网络名（**不一定是 `fastapi-admin_default`**，默认是「后端 compose 项目名_default」，例如目录叫 `fastapi-admin-backend` 时是 `fastapi-admin-backend_default`） |
| 前端容器反复重启 / 日志报 `host not found in upstream` | 容器启动时解析不到 `API_UPSTREAM`，nginx 会直接退出。确认后端服务名/容器名拼写，或改用 `http://host.docker.internal:8000`；`restart: unless-stopped` 会自动重试 |
| 构建时 `npm ci` 超时 / `ECONNRESET` | 在 `.env` 里把 `NPM_REGISTRY` 改成国内源（如 `https://registry.npmmirror.com`）后重新构建 |
| 构建报 `failed to resolve source metadata ... 403 / 401` | 与后端同理：Docker daemon 里配的加速器失效了。在 `.env` 里给 `NODE_IMAGE` / `NGINX_IMAGE` 填**完整仓库地址**（带域名即绕过加速器） |
