# 幻灯片片夹管理

前后端分离的 MVP：片夹列表、片夹详情（单张描述列表）、基础 CRUD。内置 3 条种子数据。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Svelte 5、Flowbite-Svelte、@tanstack/svelte-query、axios |
| 后端 | Express、SQLite（`backend/data/slides.db`） |

- 前端端口：**8101**
- 后端端口：**8000**

## 快速启动

需要 Node.js **22.4+**（使用内置 `node:sqlite`，无需编译原生模块）。依赖均在项目目录内通过 `npm install` 安装，无需全局 pnpm/yarn。

### 1. 启动后端（一条命令）

```bash
cd backend && npm install && npm start
```

开发时可使用热重载：

```bash
cd backend && npm run dev
```

### 2. 启动前端

另开终端：

```bash
cd frontend && npm install && npm run dev
```

浏览器访问：<http://localhost:8101>

## 数据模型

**片夹**：编号、主题、张数（由单张数量自动统计）、年代、存储位置

**单张**：序号、描述

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/folders` | 片夹列表 |
| GET | `/api/folders/:id` | 片夹详情（含单张） |
| POST | `/api/folders` | 新建片夹 |
| PUT | `/api/folders/:id` | 更新片夹 |
| DELETE | `/api/folders/:id` | 删除片夹 |
| POST | `/api/folders/:id/slides` | 添加单张 |
| PUT | `/api/slides/:id` | 更新单张 |
| DELETE | `/api/slides/:id` | 删除单张 |

## 目录结构

```
├── backend/          # Express API + SQLite
│   ├── data/         # slides.db（首次启动自动创建）
│   └── src/
├── frontend/         # Svelte 5 前端
│   └── src/
└── README.md
```
