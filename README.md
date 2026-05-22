# 学情智能分析与预警系统

面向基础教育/职业教育/高等教育教师的学情分析与预警 Web 应用。教师上传成绩 Excel，系统自动完成统计分析、薄弱点识别、风险预警，并生成可下载的 AI 分析报告。

## 技术栈

- **前端**：React 18 + Ant Design 5 + TypeScript + Vite + ECharts
- **后端**：Python 3.11 + FastAPI + SQLAlchemy 2.0 (async)
- **数据库**：SQLite（单机零配置）
- **AI**：DeepSeek API（国产云 API，带 fallback 模板）
- **部署**：单机脚本启动

## 功能特点

- **Excel 成绩导入**：按模板解析，自动建立考试、学生、成绩记录
- **学情仪表盘**：均分、标准差、及格率、优秀率、分数段分布图
- **风险预警**：连续下滑、大幅退步、偏科严重自动检测
- **AI 分析报告**：基于 DeepSeek API 生成学情分析报告，支持 Markdown 渲染与 Word/PDF 导出
- **学生画像**：成绩趋势、薄弱知识点标记

## 快速开始

### 1. 克隆代码

```bash
git clone https://github.com/jarvanlove/produce.git
cd produce
```

### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt
python scripts/init_db.py
uvicorn app.main:app --reload --port 8000
```

默认账号：`T2024001` / 密码：`admin`

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173`

## 项目目录

```
produce/
├── backend/          # FastAPI 后端
│   ├── app/
│   │   ├── routers/    # API 路由
│   │   ├── services/   # 业务逻辑（Excel 解析、统计引擎、风险检测、AI 报告）
│   │   ├── models.py   # SQLAlchemy 数据模型
│   │   └── main.py     # 应用入口
│   ├── scripts/
│   └── requirements.txt
├── frontend/         # React 前端
│   ├── src/
│   │   ├── pages/      # 页面组件
│   │   ├── components/ # 通用组件
│   │   └── utils/      # 工具函数
│   └── package.json
├── docs/             # 文档与资料
│   ├── prototype/    # 高保真原型
│   └── templates/    # 成绩导入模板
└── *.md            # 项目控制文件
```

## 项目控制文件

| 文件 | 说明 |
|------|------|
| `PRODUCT_SPEC.md` | 产品规格与 MVP 功能 |
| `ARCHITECTURE.md` | 架构设计、数据模型、API 约定 |
| `TASKS.md` | 当前任务池与进度 |
| `TESTING.md` | 验证命令与测试策略 |
| `DEPLOYMENT.md` | 单机部署步骤 |
| `OPERATIONS.md` | 常见问题处理 |
| `CLAUDE.md` | Claude Code 项目入口 |

## 贡献

本项目为创 AI 案例征集活动开发，代码全部自研，未使用低代码平台。
