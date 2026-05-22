# 学情智能分析与预警系统 — 架构文档

> 基于 `PRODUCT_SPEC.md` 输出。优先简单单体架构，不过度工程。

---

## 1. 技术栈选择

| 层级 | 技术 | 选择理由 |
|------|------|---------|
| 前端 | React 18 + Ant Design 5 | 组件丰富，适合管理后台；文档完善，开发效率高 |
| 后端 | Python 3.11 + FastAPI | 异步高性能；自动 Swagger 文档；Python 生态适合数据处理 |
| 数据库 | SQLite | 单机部署零配置；无需独立数据库服务；对于单机教育场景足够 |
| ORM | SQLAlchemy 2.0 | 与 FastAPI 配合成熟；支持异步；模型即 schema |
| 数据处理 | Pandas + openpyxl | Excel 解析标准工具；统计分析功能完备 |
| AI 调用 | DeepSeek API（云端） | 国产合规；成本低；API 兼容 OpenAI 格式 |
| 图表 | ECharts（React 封装） | 功能全面；中文文档好；支持热力图、雷达图等复杂图表 |
| 报告导出 | python-docx + ReportLab | Word/PDF 生成稳定可控 |
| 部署 | 单机脚本启动 | `python main.py` 启动本地服务，浏览器访问 `localhost:8000` |

---

## 2. 模块边界

```
┌─────────────────────────────────────────┐
│              前端 (React)                │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ 页面路由 │ │ AntD UI │ │ ECharts  │  │
│  └─────────┘ └─────────┘ └──────────┘  │
└─────────────────┬───────────────────────┘
                  │ HTTP / REST API
┌─────────────────▼───────────────────────┐
│           后端 (FastAPI)                 │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ 路由层   │ │ 业务逻辑 │ │ 数据访问 │  │
│  │ (API)   │ │ (Service)│ │ (CRUD)  │  │
│  └─────────┘ └─────────┘ └──────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Excel   │ │ 统计分析 │ │ AI 报告  │  │
│  │ 解析器   │ │ (Pandas)│ │ 生成器   │  │
│  └─────────┘ └─────────┘ └──────────┘  │
└─────────────────┬───────────────────────┘
                  │ SQLAlchemy
┌─────────────────▼───────────────────────┐
│           SQLite (本地文件)              │
│         `data/school_analytics.db`       │
└─────────────────────────────────────────┘
```

### 模块职责

| 模块 | 职责 | 禁止行为 |
|------|------|---------|
| **路由层** | 接收 HTTP 请求，参数校验，返回响应 | 不写业务逻辑，不直接操作数据库 |
| **业务逻辑层** | 成绩计算、风险判定、报告组装 | 不处理 HTTP，不直接执行 SQL |
| **数据访问层** | 数据库 CRUD，事务管理 | 不写业务规则 |
| **Excel 解析器** | 读取模板，数据清洗，导入数据库 | 不处理业务计算 |
| **统计分析引擎** | Pandas 计算均分/标准差/排名/趋势 | 不读写数据库，纯函数输入输出 |
| **AI 报告生成器** | 组装 prompt，调用 API，格式化输出 | 不处理数据获取，只接收结构化数据 |

---

## 3. 数据模型

### 3.1 实体关系图

```
[User] 1 ──────── * [Class]
                      │
                      │ 1
                      │
[Student] * ──────── 1 [Class]
    │
    │ *
    │
   1 [Score] * ────── 1 [Exam]
                      │
                      │ *
                      │
                     1 [Class]

[KnowledgePoint] * ── 1 [Class]

[Report] * ───────── 1 [Exam]
```

### 3.2 表结构

#### `users` — 教师账号

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| username | VARCHAR(32) UNIQUE | 教师工号，如 `T2024001` |
| name | VARCHAR(32) | 教师姓名 |
| hashed_password | VARCHAR(128) | bcrypt 哈希 |
| created_at | TIMESTAMP | |

> 注：系统内置一个默认账号，无需注册功能。

#### `classes` — 班级

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| name | VARCHAR(64) | 班级名称，如"一年级1班" |
| subject | VARCHAR(32) | 学科，如"数学" |
| grade | VARCHAR(16) | 年级，如"一年级" |
| school_name | VARCHAR(128) | 学校名称 |
| student_count | INTEGER | 学生人数（冗余，方便展示） |
| created_at | TIMESTAMP | |

#### `students` — 学生

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| class_id | INTEGER FK → classes | |
| student_no | VARCHAR(32) | 考号/学号 |
| name | VARCHAR(32) | 姓名 |
| created_at | TIMESTAMP | |

#### `exams` — 考试

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| class_id | INTEGER FK → classes | |
| name | VARCHAR(64) | 考试名称，如"期中考试" |
| exam_date | DATE | 考试日期 |
| full_score | INTEGER | 满分（如 200） |
| created_at | TIMESTAMP | |

#### `scores` — 成绩（核心表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| student_id | INTEGER FK → students | |
| exam_id | INTEGER FK → exams | |
| total_score | DECIMAL(5,1) | 总分 |
| class_rank | INTEGER | 班级排名 |
| school_rank | INTEGER | 校级排名 |
| subject_scores | JSON | 各科成绩 `{\"语文\": 95, \"数学\": 97}` |
| created_at | TIMESTAMP | |

> `subject_scores` 用 JSON 是为了灵活支持不同科目数量（一年级 2 科，高中 8+ 科）。

#### `knowledge_points` — 知识点配置

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| class_id | INTEGER FK → classes | |
| name | VARCHAR(64) | 知识点名称，如"导数应用" |
| parent_id | INTEGER FK → knowledge_points | 父知识点，支持层级 |
| weight | DECIMAL(3,2) | 权重（用于综合计算） |
| created_at | TIMESTAMP | |

#### `exam_knowledge_mapping` — 考试与知识点关联

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| exam_id | INTEGER FK → exams | |
| knowledge_point_id | INTEGER FK → knowledge_points | |
| max_score | DECIMAL(5,1) | 该知识点在本次考试的满分 |

#### `student_knowledge_scores` — 学生知识点得分

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| student_id | INTEGER FK → students | |
| exam_id | INTEGER FK → exams | |
| knowledge_point_id | INTEGER FK → knowledge_points | |
| score | DECIMAL(5,1) | 该知识点得分 |
| mastery_rate | DECIMAL(3,2) | 掌握率 = score / max_score |

#### `risk_alerts` — 风险预警

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| student_id | INTEGER FK → students | |
| exam_id | INTEGER FK → exams | |
| risk_type | VARCHAR(32) | `continuous_decline` / `sharp_drop` / `severe_imbalance` |
| risk_level | VARCHAR(16) | `high` / `medium` / `low` |
| reason | VARCHAR(256) | 风险原因描述 |
| advice | VARCHAR(512) | 建议措施 |
| is_resolved | BOOLEAN | 是否已处理 |
| created_at | TIMESTAMP | |

#### `reports` — AI 分析报告

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| class_id | INTEGER FK → classes | |
| exam_id | INTEGER FK → exams | |
| report_type | VARCHAR(32) | `class_overview` / `risk_alert` / `full` |
| content | TEXT | 报告正文（Markdown 格式） |
| generated_by | VARCHAR(32) | 生成方式：`ai` / `manual` |
| created_at | TIMESTAMP | |

---

## 4. API Contract

### 4.1 认证

```
POST /api/auth/login
Body: { "username": "T2024001", "password": "..." }
Response: { "access_token": "jwt_token", "token_type": "bearer" }
```

> 使用 JWT，单机部署 token 有效期设 7 天。

### 4.2 班级管理

```
GET    /api/classes              → 班级列表
POST   /api/classes              → 创建班级
GET    /api/classes/{id}         → 班级详情
PUT    /api/classes/{id}         → 更新班级
DELETE /api/classes/{id}         → 删除班级（级联删除学生/成绩）
```

### 4.3 数据导入

```
POST /api/import/excel
Content-Type: multipart/form-data
Body: file, class_id, exam_name, exam_date
Response: { "imported": 48, "skipped": 0, "errors": [] }
```

### 4.4 仪表盘

```
GET /api/dashboard/{class_id}?exam_id={exam_id}
Response: {
  "class_avg": 78.5,
  "std_dev": 12.4,
  "pass_rate": 0.854,
  "excellent_rate": 0.312,
  "score_distribution": [{"range": "60-70", "count": 8}, ...],
  "history_trend": [{"exam_name": "9月月考", "avg": 72.1}, ...]
}
```

### 4.5 知识点热力图

```
GET /api/heatmap/{class_id}?exam_id={exam_id}
Response: {
  "knowledge_points": ["函数", "几何", "代数", ...],
  "exams": ["9月", "10月", "11月", "期中"],
  "data": [[85, 78, 82, 88], [72, 68, 75, 80], ...]
}
```

### 4.6 学生画像

```
GET /api/students/{class_id}
Response: [{ "id": 1, "name": "张明远", "score": 92, "rank": 1 }, ...]

GET /api/students/{student_id}/profile
Response: {
  "student": { "name": "...", "class_rank_history": [...] },
  "radar": { "语文": 88, "数学": 95, ... },
  "weak_points": ["导数应用", "概率计算"],
  "trend": [{"exam": "9月", "score": 82}, ...]
}
```

### 4.7 风险预警

```
GET /api/risk/{class_id}?exam_id={exam_id}
Response: {
  "summary": { "high": 2, "medium": 2, "low": 0 },
  "alerts": [{ "student_name": "赵子墨", "type": "continuous_decline", "level": "high", ... }]
}

POST /api/risk/{alert_id}/resolve
Body: { "resolution_note": "..." }
```

### 4.8 AI 报告

```
POST /api/reports/generate
Body: { "class_id": 1, "exam_id": 3, "report_type": "full" }
Response: { "report_id": 5, "status": "generating" }

GET /api/reports/{report_id}
Response: { "id": 5, "content": "# 高二(3)班期中考试学情分析报告...", "created_at": "..." }

GET /api/reports/{report_id}/export?format=pdf
Response: file download
```

### 4.9 知识点配置

```
GET    /api/knowledge-points/{class_id}     → 知识点列表
POST   /api/knowledge-points                → 创建知识点
PUT    /api/knowledge-points/{id}           → 更新
DELETE /api/knowledge-points/{id}           → 删除
```

---

## 5. 权限模型

极简权限：系统仅支持一个内置教师账号，无多用户隔离需求。

```
所有 API（除登录外）需携带 JWT Token
Authorization: Bearer <token>
```

> 未来如需扩展多教师，在 `classes` 表加 `teacher_id` 字段即可。

---

## 6. 外部依赖

| 依赖 | 用途 | 是否必需 |
|------|------|---------|
| DeepSeek API Key | AI 报告生成 | 是 |
| SQLite | 本地数据存储 | 是（内置） |
| Python 3.11+ | 运行时 | 是 |
| Node.js 18+ | 前端构建 | 是（开发时） |

---

## 7. 未来最容易变的部分

| 部分 | 变化原因 | 应对策略 |
|------|---------|---------|
| Excel 模板格式 | 不同年级模板不同 | 解析器用配置驱动，支持字段映射 |
| AI 模型 | 可能切换供应商或本地部署 | AI 调用封装为独立模块，接口隔离 |
| 报告格式 | 评委可能有特定要求 | 报告生成器支持模板替换 |
| 知识点体系 | 教师反馈后调整 | 知识点完全可配置，不硬编码 |

---

## 8. 必须保持稳定的部分

| 部分 | 原因 |
|------|------|
| `scores` 表结构 | 核心数据，一旦定型，历史数据迁移成本高 |
| API 路径 | 前端已绑定，变更成本高 |
| 统计指标定义 | 均分/标准差/及格线等业务规则需一致 |
| 风险判定规则 | 高风险/中风险的阈值定义需文档化 |

---

## 9. 项目目录结构

```
school-analytics/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 配置（数据库路径、API Key）
│   │   ├── database.py          # SQLAlchemy 引擎/会话
│   │   ├── models.py            # 数据模型
│   │   ├── schemas.py           # Pydantic 请求/响应模型
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # 认证路由
│   │   │   ├── classes.py       # 班级管理
│   │   │   ├── import_data.py   # 数据导入
│   │   │   ├── dashboard.py     # 仪表盘
│   │   │   ├── heatmap.py       # 热力图
│   │   │   ├── students.py      # 学生画像
│   │   │   ├── risk.py          # 风险预警
│   │   │   ├── reports.py       # AI 报告
│   │   │   └── knowledge.py     # 知识点配置
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── excel_parser.py  # Excel 解析
│   │   │   ├── stats_engine.py  # 统计分析（纯函数）
│   │   │   ├── risk_detector.py # 风险判定
│   │   │   └── report_generator.py  # AI 报告生成
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── security.py      # JWT/密码哈希
│   ├── data/                    # SQLite 数据库目录
│   │   └── .gitkeep
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/                 # API 请求封装
│   │   ├── pages/               # 页面组件
│   │   │   ├── Login.tsx
│   │   │   ├── Classes.tsx
│   │   │   ├── Import.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Heatmap.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Risk.tsx
│   │   │   └── Report.tsx
│   │   ├── components/          # 公共组件
│   │   └── types/               # TypeScript 类型
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── scripts/
│   └── init_db.py               # 初始化数据库+默认账号
├── docs/
│   ├── PRODUCT_SPEC.md
│   └── ARCHITECTURE.md
├── CHANGELOG.md
├── TASKS.md
├── TESTING.md
├── DEPLOYMENT.md
└── README.md
```

---

## 10. 启动方式

开发模式（前后端分离）：
```bash
# 后端
cd backend
pip install -r requirements.txt
python scripts/init_db.py        # 初始化数据库
uvicorn app.main:app --reload    # http://localhost:8000

# 前端（另开终端）
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

单机部署模式（生产）：
```bash
# 构建前端
cd frontend && npm run build

# 启动（FastAPI 托管静态文件）
cd backend
python -m app.main               # http://localhost:8000
```

---

## 11. 关键设计决策（ADR）

### ADR-001：SQLite 而非 PostgreSQL/MySQL

- **背景**：单机部署，零配置是刚需。
- **决策**：使用 SQLite，数据库文件存放在 `backend/data/`。
- **后果**：并发写入能力有限，但单机场景下只有一位教师操作，完全够用。
- **回退**：未来如需多用户并发，更换为 PostgreSQL 只需改数据库连接字符串。

### ADR-002：subject_scores 用 JSON 而非独立表

- **背景**：不同年级科目数不同（一年级 2 科，高中 8+ 科）。
- **决策**：`scores` 表的 `subject_scores` 字段用 JSON 存储各科成绩。
- **后果**：牺牲部分关系型查询能力，换取灵活性。
- **缓解**：如需按科目查询，在应用层解析 JSON。

### ADR-003：云端 AI API 而非本地模型

- **背景**：本地部署大模型对硬件要求高，参赛环境不确定。
- **决策**：调用 DeepSeek/豆包等国产云 API。
- **后果**：需要网络连接，产生少量 API 费用。
- **缓解**：报告可缓存，同一考试不重复生成。
