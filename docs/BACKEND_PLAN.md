# 后端开发计划

## 第一阶段：基础设施 & 用户系统

### 1.1 项目脚手架
- [x] 初始化 NestJS 项目，配置 TypeScript 严格模式
- [x] 配置 ESLint + Prettier（引用 `@subgate/config`）
- [x] 配置全局异常过滤器 `common/filters/http-exception.filter.ts`
- [x] 配置全局响应拦截器 `common/interceptors/response.interceptor.ts`（统一 `{ code, message, data }` 格式）
- [x] 配置全局验证管道 `common/pipes/validation.pipe.ts`（class-validator）
- [x] 配置 CORS、helmet、请求限流中间件

### 1.2 数据库 & ORM
- [x] 配置 `@subgate/types` 共享类型包初始化
- [x] 编写 Prisma Schema：`Users` 表
- [x] 编写 Prisma Schema：`Sources` 表
- [x] 编写 Prisma Schema：`Configs` 表
- [x] 编写 Prisma Schema：`Vault` 表
- [x] 执行 `prisma migrate dev` 生成迁移文件
- [x] 创建 `prisma/prisma.service.ts` 全局数据库服务

### 1.3 用户认证模块
- [x] 实现 `POST /api/auth/register` — 注册（bcrypt 加密密码）
- [x] 实现 `POST /api/auth/login` — 登录（返回 JWT）
- [x] 实现 `GET /api/auth/profile` — 获取当前用户信息
- [x] 实现 `PUT /api/auth/password` — 修改密码
- [x] 实现 `DELETE /api/auth/account` — 注销账号
- [x] 实现 JWT 守卫 `common/guards/jwt-auth.guard.ts`
- [x] 实现 `@CurrentUser()` 装饰器 `common/decorators/current-user.decorator.ts`
- [x] 注册接口编写测试（集成测试）

### 1.4 健康检查
- [x] 实现 `GET /api/health` — 服务健康检查
- [x] 健康检查包含数据库连接状态检测

---

## 第二阶段：订阅源 & 转换引擎

### 2.1 订阅源管理模块
- [x] 实现 `GET /api/sources` — 获取当前用户订阅源列表（分页）
- [x] 实现 `POST /api/sources` — 添加订阅源（校验 URL 格式）
- [x] 实现 `GET /api/sources/:id` — 获取订阅源详情
- [x] 实现 `PUT /api/sources/:id` — 更新订阅源信息
- [x] 实现 `DELETE /api/sources/:id` — 删除订阅源

### 2.2 订阅源健康检查
- [x] 实现健康检查服务（HTTP HEAD 请求检测 URL 可达性）
- [x] 使用 Redis 缓存检查结果（TTL 5 分钟）
- [x] 后台定时任务（Cron）每 30 分钟扫描所有活跃订阅源
- [x] 在线/离线状态更新到 Sources 表

### 2.3 SubConverter 集成
- [x] 编写 SubConverter 配置管理（`config/subconverter.config.ts`）
- [x] 实现 SubConverter 进程调用服务（调用本地二进制或 HTTP API）
- [x] 实现 `GET /api/generate` — 核心生成接口
- [x] 支持多订阅源聚合（A + B → 单份配置）
- [x] 支持目标格式转换（Clash Meta / Surge / Quantumult X / Stash）
- [x] 实现 `GET /api/sub/:uuid` — 托管接口（无需鉴权，UUID 保护）
- [x] Redis 缓存生成的配置内容（TTL 可配置，默认 10 分钟）
- [x] 处理 SubConverter 进程超时与错误重试

### 2.4 配置模板模块
- [x] 实现 `GET /api/configs` — 获取用户配置模板列表
- [x] 实现 `POST /api/configs` — 创建配置模板
- [x] 实现 `GET /api/configs/:id` — 获取模板详情
- [x] 实现 `PUT /api/configs/:id` — 更新模板（自定义规则、目标类型）
- [x] 实现 `DELETE /api/configs/:id` — 删除模板
- [x] 预设模板数据初始化（"基础分流"、"全能拦截"、"AI 优先"）

---

## 第三阶段：订阅仓库 & 完善

### 3.1 订阅仓库模块
- [x] 实现 `GET /api/vault` — 获取收藏列表
- [x] 实现 `POST /api/vault` — 添加到仓库
- [x] 实现 `GET /api/vault/:id` — 获取收藏详情
- [x] 实现 `PUT /api/vault/:id` — 更新备注/标签/过期日期
- [x] 实现 `DELETE /api/vault/:id` — 移除收藏

### 3.2 Redis 缓存基础设施
- [x] 配置 Redis 连接（`config/redis.config.ts`）
- [x] 封装 CacheService（set/get/del/ttl）
- [x] 配置内容生成缓存
- [x] 健康检查结果缓存

### 3.3 日志 & 可观测性
- [x] 集成请求日志拦截器（记录 method、path、耗时、IP）
- [x] 配置生成日志（记录用户 ID、目标格式、时间戳）
- [x] 异常日志记录（捕获堆栈信息）

---

## 第四阶段：部署 & CI/CD

### 4.1 Docker 封装
- [ ] 编写 `apps/server/Dockerfile`（多阶段构建）
- [ ] 编写 `apps/web/Dockerfile`
- [ ] 完善 `docker-compose.yml`（postgres + redis + server + web + subconverter）
- [ ] SubConverter 镜像集成配置

### 4.2 CI/CD
- [ ] GitHub Actions：代码检查（lint + type check）
- [ ] GitHub Actions：自动化测试
- [ ] GitHub Actions：Docker 镜像构建

---

> **状态说明**：`[ ]` 待开始 `[/]` 进行中 `[x]` 已完成
