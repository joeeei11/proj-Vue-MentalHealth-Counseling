![Language](https://img.shields.io/badge/language-Vue-42b883) ![License](https://img.shields.io/badge/license-MIT-green)

# proj-Vue-MentalHealth-Counseling

**面向高校的心理健康辅导平台，支持学生自测、咨询预约及管理员后台管理。**

## 功能特性

- 学生、辅导员、学校管理员三级权限体系
- 心理健康自测与 AI 辅助分析
- 咨询预约与在线会话记录
- Docker 容器化一键部署
- JWT 鉴权 + 角色守卫中间件

## 快速开始

### 环境要求

- Node.js >= 18
- Docker & Docker Compose
- MongoDB

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/joeeei11/proj-Vue-MentalHealth-Counseling.git
cd proj-Vue-MentalHealth-Counseling
```

2. 配置环境变量

```bash
cp backend/.env.example backend/.env
```

3. Docker 启动

```bash
docker compose up -d
```

### 基础用法

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```
