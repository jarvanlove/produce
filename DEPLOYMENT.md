# 学情智能分析与预警系统 — 部署文档

## 环境要求

- Python 3.11+
- Node.js 18+
- DeepSeek API Key（用于 AI 报告生成）

## 单机部署步骤

### 1. 获取代码

```bash
git clone <repo> school-analytics
cd school-analytics
```

### 2. 配置后端

```bash
cd backend

# 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DeepSeek API Key
```

### 3. 初始化数据库

```bash
python scripts/init_db.py
# 输出：数据库已初始化，默认账号 T2024001 / admin
```

### 4. 构建前端

```bash
cd ../frontend
npm install
npm run build
```

### 5. 启动服务

```bash
cd ../backend
python -m app.main
```

访问：`http://localhost:8000`

### 6. 登录

- 账号：`T2024001`
- 密码：`admin`

## 目录说明

```
school-analytics/
├── backend/
│   ├── data/               # SQLite 数据库文件（部署后数据在此）
│   ├── app/                # 后端代码
│   ├── scripts/
│   │   └── init_db.py      # 数据库初始化
│   ├── requirements.txt
│   └── .env                # 环境变量（API Key）
├── frontend/
│   └── dist/               # 构建产物（FastAPI 托管）
└── README.md
```

## 回滚

```bash
# 停止服务：Ctrl+C

# 重置数据库：
rm backend/data/school_analytics.db
python backend/scripts/init_db.py
```

## 常见问题

**Q: 提示"DeepSeek API Key 未配置"**
A: 检查 `backend/.env` 中 `DEEPSEEK_API_KEY` 是否已填写。

**Q: 前端页面 404**
A: 确保前端已构建（`npm run build`），且后端 `main.py` 中静态文件路径正确。

**Q: 数据库文件在哪里？**
A: `backend/data/school_analytics.db`，可直接用 SQLite 浏览器打开查看。
