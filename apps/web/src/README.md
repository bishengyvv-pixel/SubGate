# SubGate 前端目录结构

## 职责分层

```
src/
├── api/          # API 接口层 — 封装所有后端 HTTP 请求
│   ├── client.ts         # axios/fetch 实例，统一拦截器
│   ├── auth.api.ts       # 认证相关 API
│   ├── sources.api.ts    # 订阅源 API
│   ├── configs.api.ts    # 配置 API
│   └── vault.api.ts      # 存档 API
│
├── components/    # 通用 UI 组件
│   ├── ui/               # 基础 UI 组件 (Button, Card, Input 等)
│   ├── layout/           # 布局组件 (Header, Sidebar, PageContainer)
│   └── shared/           # 业务无关的复用组件
│
├── features/      # 业务功能模块 — 按功能域划分
│   ├── auth/             # 认证模块 (登录/注册页面 + 组件)
│   ├── dashboard/        # 仪表盘模块
│   ├── sources/          # 订阅源管理模块
│   ├── configs/          # 配置编辑器模块
│   └── vault/            # 订阅仓库模块
│
├── hooks/         # 全局共享 Hooks
├── router/        # 路由配置
├── stores/        # 全局状态管理
├── styles/        # 全局样式
├── types/         # 前端类型定义
├── utils/         # 工具函数
├── App.tsx
└── main.tsx
```

## 单一职责原则

1. **api/** — 只负责网络请求，不包含 UI 逻辑
2. **components/** — 只包含可复用组件，不包含业务逻辑
3. **features/** — 每个功能模块自包含：页面组件 + 模块级 hooks + 模块级组件
4. **hooks/** — 全局共享的 React Hooks，模块专属 hooks 放 features/[module]/hooks/
5. **stores/** — 全局状态，模块级状态放 features/[module]/stores/
