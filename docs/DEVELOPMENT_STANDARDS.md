# SubGate 开发规范

## 1. 核心原则：单一职责

每个文件、每个函数、每个类只做一件事。判断标准：
- 能用一句话描述其职责，且这句话中没有"和"字
- 修改一个功能时，不需要修改不相关的文件

## 2. 前端目录结构规范

```
apps/web/src/
├── api/          # HTTP 请求封装层
├── components/   # 通用 UI 组件（无业务逻辑）
├── features/     # 业务功能模块（自包含）
├── hooks/        # 全局共享 Hooks
├── router/       # 路由配置
├── stores/       # 全局状态
├── styles/       # 全局样式
├── types/        # 前端类型定义
└── utils/        # 工具函数
```

### api/ — 请求层
- 每个后端域一个文件（auth.api.ts, sources.api.ts, ...）
- 只做 HTTP 调用，不处理 UI 状态
- 返回类型使用 `@subgate/types` 中的接口

### components/ — 通用组件
```
components/
├── ui/           # Button, Card, Input, Modal 等原子组件
├── layout/       # Header, Sidebar, PageContainer
└── shared/       # 业务无关的复用组件
```
- UI 组件禁止包含 API 调用
- UI 组件禁止直接引用 `features/` 中的模块

### features/ — 业务模块
```
features/
├── auth/         # 登录/注册
│   ├── components/   # 模块专属组件
│   ├── hooks/        # 模块专属 Hooks
│   ├── pages/        # 页面组件
│   └── index.ts      # 对外暴露的入口
├── dashboard/
├── sources/
├── configs/
└── vault/
```
- 每个 feature 自包含：组件 + hooks + stores 不放外部
- feature 之间不直接互相引用，通过路由跳转

## 3. 后端目录结构规范

```
apps/server/src/
├── main.ts              # 入口
├── app.module.ts        # 根模块
├── common/              # 全局基础设施
├── modules/             # 业务模块
├── prisma/              # 数据库服务
└── config/              # 全局配置
```

### common/ — 全局基础设施
```
common/
├── guards/       # JWT Auth Guard
├── interceptors/ # 日志、响应格式化
├── filters/      # 全局异常过滤
├── pipes/        # 参数验证
└── decorators/   # @CurrentUser 等自定装饰器
```
- common 中的代码不得引用任何 modules/ 中的模块

### modules/ — 业务模块
每个模块遵循 NestJS 标准结构：
```
modules/xxx/
├── xxx.module.ts
├── xxx.controller.ts    # 仅处理路由和参数
├── xxx.service.ts       # 仅处理业务逻辑
└── dto/                 # 请求/响应 DTO
```
- Controller 不写业务逻辑，只调 Service
- Service 不操作 HTTP 上下文 (req/res)
- DTO 使用 class-validator 装饰器校验

### 依赖方向
```
Controller → Service → PrismaService / ExternalService
不允许: Service → Controller
不允许: modules/A/* → modules/B/*（除非 B 明确 export 了可复用 Service）
```

## 4. 共享类型包

`packages/types/` 存放前后端共用的 TypeScript 接口：
- DTO 接口
- Entity 接口
- API 响应格式接口

规则：
- 仅定义类型，不包含实现代码
- 后端可引用 `@subgate/types` 但 DTO 仍需 class-validator 校验

## 5. 命名规范

| 类型 | 规范 | 示例 |
|---|---|---|
| 文件名 | kebab-case | `auth.controller.ts`, `api-response.interface.ts` |
| 目录名 | 复数或 kebab-case | `modules/`, `feature-flags/` |
| 类/接口 | PascalCase | `AuthService`, `ICreateSourceDto` |
| 接口前缀 | I 前缀 | `IUser`, `IApiResponse` |
| 变量/函数 | camelCase | `getUserById`, `isTokenExpired` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TARGET` |
| 数据库表名 | 小写复数 | `users`, `sources`, `configs` |
| API 路径 | kebab-case | `/api/sub-sources`, `/api/health-check` |

## 6. Git 规范

### 分支策略
- `main` — 生产就绪，仅通过 PR 合并，禁止直接推送
- `ai/dev` — AI 开发分支，AI 生成的所有代码推送至此分支
- `feature/<name>` — 新功能
- `fix/<name>` — Bug 修复

### AI 分支规则
1. AI 助手 **禁止** 直接推送到 `main` 分支
2. AI 助手所有代码变更必须推送到 `ai/dev` 分支
3. AI 需要在 `ai/dev` 分支上工作，由人工审核后通过 PR 合并到 `main`
4. 多个 AI 功能开发时，可创建 `ai/<feature-name>` 子分支

### Commit 信息
```
<type>(<scope>): <subject>

type: feat | fix | refactor | style | docs | chore | perf
scope: web | server | types | config | docker
subject: 简短描述（中文英文均可，限72字符内）
```

示例：
```
feat(server): 实现 JWT 认证守卫
fix(web): 修复订阅源列表分页错误
```

## 7. API 设计规范

### 路径格式
```
/api/<resource>        — RESTful 资源
/api/<resource>/:id    — 指定资源
```

### 响应格式
所有 API 统一返回：
```json
{
  "code": 200,
  "message": "ok",
  "data": { ... }
}
```

- `code` 使用 HTTP 状态码（200, 201, 400, 401, 403, 404, 500）
- `message` 人类可读的描述
- `data` 响应数据，列表接口返回 `{ items: [], total: number }`

### 错误处理
- 业务异常通过 NestJS ExceptionFilter 统一处理
- 不要在各 Controller 中 try-catch

## 8. 数据库规范

- 所有表使用 `@map()` 映射为 snake_case 表名和字段名
- Prisma 字段名使用 camelCase，数据库列名使用 snake_case
- 外键关系使用 `onDelete: Cascade` 确保数据一致性
- 迁移文件纳入 `.gitignore`，由 Prisma Migrate 自动管理

## 9. 环境变量

```
# 数据库
DATABASE_URL=postgresql://subgate:password@localhost:5432/subgate

# JWT
JWT_SECRET=xxx
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# SubConverter
SUBCONVERTER_PATH=/usr/local/bin/subconverter
SUBCONVERTER_PORT=25500
```

- 所有环境变量通过 `config/` 目录下的配置文件统一访问
- 严禁在业务代码中直接 `process.env.FOO`

## 10. 代码审查清单

- [ ] 文件名和目录名符合命名规范
- [ ] 每个文件只负责一个职责
- [ ] Feature 模块自包含，不跨模块引用内部实现
- [ ] API 层没有 UI 代码，Component 没有 HTTP 调用
- [ ] Controller 没有业务逻辑，Service 不操作 req/res
- [ ] 类型定义优先使用 `@subgate/types` 共享包
- [ ] 环境变量不硬编码在业务代码中
