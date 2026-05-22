# 学情智能分析与预警系统 — 运维手册

## 日志查看

```bash
# 后端日志直接输出到终端
# 如需保存：
python -m app.main > app.log 2>&1
```

## 数据备份

```bash
# 直接复制 SQLite 文件
cp backend/data/school_analytics.db backup/school_analytics_$(date +%Y%m%d).db
```

## 故障排查

| 现象 | 可能原因 | 解决方式 |
|------|---------|---------|
| 无法登录 | 数据库未初始化 | 运行 `python scripts/init_db.py` |
| Excel 导入失败 | 格式与模板不符 | 检查是否使用标准模板 `一年级.xlsx` |
| AI 报告生成超时 | API 网络问题 | 检查网络，或查看 `.env` 中 API Key |
| 图表不显示 | 前端构建问题 | 重新运行 `npm run build` |
| 页面白屏 | 前端路由模式问题 | 刷新页面，或检查浏览器控制台 |

## 数据隐私注意事项

1. 成绩数据存储在本地 SQLite，不上传云端。
2. 仅 AI 报告生成时向 DeepSeek API 发送统计摘要（不含学生姓名）。
3. 参赛提交时，数据库中的真实学生姓名建议做脱敏处理。
