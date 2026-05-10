# SubGate 后端目录结构

## 职责分层

```
src/
├── main.ts                # 应用入口
├── app.module.ts          # 根模块
│
├── common/                # 全局共享基础设施
│   ├── guards/            # 全局守卫 (JWT Auth)
│   ├── interceptors/      # 全局拦截器 (日志、转换)
│   ├── filters/           # 全局异常过滤器
│   ├── pipes/             # 全局管道 (验证)
│   └── decorators/        # 自定义装饰器
│
├── modules/               # 业务模块 — 按功能域划分
│   ├── auth/              # 认证模块
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/           # 请求/响应 DTO
│   │   └── strategies/    # Passport 策略
│   │
│   ├── sources/           # 订阅源管理模块
│   │   ├── sources.controller.ts
│   │   ├── sources.service.ts
│   │   ├── sources.module.ts
│   │   └── dto/
│   │
│   ├── configs/           # 配置模板模块
│   │   ├── configs.controller.ts
│   │   ├── configs.service.ts
│   │   ├── configs.module.ts
│   │   └── dto/
│   │
│   ├── vault/             # 订阅仓库模块
│   │   ├── vault.controller.ts
│   │   ├── vault.service.ts
│   │   ├── vault.module.ts
│   │   └── dto/
│   │
│   ├── converter/         # 转换引擎模块 (调用 subconverter)
│   │   ├── converter.controller.ts
│   │   ├── converter.service.ts
│   │   ├── converter.module.ts
│   │   └── dto/
│   │
│   └── health/            # 健康检查模块
│       ├── health.controller.ts
│       ├── health.service.ts
│       └── health.module.ts
│
├── prisma/                # Prisma 服务
│   └── prisma.service.ts
│
└── config/                # 全局配置
    ├── app.config.ts
    ├── redis.config.ts
    └── subconverter.config.ts
```

## 单一职责原则

1. **Controller** — 只处理路由和参数校验，通过 DTO 定义接口契约
2. **Service** — 只处理业务逻辑，不直接操作 HTTP 请求/响应
3. **Module** — 每个模块自包含，通过 exports 暴露可复用能力
4. **common/** — 存放跨模块共享的基础设施，不放业务逻辑
5. **config/** — 集中管理环境变量和外部服务配置
