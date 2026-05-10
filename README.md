# SubGate

个人中心化代理订阅管理与转换平台 — 聚合多个代理订阅源，通过 SubConverter 统一转换为目标客户端格式，提供托管链接。

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | NestJS 10 + TypeScript + Prisma ORM |
| 前端 | React 18 + Vite + Tailwind CSS |
| 数据库 | PostgreSQL 16 |
| 缓存 | Redis 7 |
| 转换引擎 | [subconverter](https://github.com/tindy2013/subconverter) |
| 容器化 | Docker + Docker Compose |
| 包管理 | pnpm workspace (monorepo) |

## 项目结构

```
SubGate/
├── apps/
│   ├── server/              # NestJS 后端
│   │   ├── src/
│   │   │   ├── common/      # 全局基础设施（guards/interceptors/filters/pipes/cache）
│   │   │   ├── modules/     # 业务模块
│   │   │   │   ├── auth/        # 认证
│   │   │   │   ├── sources/     # 订阅源管理 + 健康检查
│   │   │   │   ├── configs/     # 配置模板
│   │   │   │   ├── converter/   # SubConverter 集成
│   │   │   │   ├── vault/       # 订阅仓库
│   │   │   │   └── health/      # 服务健康检查
│   │   │   ├── prisma/      # Prisma 服务 + Schema
│   │   │   └── config/      # 全局配置
│   │   ├── prisma/          # 数据库 Schema + 迁移文件
│   │   └── test/            # E2E 测试
│   └── web/                 # React 前端
│       └── src/
├── packages/
│   ├── types/               # 前后端共享 TypeScript 类型
│   └── config/              # 共享 ESLint/Prettier 配置
├── docker/                  # Docker Compose 配置
└── docs/                    # 开发文档
```

## 快速开始

### Docker 一键启动

```bash
# 启动全部服务（PostgreSQL + Redis + SubConverter + Server + Web）
docker compose -f docker/docker-compose.yml up -d

# 查看日志
docker compose -f docker/docker-compose.yml logs -f server

# 停止
docker compose -f docker/docker-compose.yml down
```

启动后访问：
- 前端：`http://localhost`
- 后端 API：`http://localhost:3000/api`
- API 文档（Swagger）：`http://localhost:3000/api/docs`
- 健康检查：`http://localhost:3000/api/health`

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 启动基础设施（仅数据库 + Redis + SubConverter）
docker compose -f docker/docker-compose.yml up -d postgres redis subconverter

# 3. 配置环境变量
cp apps/server/.env.example apps/server/.env
# 编辑 .env，填写 DATABASE_URL、JWT_SECRET 等

# 4. 初始化数据库
pnpm --filter @subgate/server db:migrate

# 5. 启动后端（端口 3000）
pnpm dev:server

# 6. 启动前端（端口 5173）
pnpm dev:web
```

## API 概览

所有接口统一返回格式：
```json
{ "code": 200, "message": "ok", "data": {} }
```

### 健康检查

| 方法 | 路径 | 鉴权 |
|---|---|---|
| GET | `/api/health` | 无 |

### 认证

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/auth/register` | 无 | 注册 |
| POST | `/api/auth/login` | 无 | 登录 |
| GET | `/api/auth/profile` | JWT | 个人信息 |
| PUT | `/api/auth/password` | JWT | 修改密码 |
| DELETE | `/api/auth/account` | JWT | 注销账号 |

### 订阅源管理

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/sources?page=1&limit=20` | JWT | 分页列表 |
| POST | `/api/sources` | JWT | 添加订阅源 |
| GET | `/api/sources/:id` | JWT | 详情 |
| PUT | `/api/sources/:id` | JWT | 更新 |
| DELETE | `/api/sources/:id` | JWT | 删除 |

### 配置模板

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/configs` | JWT | 模板列表 |
| POST | `/api/configs` | JWT | 创建模板 |
| GET | `/api/configs/:id` | JWT | 详情 |
| PUT | `/api/configs/:id` | JWT | 更新 |
| DELETE | `/api/configs/:id` | JWT | 删除 |

### 生成 & 托管

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/generate?sources=id&target=clash` | JWT | 生成订阅配置 |
| GET | `/api/sub/:uuid` | 无 | 托管链接（原始文本） |

### 订阅仓库

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/vault` | JWT | 收藏列表 |
| POST | `/api/vault` | JWT | 添加收藏 |
| GET | `/api/vault/:id` | JWT | 详情 |
| PUT | `/api/vault/:id` | JWT | 更新备注/标签 |
| DELETE | `/api/vault/:id` | JWT | 移除 |

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://subgate:subgate_dev@localhost:5432/subgate` |
| `JWT_SECRET` | JWT 签名密钥 | - |
| `JWT_EXPIRES_IN` | JWT 有效期 | `7d` |
| `REDIS_URL` | Redis 连接串 | `redis://localhost:6379` |
| `SUBCONVERTER_URL` | SubConverter 地址 | `http://localhost:25500` |
| `PORT` | 后端端口 | `3000` |
| `CORS_ORIGIN` | CORS 允许来源 | `*` |

## 运行测试

```bash
# 全部 E2E 测试（32 个用例）
pnpm --filter @subgate/server test:e2e
```

## Git 规范

- `main` — 生产分支，仅通过 PR 合并
- `ai/dev` — AI 开发分支
- Commit: `<type>(<scope>): <subject>` — 见 [开发规范](docs/DEVELOPMENT_STANDARDS.md)

## License

MIT
