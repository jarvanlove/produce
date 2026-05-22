# 学情智能分析与预警系统 — 任务列表

## 当前 Sprint

全部任务已完成。等待演示视频录制。

## 已归档

- [x] **Task-001~006: 项目脚手架、数据库、认证、Excel导入、班级管理、仪表盘**
- [x] **Task-007: 知识点热力图**
  - 新增 ExamKnowledgeMapping / StudentKnowledgeScore 模型
  - heatmap router + 前端 ECharts 热力图页面
- [x] **Task-008: 学生画像**
  - students router: 学生列表 + 个人画像 API
  - 前端左右分栏：成绩趋势折线 + 学科雷达 + 薄弱点标签
- [x] **Task-009: 风险预警**
  - 风险规则引擎（连续下滑/大幅退步/偏科严重）
  - 前端预警卡片 + 详情列表
- [x] **Task-010: AI 分析报告**
  - report_generator.py: DeepSeek API 调用 + fallback 模板
  - 前端 ReportPage: Markdown 渲染
- [x] **Task-011: 报告导出**
  - export_service.py: Markdown → Word/PDF，支持中文和表格
  - 前端导出按钮组
- [x] **Task-012: 录制脚本与功能检查清单**
  - `docs/录制脚本.md`: 9 步演示流程 + 解说词 + 技术建议 + 预演检查清单
- [x] **Task-000: 产品规格与原型**
  - PRODUCT_SPEC.md
  - ARCHITECTURE.md
  - prototype.html（可点击原型）
