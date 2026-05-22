# 学情智能分析与预警系统 — Claude Code 项目入口

## 项目定位

面向教师（基础教育/职业教育/高等教育）的学情分析与预警 Web 应用。

教师上传成绩 Excel，系统自动完成统计分析、薄弱点识别、风险预警，并生成可下载的 AI 分析报告。

## 核心文件

| 文件 | 作用 |
|------|------|
| `PRODUCT_SPEC.md` | 产品规格：目标用户、痛点、MVP 功能、非目标 |
| `ARCHITECTURE.md` | 架构文档：技术栈、数据模型、API 设计、目录结构 |
| `TASKS.md` | 当前任务池、状态、验收标准 |
| `TESTING.md` | 验证命令和测试策略 |
| `DEPLOYMENT.md` | 单机部署步骤 |
| `OPERATIONS.md` | 常见问题处理 |
| `CHANGELOG.md` | 版本级变更 |

## 技术栈

- **前端**：React 18 + Ant Design 5 + TypeScript + Vite
- **后端**：Python 3.11 + FastAPI + SQLAlchemy 2.0
- **数据库**：SQLite（单机零配置）
- **AI**：DeepSeek API（国产云 API）
- **图表**：ECharts
- **部署**：单机脚本启动

## 开发规范

1. **单体优先**：不要为"未来可能的需求"引入抽象。
2. **边界清晰**：路由层不写业务逻辑，业务层不直接操作数据库。
3. **统计纯函数**：`stats_engine.py` 中的函数只接收 DataFrame，返回结果，不读写数据库。
4. **AI 调用隔离**：`report_generator.py` 是 AI 调用的唯一入口，便于切换模型。
5. **原型对齐**：UI 实现以 `prototype.html` 为参考，保持视觉一致性。

## 启动命令

```bash
# 后端（开发）
cd backend
uvicorn app.main:app --reload --port 8000

# 前端（开发）
cd frontend
npm run dev

# 数据库初始化（首次）
cd backend
python scripts/init_db.py
```

## 测试命令

```bash
# 后端测试
cd backend
pytest

# 手动验证（跑完整流程）
python scripts/e2e_verify.py
```

## 数据模板

成绩导入模板：`一年级.xlsx`
- 列：学校 | 班级 | 考号 | 姓名 | 总分 | 语文得分 | 语文班名次 | 语文校名次 | 数学得分 | ...
- 系统按此结构解析，科目可配置。
