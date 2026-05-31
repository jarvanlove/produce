# 学情智能分析与预警系统 — 详细使用手册

> 本文档全面总结项目的所有功能、试用方法、数据流转与系统架构。
> 生成日期：2026-05-31

---

## 目录

1. [项目概述](#1-项目概述)
2. [系统功能总览](#2-系统功能总览)
3. [技术架构](#3-技术架构)
4. [数据模型与流转](#4-数据模型与流转)
5. [页面功能详解](#5-页面功能详解)
6. [标准使用流程](#6-标准使用流程)
7. [API 接口清单](#7-api-接口清单)
8. [启动与部署](#8-启动与部署)
9. [项目文件结构](#9-项目文件结构)
10. [内置演示数据](#10-内置演示数据)

---

## 1. 项目概述

**学情智能分析与预警系统**是一款面向中小学教师（班主任、学科教师、教研员）的 Web 应用，用于考试成绩的智能化分析、学生风险预警与 AI 报告生成。

### 1.1 核心痛点

| 痛点 | 系统解决方案 |
|------|-------------|
| 成绩 Excel 数据看不懂 | 自动解析 Excel，生成可视化仪表盘 |
| 问题发现滞后 | 自动标记连续下滑、大幅退步、偏科严重学生 |
| 个性化指导缺依据 | 学生画像展示成绩趋势、学科雷达、薄弱点 |
| 汇报耗时 | 一键生成 AI 分析报告，支持 Word/PDF 导出 |

### 1.2 目标用户

- 基础教育、职业教育、高等教育教师
- 使用场景：期中/期末/月考后快速分析班级学业状况
- 技术要求：无需编程基础，会操作 Excel 和浏览器即可

### 1.3 明确不做（边界）

- 家长端通知、学生个人 APP
- 多学校数据对比
- 实时课堂数据采集
- 在线考试/自动出题
- 数据对接教务系统

---

## 2. 系统功能总览

| 功能模块 | 说明 | 对应页面 |
|---------|------|---------|
| **班级管理** | 创建/编辑/删除班级，管理班级基本信息 | 班级管理 |
| **成绩导入** | 上传 Excel 成绩表，自动解析学生、科目、分数 | 数据导入 |
| **学情仪表盘** | 班级均分、标准差、及格率、优秀率、分数段分布柱状图、成绩明细表 | 学情仪表盘 |
| **学生画像** | 学生列表 + 个人成绩趋势折线图 + 学科雷达图 + 薄弱点标签 | 学生画像 |
| **知识点热力图** | 将成绩映射到知识点维度，可视化全班薄弱点 | 知识点热力图 |
| **风险预警** | 自动识别连续下滑、大幅退步、偏科严重学生 | 风险预警 |
| **AI 分析报告** | 一键生成自然语言分析报告，支持 Word/PDF 导出 | AI 分析报告 |
| **知识点管理** | 配置班级知识点体系，支持层级关系 | 知识点管理 |
| **系统设置** | 配置 AI 模型服务商、API Key、Base URL | 系统设置 |

---

## 3. 技术架构

### 3.1 技术栈

| 层级 | 技术 | 选择理由 |
|------|------|---------|
| 前端 | React 18 + Ant Design 5 + TypeScript + Vite | 组件丰富，适合管理后台 |
| 后端 | Python 3.11 + FastAPI + SQLAlchemy 2.0 | 异步高性能，自动 Swagger |
| 数据库 | SQLite | 单机零配置，本地文件存储 |
| 数据处理 | Pandas + openpyxl | Excel 解析标准工具 |
| AI 调用 | DeepSeek API（云端） | 国产合规，兼容 OpenAI 格式 |
| 图表 | ECharts（React 封装） | 支持热力图、雷达图等 |
| 报告导出 | python-docx + ReportLab | Word/PDF 生成，支持中文 |

### 3.2 架构图

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
│         data/school_analytics.db        │
└─────────────────────────────────────────┘
```

### 3.3 模块职责

| 模块 | 职责 | 禁止行为 |
|------|------|---------|
| 路由层 | 接收 HTTP 请求，参数校验，返回响应 | 不写业务逻辑，不直接操作数据库 |
| 业务逻辑层 | 成绩计算、风险判定、报告组装 | 不处理 HTTP，不直接执行 SQL |
| 数据访问层 | 数据库 CRUD，事务管理 | 不写业务规则 |
| Excel 解析器 | 读取模板，数据清洗，导入数据库 | 不处理业务计算 |
| 统计分析引擎 | Pandas 计算均分/标准差/排名/趋势 | 不读写数据库，纯函数输入输出 |
| AI 报告生成器 | 组装 prompt，调用 API，格式化输出 | 不处理数据获取 |

---

## 4. 数据模型与流转

### 4.1 实体关系图

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

### 4.2 核心表结构

#### `users` — 教师账号

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| username | VARCHAR(32) | 账号，如 `admin` |
| name | VARCHAR(32) | 教师姓名 |
| hashed_password | VARCHAR(128) | bcrypt 哈希 |
| created_at | TIMESTAMP | 创建时间 |

**默认账号**：`admin` / `123456`

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
| class_id | INTEGER FK | 所属班级 |
| student_no | VARCHAR(32) | 考号/学号 |
| name | VARCHAR(32) | 姓名 |
| created_at | TIMESTAMP | |

**约束**：同一班级内 `student_no` 唯一

#### `exams` — 考试

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| class_id | INTEGER FK | 所属班级 |
| name | VARCHAR(64) | 考试名称，如"期中考试" |
| exam_date | DATE | 考试日期 |
| full_score | INTEGER | 满分（如 200），自动从数据推算 |
| created_at | TIMESTAMP | |

#### `scores` — 成绩（核心表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| student_id | INTEGER FK | 学生 |
| exam_id | INTEGER FK | 考试 |
| total_score | FLOAT | 总分 |
| class_rank | INTEGER | 班级排名 |
| school_rank | INTEGER | 校级排名 |
| subject_scores | JSON | 各科成绩 `{"语文": 95, "数学": 97}` |
| created_at | TIMESTAMP | |

**设计说明**：`subject_scores` 用 JSON 存储，灵活支持不同科目数量（一年级 2 科，高中 8+ 科）。

#### `knowledge_points` — 知识点

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| class_id | INTEGER FK | 所属班级 |
| name | VARCHAR(64) | 知识点名称 |
| parent_id | INTEGER FK | 父知识点，支持层级 |
| weight | FLOAT | 权重 |
| created_at | TIMESTAMP | |

#### `exam_knowledge_mapping` — 考试与知识点关联

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| exam_id | INTEGER FK | 考试 |
| knowledge_point_id | INTEGER FK | 知识点 |
| max_score | FLOAT | 该知识点在本次考试的满分 |

#### `risk_alerts` — 风险预警

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| student_id | INTEGER FK | 学生 |
| exam_id | INTEGER FK | 考试 |
| risk_type | VARCHAR(32) | `continuous_decline`/`sharp_drop`/`severe_imbalance` |
| risk_level | VARCHAR(16) | `high`/`medium`/`low` |
| reason | VARCHAR(256) | 风险原因 |
| advice | VARCHAR(512) | 建议措施 |
| is_resolved | BOOLEAN | 是否已处理 |
| created_at | TIMESTAMP | |

#### `reports` — AI 分析报告

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| class_id | INTEGER FK | 班级 |
| exam_id | INTEGER FK | 考试 |
| report_type | VARCHAR(32) | `class_overview`/`risk_alert`/`full` |
| content | TEXT | 报告正文（Markdown） |
| generated_by | VARCHAR(32) | `ai` / `manual` |
| created_at | TIMESTAMP | |

### 4.3 数据流转图

```
【教师操作】
    │
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  上传 Excel  │───▶│  Excel 解析  │───▶│  创建 Exam  │
│  (ImportPage)│    │ (excel_parser)│    │  创建 Student│
└─────────────┘    └─────────────┘    │  创建 Score  │
                                      └─────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    ▼                        ▼                        ▼
            ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
            │ 学情仪表盘   │          │  风险预警    │          │  学生画像    │
            │(DashboardPage)│        │(RiskAlertPage)│        │(StudentProfile)│
            │ 均分/分布/排名│         │ 连续下滑/退步/偏科│      │ 趋势/雷达/薄弱点│
            └─────────────┘          └─────────────┘          └─────────────┘
                    │                        │                        │
                    └────────────────────────┼────────────────────────┘
                                             ▼
                                      ┌─────────────┐
                                      │ AI 分析报告  │
                                      │(ReportPage) │
                                      │ Markdown渲染 │
                                      │ Word/PDF导出 │
                                      └─────────────┘
```

---

## 5. 页面功能详解

### 5.1 登录页 (`/login`)

- **功能**：教师身份验证
- **交互**：输入账号密码 → JWT Token 存储到 `localStorage` → 跳转班级列表
- **默认账号**：`admin` / `123456`
- **UI**：渐变背景 + 居中登录卡片，预填默认账号

### 5.2 班级管理 (`/classes`)

- **功能**：班级的增删改查
- **展示**：
  - 顶部统计卡片：班级总数、学生总数、覆盖学校数
  - 班级卡片网格：每班显示学科、年级、学校、学生数
  - 空状态引导：无班级时显示 3 步引导（创建班级 → 导入成绩 → 查看分析）
- **操作**：
  - "进入班级"：设置 `currentClassId`/`currentClassName` 到 localStorage，跳转仪表盘
  - "编辑"：修改班级名称、学科、年级、学校
  - "删除"：Popconfirm 确认，级联删除该班级所有数据

### 5.3 数据导入 (`/import/:classId`)

- **功能**：上传 Excel 成绩表
- **表单**：
  - 考试名称（如"期中考试"）
  - 考试日期
  - Excel 文件上传（支持拖拽，`.xlsx`/`.xls`）
- **Excel 解析逻辑**：
  - 自动识别表头行（查找包含"姓名"/"考号"的行）
  - 提取：考号、姓名、总分、班名次、校名次、各科得分（列名规则：`科目名 + 得分`，如"语文得分"）
  - 自动创建/更新学生信息
  - 自动创建考试记录，推算 `full_score`
  - 更新班级学生人数
- **导入说明卡片**：右侧展示列名规则和导入后系统自动执行的操作

### 5.4 学情仪表盘 (`/dashboard/:classId/:examId`)

- **功能**：班级整体学情概览
- **顶部操作栏**：
  - 考试选择下拉框
  - "配置知识点"按钮：打开模态框，将科目与知识点关联
  - "生成 AI 报告"按钮：跳转报告页
- **统计卡片**（4 张）：
  - 参考人数
  - 班级均分
  - 及格率（基于 `full_score * 0.6`）
  - 优秀率（基于 `full_score * 0.9`）
- **分数段分布图**：ECharts 柱状图，按满分比例分段（`<60%`、`60-70%`...`100%+`）
- **学生成绩明细表**：姓名、考号、总分（可排序）、班名次（前 3 名蓝色高亮）
- **空状态**：无考试数据时显示引导组件

### 5.5 学生画像 (`/students/:classId`)

- **功能**：个体学生分析
- **布局**：左右分栏
  - **左侧（30%）**：学生列表表格
    - 显示：姓名、考号、最新总分、最新班名次
    - 点击行切换选中学生
    - 前 3 名蓝色高亮
  - **右侧（70%）**：选中学生画像
    - 头像卡片：姓名、考号、薄弱学科标签（低于 70 分标红，否则绿色"暂无薄弱学科"）
    - 成绩趋势折线图：历次考试总分变化
    - 学科雷达图：最新一次考试各科得分
- **空状态**：无学生数据时提示"请先导入成绩"

### 5.6 知识点热力图 (`/heatmap/:classId/:examId`)

- **功能**：全班知识点掌握度可视化
- **展示**：ECharts 热力图
  - X 轴：知识点（或科目名）
  - Y 轴：学生姓名（前 20 名）
  - 色值：掌握度百分比，红色系渐变（浅红 → 深红）
- **数据逻辑**：
  - 优先使用 `ExamKnowledgeMapping` 配置的知识点映射
  - 未配置时，从 `subject_scores` 的 key 自动推导
  - 掌握度 = 实际得分 / 满分 × 100%
- **空状态**：提示"请先导入成绩并配置知识点映射"

### 5.7 风险预警 (`/risk/:classId/:examId`)

- **功能**：自动识别学习风险学生
- **统计卡片**（4 张）：高风险学生数、中风险学生数、低风险学生数、班级总人数
- **风险学生列表**：
  - 姓名、考号
  - 风险等级标签（红/橙/蓝）
  - 风险类型标签（连续下滑/大幅退步/偏科严重）
  - 预警原因、建议措施
- **风险判定规则**（`risk_detector.py` + `stats_engine.py`）：
  | 风险类型 | 判定条件 | 等级 |
  |---------|---------|------|
  | 连续下滑 | 任意连续 3 次考试总分递减 | high |
  | 大幅退步 | 本次较上次退步 ≥ 10 分 | high |
  | 偏科严重 | 最高学科与最低学科分差 ≥ 20 分 | medium |
- **数据范围**：分析该班级所有历史考试，但偏科检测仅用当前考试数据

### 5.8 AI 分析报告 (`/report/:classId/:examId`)

- **功能**：自动生成并导出学情分析报告
- **流程**：
  1. 页面加载时自动调用 `POST /reports/generate`
  2. 后端收集统计数据 + 风险数据，组装 prompt
  3. 调用 AI API（DeepSeek 等）生成 Markdown 报告
  4. 若 API 不可用，自动降级为模板报告
  5. 前端渲染报告内容
- **导出按钮**：
  - "导出 Word"：生成 `.docx`，含封面页（标题/考试/班级/时间/编号）
  - "导出 PDF"：生成 `.pdf`，含中文字体注册（宋体/微软雅黑 fallback）
- **报告内容**：
  - 班级整体概况（均分/标准差/及格率/优秀率/分数段分布）
  - 风险预警分析（风险学生详情）
  - 教学改进建议

### 5.9 知识点管理 (`/knowledge-points/:classId`)

- **功能**：维护班级知识点体系
- **操作**：
  - 新增知识点：名称、上级知识点（支持层级）、权重
  - 编辑/删除知识点
- **用途**：与考试进行映射，驱动热力图展示

### 5.10 系统设置 (`/settings`)

- **功能**：配置 AI 模型参数
- **配置项**：
  - 模型服务商（DeepSeek / MiniMax / Qwen / GLM）
  - API Key（密码输入框，修改时更新）
  - Base URL（切换服务商自动填充预设）
  - 模型名称（根据服务商动态选项）
- **测试连接**：验证 API Key 是否可用

---

## 6. 标准使用流程

### 6.1 首次使用（内置演示数据）

```
1. 运行 python scripts/init_db.py 初始化数据库（自动导入 36 名学生演示数据）
2. 浏览器访问 http://localhost:5173（开发）或 http://localhost:8000（生产）
3. 登录页面输入 admin / 123456
4. 进入"班级管理"，看到已创建的"一年级1班"（36人）
5. 点击"进入班级"，自动跳转学情仪表盘
6. 在仪表盘选择考试"一年级下学期期中考试"，查看统计与分布
7. 浏览学生画像、风险预警、知识点热力图、AI 分析报告
```

### 6.2 完整使用流程（导入真实数据）

```
1. 登录系统
2. 【班级管理】创建新班级（填写名称、学科、年级、学校）
3. 点击"进入班级"
4. 【数据导入】上传 Excel 成绩表，填写考试名称和日期，点击导入
5. 【学情仪表盘】查看班级整体统计、分数段分布、成绩明细
   └─ 点击"配置知识点"关联科目与知识点（可选）
6. 【学生画像】查看每个学生成绩趋势和学科雷达
7. 【风险预警】查看系统自动标记的风险学生及建议
8. 【知识点热力图】查看全班知识点掌握度（需先配置映射）
9. 【AI 分析报告】生成报告，导出 Word/PDF 用于汇报
```

### 6.3 菜单导航逻辑

- 侧边栏共 9 个菜单项
- 进入班级后，`currentClassId` 和 `currentClassName` 保存到 localStorage
- 需要班级上下文的页面（仪表盘/导入/学生/风险/热力图/知识点），自动携带当前班级 ID
- 顶部 Header 显示"当前班级"标签和面包屑导航

---

## 7. API 接口清单

### 7.1 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录，返回 JWT Token |

**请求体**：`{ "username": "admin", "password": "123456" }`

**响应**：`{ "access_token": "jwt_token", "token_type": "bearer" }`

> 所有 API（除登录外）需在 Header 携带 `Authorization: Bearer <token>`

### 7.2 班级管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/classes` | 班级列表（实时统计学生人数） |
| POST | `/api/classes` | 创建班级 |
| GET | `/api/classes/{id}` | 班级详情 |
| PUT | `/api/classes/{id}` | 更新班级 |
| DELETE | `/api/classes/{id}` | 删除班级（级联删除） |

### 7.3 数据导入

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/import/excel` | 上传 Excel 导入成绩 |

**请求**：`multipart/form-data`，字段：`file`, `class_id`, `exam_name`, `exam_date`

**响应**：`{ "imported": 36, "skipped": 0, "errors": [] }`

### 7.4 仪表盘

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/classes/{class_id}/exams` | 班级考试列表 |
| GET | `/api/dashboard/classes/{class_id}/exams/{exam_id}/stats` | 考试统计数据 |
| GET | `/api/dashboard/classes/{class_id}/exams/{exam_id}/scores` | 考试成绩明细 |

**Stats 响应示例**：
```json
{
  "class_name": "一年级1班",
  "exam_name": "期中考试",
  "class_avg": 143.8,
  "std_dev": 38.0,
  "pass_rate": 0.833,
  "excellent_rate": 0.167,
  "score_distribution": [{"range": "<60%", "count": 6}, ...],
  "student_count": 36
}
```

### 7.5 学生画像

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/students/classes/{class_id}` | 班级学生列表（附最新成绩） |
| GET | `/api/students/{student_id}/profile` | 学生画像（趋势+雷达+薄弱点） |

### 7.6 知识点热力图

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/heatmap/classes/{class_id}/exams/{exam_id}` | 热力图数据 |

### 7.7 风险预警

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/risk/classes/{class_id}/exams/{exam_id}` | 风险分析结果 |

### 7.8 AI 报告

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/reports/generate` | 生成报告 |
| GET | `/api/reports/{report_id}` | 获取报告内容 |
| GET | `/api/reports/{report_id}/export?format=docx/pdf` | 导出报告 |

### 7.9 知识点配置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/knowledge-points/classes/{class_id}` | 知识点列表 |
| POST | `/api/knowledge-points` | 创建知识点 |
| PUT | `/api/knowledge-points/{id}` | 更新知识点 |
| DELETE | `/api/knowledge-points/{id}` | 删除知识点 |
| GET | `/api/knowledge-points/classes/{class_id}/exams/{exam_id}/mapping` | 获取考试知识点映射 |
| POST | `/api/knowledge-points/classes/{class_id}/exams/{exam_id}/mapping` | 保存考试知识点映射 |

### 7.10 系统设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取系统设置 |
| PUT | `/api/settings` | 更新系统设置 |
| POST | `/api/settings/test` | 测试 AI 连接 |

---

## 8. 启动与部署

### 8.1 开发环境启动

```bash
# 后端（端口 8001）
cd backend
pip install -r requirements.txt
python scripts/init_db.py        # 初始化数据库 + 导入演示数据
uvicorn app.main:app --reload --port 8001

# 前端（端口 5173，另开终端）
cd frontend
npm install
npm run dev
```

- 前端地址：`http://localhost:5173`
- 后端地址：`http://localhost:8001`
- API 文档：`http://localhost:8001/docs`（Swagger UI）

### 8.2 生产环境部署

```bash
# 构建前端
cd frontend
npm run build

# 启动（FastAPI 托管静态文件，端口 8000）
cd backend
python -m app.main
```

访问：`http://localhost:8000`

### 8.3 环境变量配置

在 `backend/.env` 中配置：

```
DEEPSEEP_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

### 8.4 数据库重置

```bash
rm backend/data/school_analytics.db
python backend/scripts/init_db.py
```

---

## 9. 项目文件结构

```
produce/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 配置（数据库路径、API Key）
│   │   ├── database.py          # SQLAlchemy 引擎/会话
│   │   ├── models.py            # 数据模型（10 张表）
│   │   ├── schemas.py           # Pydantic 请求/响应模型
│   │   ├── routers/             # API 路由（11 个模块）
│   │   │   ├── auth.py          # 认证
│   │   │   ├── classes.py       # 班级管理
│   │   │   ├── import_data.py   # 数据导入
│   │   │   ├── dashboard.py     # 仪表盘
│   │   │   ├── heatmap.py       # 热力图
│   │   │   ├── students.py      # 学生画像
│   │   │   ├── risk.py          # 风险预警
│   │   │   ├── reports.py       # AI 报告
│   │   │   ├── knowledge_points.py  # 知识点配置
│   │   │   └── settings.py      # 系统设置
│   │   ├── services/            # 业务逻辑服务
│   │   │   ├── excel_parser.py  # Excel 解析
│   │   │   ├── stats_engine.py  # 统计分析（纯函数）
│   │   │   ├── risk_detector.py # 风险判定
│   │   │   ├── report_generator.py  # AI 报告生成
│   │   │   └── export_service.py    # Word/PDF 导出
│   │   └── utils/
│   │       └── security.py      # JWT/密码哈希
│   ├── data/                    # SQLite 数据库目录
│   ├── scripts/
│   │   └── init_db.py           # 数据库初始化 + 演示数据导入
│   ├── requirements.txt
│   └── .env                     # 环境变量
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # 路由配置
│   │   ├── main.tsx             # 入口
│   │   ├── utils/request.ts     # Axios 封装（含 JWT 拦截器）
│   │   ├── pages/               # 页面组件（10 个页面）
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ClassListPage.tsx
│   │   │   ├── ImportPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── StudentProfilePage.tsx
│   │   │   ├── HeatmapPage.tsx
│   │   │   ├── RiskAlertPage.tsx
│   │   │   ├── ReportPage.tsx
│   │   │   ├── KnowledgePointPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── components/          # 公共组件
│   │   │   ├── Layout.tsx       # 侧边栏+Header+Content 布局
│   │   │   ├── GettingStarted.tsx   # 首次使用引导
│   │   │   └── EmptyState.tsx   # 空状态组件
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── templates/
│       └── 一年级.xlsx          # 演示数据 Excel 模板
├── PRODUCT_SPEC.md              # 产品规格
├── ARCHITECTURE.md              # 架构文档
├── DEPLOYMENT.md                # 部署文档
├── OPERATIONS.md                # 运维手册
├── TASKS.md                     # 任务列表
└── USER_MANUAL.md               # 本文件
```

---

## 10. 内置演示数据

系统初始化时自动从 `docs/templates/一年级.xlsx` 导入演示数据：

| 数据项 | 内容 |
|--------|------|
| 班级 | 一年级1班（王庄郎柳集小学） |
| 学科 | 数学 |
| 年级 | 一年级 |
| 考试 | 一年级下学期期中考试（2026-04-27） |
| 学生数 | 36 人 |
| 科目 | 语文、数学 |
| 最高总分 | 192 分（自动设为 exam.full_score） |

### Excel 模板格式说明

```
Row 1: 标题（合并单元格）
Row 2: 单位信息（合并单元格）
Row 3: 学校 | 班级 | 考号 | 姓名 | 总分 |       |       |       | 语文 |       |       |       | 数学 |       |       |       |
Row 4:      |      |      |      | 得分 | 班 | 校 | 联 | 得分 | 班 | 校 | 联 | 得分 | 班 | 校 | 联 |
Row 5+: 数据行（36 行）
```

**列映射**（0-based）：
- Col0: 学校, Col1: 班级, Col2: 考号, Col3: 姓名
- Col4: 总分得分, Col5: 总分班名次, Col6: 总分校名次
- Col8: 语文得分, Col9: 语文班名次, Col10: 语文校名次
- Col12: 数学得分, Col13: 数学班名次, Col14: 数学校名次

---

## 附录：关键设计决策

### ADR-001：SQLite 而非 PostgreSQL/MySQL

- **背景**：单机部署，零配置是刚需
- **决策**：使用 SQLite，数据库文件存放在 `backend/data/`
- **后果**：并发写入有限，但单机教育场景完全够用
- **回退**：更换为 PostgreSQL 只需改数据库连接字符串

### ADR-002：subject_scores 用 JSON 而非独立表

- **背景**：不同年级科目数不同（一年级 2 科，高中 8+ 科）
- **决策**：`scores` 表的 `subject_scores` 字段用 JSON 存储
- **后果**：牺牲部分关系型查询能力，换取灵活性

### ADR-003：云端 AI API 而非本地模型

- **背景**：本地部署大模型对硬件要求高，参赛环境不确定
- **决策**：调用 DeepSeek/豆包等国产云 API
- **后果**：需要网络连接，产生少量 API 费用
- **缓解**：报告可缓存，同一考试不重复生成；API 不可用时自动降级模板报告
