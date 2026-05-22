# 学情智能分析与预警系统 — 任务列表

## 当前 Sprint

### 进行中

- [ ] **Task-010: AI 分析报告**
  - 后端 FastAPI 项目结构（main.py, config, database, models, routers, services）
  - 前端 Vite + React + TS 项目初始化
  - 后端依赖：requirements.txt
  - 前端依赖：package.json
  - 验收：后端能启动（Swagger 页面可访问），前端能启动（首页显示）

### 待做

- [ ] **Task-007: 知识点热力图**
  - 知识点配置 CRUD
  - 学生知识点得分录入/计算
  - 热力图数据接口
  - 前端矩阵热力图（参考原型）
  - 验收：颜色深浅与分数对应，悬停显示详情

- [ ] **Task-008: 学生画像**
  - 学生列表 + 详情 API
  - 成绩趋势
  - 薄弱知识点标记
  - 前端左右分栏布局（参考原型）
  - 验收：选中学生后右侧展示正确

- [ ] **Task-010: AI 分析报告**
  - Prompt 模板设计
  - DeepSeek API 调用
  - 报告生成与存储
  - 前端报告展示页（Markdown 渲染）
  - 验收：报告内容合理，生成时间在 10 秒内

- [ ] **Task-011: 报告导出**
  - Word 导出（python-docx）
  - PDF 导出（ReportLab）
  - 验收：导出文件格式正确，内容完整

- [ ] **Task-012: 演示视频录制**
  - 按案例征集要求录制（PPT+录屏+解说，8分钟内）
  - 验收：覆盖所有核心功能，解说清晰

## 已归档

- [x] **Task-001~006: 项目脚手架、数据库、认证、Excel导入、班级管理、仪表盘**
- [x] **Task-009: 风险预警**
  - 风险规则引擎（连续下滑/大幅退步/偏科严重）
  - 自动计算风险学生
  - 前端预警卡片 + 详情列表
- [x] **Task-000: 产品规格与原型**
  - PRODUCT_SPEC.md
  - ARCHITECTURE.md
  - prototype.html（可点击原型）
