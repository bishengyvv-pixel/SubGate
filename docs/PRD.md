这是一份为您量身定制的**订阅托管平台（Sub-Hub）项目需求文档 (PRD)**。考虑到您擅长 Network System Management 和 DevOps，文档侧重于系统架构的严谨性与部署的灵活性。

---

## 1. 项目概述

* **项目名称**：Sub-Hub (暂定)
* **定位**：个人/小团体专用的集中式代理订阅管理与转换平台。
* **核心价值**：解决多机场订阅难管理、分流规则不统一、客户端配置繁琐的问题。

---

## 2. 技术栈架构

* **前端**：React (Vite) + TailwindCSS + Lucide React (图标库)。
* **后端**：Node.js (NestJS 或 Express) + Prisma (ORM)。
* **数据库**：PostgreSQL。
* **核心引擎**：集成 `subconverter` (二进制或 Docker 运行)。
* **部署**：Docker / K3s。

---

## 3. 功能模块详细说明

### 3.1 用户系统 (User System)

* **身份验证**：基于 JWT 的登录/注册系统。
* **安全策略**：密码加密存储（Argon2/bcrypt），支持修改密码与账号注销。

### 3.2 订阅源管理 (Subscription Sourcing)

* **多源输入**：用户可添加多个原始订阅链接（机场链接）。
* **节点聚合**：支持将 A、B、C 多个机场的节点合并为一个配置输出。
* **可用性检查**：后端定期对订阅链接进行健康检查，显示链接是否失效。

### 3.3 转换与托管引擎 (Conversion & Hosting)

* **固定托管链接**：为每个用户生成专属的 ID 链接（如 `/api/v1/sub/{user_uuid}`）。
* **格式自适应**：支持转换至 Clash (Premium/Meta), Surge, Quantumult X, Stash 等。
* **规则注入**：
* **预设模板**：提供“基础分流”、“全能拦截”、“AI 优先”等配置文件模板。
* **自定义规则**：用户可在 Web 界面直接编辑 `Rule-Providers`。


* **参数配置**：支持设置解析器选项（如：是否启用 UDP、跳过证书检查、节点重命名规则）。

### 3.4 订阅仓库 (Vault / Archive)

* **收藏夹功能**：存放暂时不使用的节点或过期的订阅链接。
* **备注系统**：为每个链接添加标签（如“游戏专用”、“备用”、“25年3月到期”）。

---

## 4. 数据库设计 (Entity Relationship)

基于 PostgreSQL 的核心表结构建议：

| 表名 | 字段 | 说明 |
| --- | --- | --- |
| **Users** | `id(UUID)`, `username`, `password_hash`, `created_at` | 用户基础信息 |
| **Sources** | `id`, `user_id`, `name`, `url`, `is_active`, `note` | 原始订阅源地址 |
| **Configs** | `id`, `user_id`, `template_name`, `custom_rules`, `target_type` | 用户自定义的转换偏好 |
| **Vault** | `id`, `user_id`, `content_url`, `tags`, `expiry_date` | 订阅链接存档库 |

---

## 5. 核心 API 接口设计

| 方法 | 路径 | 功能说明 |
| --- | --- | --- |
| **POST** | `/api/auth/register` | 用户注册 |
| **GET** | `/api/sources` | 获取当前用户所有订阅源 |
| **POST** | `/api/sources` | 添加新的订阅源 |
| **GET** | `/api/generate` | **核心接口**：生成转换后的配置内容 |
| **GET** | `/api/sub/:uuid` | **托管接口**：客户端通过此链接获取最终配置（无需鉴权，靠 UUID 保护） |

---

## 6. 前端 UI 需求 (像素/工业风格)

* **Dashboard**：以卡片形式展示当前激活的节点总数、订阅过期倒计时。
* **配置编辑器**：使用类似代码编辑器的 UI（可集成 Monaco Editor）编辑规则。
* **一键复制**：提供 Clash 订阅一键导入/复制功能。
* **状态指示灯**：绿色表示订阅源在线，红色表示 404/连接失败。

---

## 7. 非功能性需求

* **性能**：配置生成接口需增加 **Redis 缓存**，避免重复请求机场服务器导致被封 IP。
* **并发**：Node.js 后端需处理好高并发下的 `subconverter` 进程调用。
* **可观测性**：接入简单的日志记录，记录用户请求配置的时间和 IP（出于运维目的）。

---

## 8. 项目阶段规划 (MVP)

1. **第一阶段**：完成 PostgreSQL 建表与 Node.js 基础 API（包含用户系统）。
2. **第二阶段**：集成 `subconverter` 核心，实现“原始链接 -> 固定托管链接”的闭环。
3. **第三阶段**：React 前端开发，实现可视化管理订阅源。
4. **第四阶段**：Docker 镜像封装，部署至 PVE/K3s 测试环境。

---

**下一步建议：**
由于您有 **Node.js** 和 **React** 的基础，建议先从**后端 API 处理 subconverter 逻辑**开始写，这是项目的技术难点。我可以为您提供一个 Node.js 调用 subconverter 并输出配置的代码示例，需要吗？