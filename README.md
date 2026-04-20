# 校园记账小程序

面向大学生的微信小程序记账应用，支持个人记账、AA 分账、校园消费画像三大核心功能。

## 项目结构

```
ac app/
├── backend/          # Node.js + Express 后端
├── miniprogram/      # 微信小程序前端
├── database/         # 数据库 Schema
├── docs/             # 项目文档
└── README.md
```

## 环境依赖

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 16 | 后端运行环境 |
| Docker | 任意版本 | 运行 MySQL 数据库 |
| 微信开发者工具 | 最新稳定版 | 运行小程序前端 |

---

## 首次启动（仅需执行一次）

### 第一步：启动 MySQL 数据库

```bash
docker run -d \
  --name ac-mysql \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=college_accounting \
  -p 3306:3306 \
  mysql:8.0
```

等待约 15 秒让 MySQL 初始化完成，然后导入数据库结构：

```bash
docker exec -i ac-mysql sh -c 'mysql -uroot -proot123' < "database/schema.sql"
```

### 第二步：安装后端依赖

```bash
cd backend
npm install
```

### 第三步：配置环境变量

`backend/.env` 文件已预置好，内容如下（无需修改）：

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root123
DB_NAME=college_accounting
JWT_SECRET=college_accounting_jwt_secret_2024
PORT=3000
```

---

## 日常启动

每次开发或演示前执行：

```bash
# 1. 启动 MySQL（若 Docker 容器已存在）
docker start ac-mysql

# 2. 启动后端服务
cd backend
node app.js
```

看到以下输出说明启动成功：

```
Server running on port 3000
Database connected successfully
```

### 打开小程序

1. 打开**微信开发者工具**
2. 导入项目，目录选择 `miniprogram/`
3. AppID 选「测试号」
4. 进入「详情」→「本地设置」→ 勾选「**不校验合法域名**」

---

## 真机预览（手机扫码测试）

> 手机和电脑需连接同一 WiFi

**第一步：查看本机 IP**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**第二步：修改小程序接口地址**

编辑 `miniprogram/app.js`，将 `baseUrl` 改为你的本机 IP：

```js
baseUrl: 'http://192.168.x.x:3000/api'  // 替换为实际 IP
```

**第三步：生成二维码**

微信开发者工具顶部点击「**预览**」，手机微信扫码即可。

---

## 功能模块

### 个人记账
- 记录收入 / 支出，支持分类（餐饮、交通、娱乐、学习等）
- 按月查看账单列表和统计图表

### AA 分账
- 创建分账群组（宿舍、旅行等场景）
- 记录共同支出，自动计算最优还款路径
- 一键标记债务结清

### 校园消费画像
- 匿名聚合同校用户数据
- 个人消费 vs 同校均值对比
- 消费健康评分（0-100 分）

---

## 常见问题

**Q：启动后端报数据库连接失败？**
```bash
docker start ac-mysql   # 确保 MySQL 容器在运行
```

**Q：小程序请求报 502？**
后端服务未启动，进入 `backend/` 目录执行 `node app.js`。

**Q：换网络后真机无法访问？**
重新查询本机 IP 并更新 `miniprogram/app.js` 中的 `baseUrl`。

**Q：重装电脑后如何恢复？**
MySQL 数据存在 Docker volume 中，重装系统后需重新执行「首次启动」步骤并重新导入 Schema。

---

## 文档

| 文档 | 路径 |
|------|------|
| 需求分析 | `docs/需求分析文档.md` |
| 系统设计 | `docs/系统设计文档.md` |
| API 接口 | `docs/API接口文档.md` |
| 测试报告 | `docs/测试报告.md` |
| 用户手册 | `docs/用户手册.md` |
