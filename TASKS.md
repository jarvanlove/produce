# 学情智能分析与预警系统 — 任务列表

## 当前 Sprint

### 进行中

- [ ] **Task-001: 项目脚手架搭建**
  - 后端 FastAPI 项目结构（main.py, config, database, models, routers, services）
  - 前端 Vite + React + TS 项目初始化
  - 后端依赖：requirements.txt
  - 前端依赖：package.json
  - 验收：后端能启动（Swagger 页面可访问），前端能启动（首页显示）

### 待做

- [ ] **Task-002: 数据库模型与初始化脚本**
  - SQLAlchemy models（users, classes, students, exams, scores, knowledge_points, risk_alerts, reports）
  - init_db.py：创建表 + 插入默认教师账号
  - 验收：运行 init_db.py 后 SQLite 文件生成，表结构正确

- [ ] **Task-003: 认证模块**
  - JWT 登录/验证
  - 内置默认账号 T2024001
  - 前端登录页 + 路由守卫
  - 验收：登录成功返回 token，未登录跳转登录页

- [ ] **Task-004: Excel 导入与解析**
  - 上传接口（multipart/form-data）
  - 按一年级.xlsx 模板解析
  - 数据清洗与入库
  - 验收：上传模板文件后，students 和 scores 表有数据

- [ ] **Task-005: 班级管理**
  - 后端 CRUD API
  - 前端班级列表页（参考原型）
  - 新建班级表单
  - 验收：能增删改查班级，前端展示与原型一致

- [ ] **Task-006: 仪表盘**
  - 统计指标计算（均分、标准差、及格率、优秀率）
  - 分数段分布
  - 历次考试趋势
  - 前端 KPI 卡片 + 图表
  - 验收：数据与手工计算一致，图表正常渲染

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

- [ ] **Task-009: 风险预警**
  - 风险规则引擎（连续下滑/大幅退步/偏科严重）
  - 自动计算风险学生
  - 前端预警卡片 + 详情列表
  - 验收：规则触发正确，高风险学生被标记

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

- [x] **Task-000: 产品规格与原型**
  - PRODUCT_SPEC.md
  - ARCHITECTURE.md
  - prototype.html（可点击原型）
