# 大学生心理健康咨询平台 — Docker 运行指南

> **本指南面向：** 第一次接触这个项目、想在自己电脑上运行起来看效果的人。
> **你不需要：** 懂编程、懂数据库、懂 Node.js，只需要按步骤操作即可。
> **预计耗时：** 首次约 15~30 分钟（主要是下载时间），之后每次启动不超过 2 分钟。

---

## 目录

1. [确认你的电脑是否满足要求](#第一步确认电脑满足要求)
2. [安装 Docker Desktop](#第二步安装-docker-desktop)
3. [获取项目代码](#第三步获取项目代码)
4. [创建配置文件](#第四步创建配置文件)
5. [启动项目](#第五步启动项目)
6. [打开网页使用](#第六步打开网页使用)
7. [关闭项目](#第七步关闭项目)
8. [下次再启动](#第八步下次再启动)
9. [遇到问题怎么办](#遇到问题怎么办)

---

## 第一步：确认电脑满足要求

### 操作系统要求

| 系统 | 最低要求 |
|------|----------|
| Windows | Windows 10（64位，版本 2004 或更高）或 Windows 11 |
| macOS | macOS 11（Big Sur）或更高 |

### 硬件要求

- 内存（RAM）：**8GB 或以上**（4GB 勉强可用但较慢）
- 磁盘空间：**至少 10GB 可用空间**（用于存放 Docker 镜像）
- 网络：需要能访问国际网络（下载 Docker 镜像时需要）

### 如何查看 Windows 版本

按 `Win + R`，输入 `winver`，回车，查看弹出窗口中的版本信息。

### 如何查看内存大小

按 `Win + R`，输入 `dxdiag`，回车，在「系统」标签页查看「内存」。

---

## 第二步：安装 Docker Desktop

Docker Desktop 是让你的电脑能够运行「容器」的工具，可以理解为一个虚拟的小型服务器环境。

### Windows 安装步骤

**1. 下载 Docker Desktop**

打开浏览器，访问：https://www.docker.com/products/docker-desktop

点击「Download for Windows」按钮，下载安装包（文件约 500MB）。

**2. 运行安装程序**

- 双击下载的 `.exe` 文件
- 安装过程中会询问是否启用 WSL 2，**勾选「Use WSL 2 instead of Hyper-V」**（推荐）
- 点击 OK，等待安装完成
- 安装完成后点击「Close and restart」，**电脑会重启**

**3. 启动 Docker Desktop**

- 重启后，Docker Desktop 会自动启动（需要等待约 1~2 分钟初始化）
- 任务栏右下角出现**鲸鱼图标** 🐳 表示 Docker 已在运行
- 首次启动会弹出引导界面，可以直接关闭，不需要登录账号

**4. 验证安装成功**

按 `Win + R`，输入 `cmd`，回车，打开命令提示符，输入：

```
docker --version
```

看到类似 `Docker version 27.x.x` 的输出即表示安装成功。

---

### macOS 安装步骤

**1. 下载 Docker Desktop**

访问 https://www.docker.com/products/docker-desktop，根据你的芯片选择：
- 搭载 Intel 芯片 → 选「Download for Mac - Intel Chip」
- 搭载 M1/M2/M3/M4 芯片（Apple Silicon）→ 选「Download for Mac - Apple Silicon」

> **如何判断芯片类型**：点击左上角苹果图标 → 关于本机，查看「芯片」一行。

**2. 安装**

- 双击下载的 `.dmg` 文件
- 将 Docker 图标拖到「Applications」文件夹
- 从启动台打开 Docker，系统会询问是否信任该应用，点击「Open」
- 输入 Mac 开机密码完成安装

**3. 验证安装成功**

打开「终端」（在启动台搜索「Terminal」），输入：

```
docker --version
```

看到版本号即表示成功。

---

## 第三步：获取项目代码

### 方式 A：从 GitHub 下载（推荐）

> 如果对方已经把代码推送到 GitHub

打开终端（Windows 用「命令提示符」或「PowerShell」，Mac 用「终端」），执行：

```bash
git clone https://github.com/joeeei11/HealthyPlantflom.git
cd HealthyPlantflom
```

> **如果提示 git 不是可识别的命令**，需要先安装 Git：
> - Windows：https://git-scm.com/download/win，下载并安装，安装时一路默认即可
> - macOS：在终端输入 `git --version`，系统会自动提示安装

### 方式 B：直接复制文件夹

如果是通过 U 盘或网盘拷贝的，将整个 `HealthyPlantflom` 文件夹放到你电脑的任意位置（例如桌面或 D 盘），记住这个路径。

然后打开终端，进入该文件夹：

```bash
# Windows 示例（假设放在 D 盘）
cd D:\HealthyPlantflom

# macOS 示例（假设放在桌面）
cd ~/Desktop/HealthyPlantflom
```

### 确认文件结构正确

进入文件夹后，执行 `ls`（macOS）或 `dir`（Windows），应该能看到：

```
docker-compose.yml    ← 这个文件必须存在！
.env.example
backend/
frontend/
database/
docs/
```

如果看不到 `docker-compose.yml`，说明你进入的目录不对，需要往上或往下找一层。

---

## 第四步：创建配置文件

项目需要一个 `.env` 配置文件来存放密钥信息。

### 4.1 复制模板文件

在终端中执行（确保你当前在 `HealthyPlantflom` 文件夹内）：

**Windows（命令提示符）：**
```cmd
copy .env.example .env
```

**Windows（PowerShell）：**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux：**
```bash
cp .env.example .env
```

### 4.2 编辑配置文件

用记事本（Windows）或文本编辑器打开刚创建的 `.env` 文件：

**Windows：**
```cmd
notepad .env
```

**macOS：**
```bash
open -e .env
```

文件内容如下，按说明修改：

```env
# MySQL 密码（可以不改，保持默认即可）
DB_PASSWORD=MySql@2026

# JWT 密钥（可以不改，保持默认即可）
JWT_SECRET=0722feee6f4a0bccefa592ad79728319957c627879695fc5486b20cfcea0259d

# DeepSeek API Key ← 这一行必须填写真实的密钥！
DEEPSEEK_API_KEY=sk-你的密钥填在这里
```

### 4.3 获取 DeepSeek API Key（必填）

> AI 心理助手功能需要这个密钥，如果不填，AI 对话功能将无法使用（其他功能不受影响）。

1. 打开浏览器，访问：https://platform.deepseek.com
2. 注册账号并登录
3. 点击左侧「API Keys」
4. 点击「创建 API Key」，复制生成的密钥（格式：`sk-xxxxxxxxxxxxxxxx`）
5. 将复制的密钥替换 `.env` 文件中的 `sk-你的密钥填在这里`

修改后保存文件（`Ctrl+S`）。

> **注意**：`.env` 文件名前面有一个点，在 Windows 资源管理器中默认是隐藏的。如果找不到，可以在终端里直接用记事本打开：`notepad .env`

---

## 第五步：启动项目

### 确认 Docker Desktop 正在运行

查看任务栏右下角是否有鲸鱼图标，且图标没有显示「正在启动」的转圈动画。如果没有运行，从桌面或开始菜单打开 Docker Desktop，等待启动完成。

### 执行启动命令

在终端中（确保你在 `HealthyPlantflom` 文件夹内），执行：

```bash
docker-compose up --build
```

### 首次启动会经历以下阶段（请耐心等待）

**阶段 1：下载基础镜像（约 5~15 分钟，取决于网速）**

你会看到类似这样的输出：

```
Pulling mysql  ... done
Pulling node   ... done
Pulling nginx  ... done
```

**阶段 2：构建后端镜像（约 1~3 分钟）**

```
backend_1   | => installing dependencies...
backend_1   | added 148 packages in 23s
```

**阶段 3：构建前端镜像（约 2~5 分钟）**

```
frontend_1  | vite v5.x.x building for production...
frontend_1  | ✓ 85 modules transformed.
frontend_1  | dist/index.html    0.46 kB
```

**阶段 4：启动所有服务**

当看到以下关键输出，说明项目已完全启动成功：

```
mental_health_mysql    | [Server] ready for connections.  ← 数据库就绪
mental_health_backend  | [database] connected successfully ← 后端连接数据库成功
mental_health_backend  | [server] running on http://localhost:3000 ← 后端启动成功
mental_health_frontend | Configuration complete; ready for start up ← 前端就绪
```

> **重要**：终端窗口会持续显示日志，这是正常现象，**不要关闭这个终端窗口**，关闭了服务就停止了。

---

## 第六步：打开网页使用

启动成功后，打开浏览器（Chrome、Edge、Safari 均可），访问：

```
http://localhost:5173
```

你应该看到登录页面。

### 默认测试账号

数据库初始化时已预置了测试账号，可以直接登录：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 学生 | `student01` | `password123` |
| 咨询师 | `counselor01` | `password123` |
| 学校管理员 | `school01` | `password123` |

> 如果以上账号无法登录，可以在登录页点击「注册」创建新账号。

### 各端功能简介

| 角色 | 主要功能 |
|------|----------|
| **学生端** | 预约咨询、AI 心理助手对话、查看公告、个人档案 |
| **咨询师端** | 管理预约、查看会话记录、个人资料设置 |
| **学校管理端** | 数据统计、咨询师管理、发布公告 |

---

## 第七步：关闭项目

### 正常关闭（保留数据，下次可继续使用）

在**运行着 docker-compose 的那个终端窗口**中，按：

```
Ctrl + C
```

等待几秒，看到以下输出表示已正常停止：

```
Stopping mental_health_frontend ... done
Stopping mental_health_backend  ... done
Stopping mental_health_mysql    ... done
```

### 彻底清除（删除所有数据，恢复到初始状态）

> ⚠️ 此操作会删除数据库中的所有数据，慎用！

```bash
docker-compose down -v
```

---

## 第八步：下次再启动

下次使用时，无需重新安装或配置，直接执行：

```bash
# 1. 进入项目文件夹
cd HealthyPlantflom   # 或者你实际的路径

# 2. 启动（不需要 --build，速度更快）
docker-compose up
```

通常 30~60 秒内即可启动完成。

---

## 遇到问题怎么办

### 问题 1：命令执行后一直没反应，或报错 `Cannot connect to the Docker daemon`

**原因**：Docker Desktop 没有运行。

**解决**：
1. 检查任务栏右下角是否有鲸鱼图标
2. 如果没有，从开始菜单打开「Docker Desktop」
3. 等待启动完成（图标不再转圈）后重试命令

---

### 问题 2：出现 `port is already allocated` 或 `address already in use`

**原因**：5173 或 3306 端口被其他程序占用。

**解决（Windows）**：
1. 打开命令提示符（管理员权限）
2. 执行以下命令找出占用端口的程序：
   ```cmd
   netstat -ano | findstr :5173
   netstat -ano | findstr :3306
   ```
3. 记下最后一列的 PID 数字，在任务管理器中找到对应进程并结束
4. 重新执行 `docker-compose up --build`

---

### 问题 3：镜像下载速度极慢或下载失败

**原因**：访问 Docker Hub（国外服务器）网速慢。

**解决**：配置国内镜像加速器：

1. 打开 Docker Desktop
2. 点击右上角齿轮图标（Settings）
3. 点击左侧「Docker Engine」
4. 在右侧 JSON 中添加镜像地址（在 `{}` 内添加）：

```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://hub.rat.dev"
  ]
}
```

5. 点击「Apply & Restart」，等待 Docker 重启后重试

---

### 问题 4：启动后访问 `http://localhost:5173` 显示「无法访问此网站」

**原因**：前端容器还没完全启动好。

**解决**：
1. 查看终端中是否还在构建或初始化（有新日志输出）
2. 等待出现 `Configuration complete` 字样后再访问
3. 如果等了很长时间还没有，检查终端中是否有红色的错误信息，截图联系项目负责人

---

### 问题 5：登录失败，提示「用户名或密码错误」

**解决**：
1. 确认使用的是测试账号（见第六步的表格）
2. 注意区分大小写
3. 也可以尝试点击「注册」创建全新账号

---

### 问题 6：AI 对话没有回应

**原因**：DeepSeek API Key 未配置或失效。

**解决**：
1. 打开项目根目录的 `.env` 文件，确认 `DEEPSEEK_API_KEY` 已填写正确密钥
2. 访问 https://platform.deepseek.com 确认账户有余额
3. 修改 `.env` 后需要重启项目：先 `Ctrl+C` 停止，再 `docker-compose up` 重新启动

---

### 问题 7：Windows 提示「WSL 2 installation is incomplete」

**原因**：WSL 2（Windows Subsystem for Linux）未正确安装。

**解决**：
1. 以管理员身份打开 PowerShell（右键开始菜单 → Windows PowerShell（管理员））
2. 执行：
   ```powershell
   wsl --install
   ```
3. 等待安装完成后重启电脑
4. 重新打开 Docker Desktop

---

### 问题 8：出现 `no space left on device`

**原因**：磁盘空间不足。

**解决**：清理 Docker 占用的空间：
```bash
docker system prune -a
```
> ⚠️ 这会删除所有未使用的镜像，需要重新 `docker-compose up --build`

---

## 快速参考卡

| 操作 | 命令 |
|------|------|
| 首次启动 | `docker-compose up --build` |
| 日常启动 | `docker-compose up` |
| 后台启动（不占终端） | `docker-compose up -d` |
| 查看运行状态 | `docker-compose ps` |
| 查看日志 | `docker-compose logs -f` |
| 正常停止 | `Ctrl+C` 或 `docker-compose stop` |
| 彻底删除（含数据） | `docker-compose down -v` |
| 访问网页 | http://localhost:5173 |

---

*文档版本：1.0 | 更新日期：2026-03-29*
