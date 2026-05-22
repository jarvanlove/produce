# 学情智能分析与预警系统 — 测试策略

## 测试分层

| 层级 | 工具 | 覆盖范围 |
|------|------|---------|
| 单元测试 | pytest | services/ 下的纯函数（stats_engine, risk_detector） |
| API 测试 | pytest + TestClient | routers/ 下的接口（FastAPI TestClient） |
| E2E 验证 | 手工脚本 | 完整用户路径：导入 → 分析 → 报告 |

## 验证命令

```bash
# 1. 单元测试
cd backend
pytest tests/ -v

# 2. API 测试
cd backend
pytest tests/test_api.py -v

# 3. E2E 验证（手动走通核心路径）
cd backend
python scripts/e2e_verify.py
```

## 关键测试用例

### stats_engine 单元测试

```python
def test_calculate_class_avg():
    """班级均分计算正确"""
    scores = pd.Series([80, 90, 70, 60, 100])
    assert calculate_class_avg(scores) == 80.0

def test_detect_continuous_decline():
    """连续3次下滑触发高风险"""
    history = [85, 78, 70, 65]  # 连续下滑
    assert detect_risk(history) == {"type": "continuous_decline", "level": "high"}
```

### API 测试

```python
def test_import_excel(client):
    """上传 Excel 后数据正确入库"""
    with open("tests/fixtures/一年级.xlsx", "rb") as f:
        response = client.post(
            "/api/import/excel",
            data={"class_id": 1, "exam_name": "期中考试"},
            files={"file": f}
        )
    assert response.status_code == 200
    assert response.json()["imported"] == 48
```

### E2E 验证清单

```bash
# 运行后手动检查：
[ ] 1. 登录成功，看到班级列表
[ ] 2. 上传一年级.xlsx，提示导入 48 条
[ ] 3. 进入仪表盘，均分显示正确
[ ] 4. 热力图颜色深浅与分数对应
[ ] 5. 风险预警页面显示正确数量的高风险学生
[ ] 6. AI 报告生成成功，内容包含班级概况
[ ] 7. 报告导出 PDF 成功，文件可打开
```

## 测试数据

- `tests/fixtures/一年级.xlsx` — 48 条真实成绩数据
- `tests/fixtures/empty.xlsx` — 边界测试：空文件
- `tests/fixtures/wrong_format.xlsx` — 边界测试：格式错误

## 性能基准

| 指标 | 目标 |
|------|------|
| Excel 导入（48条） | < 3 秒 |
| 仪表盘加载 | < 1 秒 |
| AI 报告生成 | < 15 秒 |
| 页面首屏加载 | < 2 秒 |
