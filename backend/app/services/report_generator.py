import httpx
from app.config import settings


async def generate_class_report(
    class_name: str,
    exam_name: str,
    stats: dict,
    risk_summary: dict,
    weak_points: list
) -> str:
    """生成班级学情分析报告"""

    if not settings.DEEPSEEK_API_KEY:
        return _generate_fallback_report(class_name, exam_name, stats, risk_summary, weak_points)

    prompt = f"""你是一位资深教育专家。请根据以下数据，生成一份专业的学情分析报告。

班级：{class_name}
考试：{exam_name}

【统计数据】
- 班级均分：{stats.get('class_avg', 'N/A')}
- 标准差：{stats.get('std_dev', 'N/A')}
- 及格率：{stats.get('pass_rate', 'N/A')}
- 优秀率：{stats.get('excellent_rate', 'N/A')}

【风险预警】
- 高风险学生：{risk_summary.get('high', 0)}人
- 中风险学生：{risk_summary.get('medium', 0)}人

【薄弱知识点】
{', '.join(weak_points) if weak_points else '暂无'}

请生成一份结构化的分析报告，包含：
1. 班级整体概况
2. 知识点掌握分析
3. 风险学生预警
4. 教学建议

要求：语言专业、数据准确、建议具体可行。"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.DEEPSEEK_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}"},
                json={
                    "model": settings.DEEPSEEK_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 2000
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception:
        return _generate_fallback_report(class_name, exam_name, stats, risk_summary, weak_points)


def _generate_fallback_report(class_name, exam_name, stats, risk_summary, weak_points):
    """API 不可用时生成 fallback 报告"""
    return f"""# {class_name}{exam_name}学情分析报告

## 一、班级整体概况

本次{exam_name}，班级均分 {stats.get('class_avg', 'N/A')}，标准差 {stats.get('std_dev', 'N/A')}。
及格率 {stats.get('pass_rate', 'N/A')}，优秀率 {stats.get('excellent_rate', 'N/A')}。

## 二、知识点掌握分析

{"、".join(weak_points) if weak_points else "暂无薄弱知识点数据"}

## 三、风险学生预警

系统识别出 {risk_summary.get('high', 0) + risk_summary.get('medium', 0)} 位风险学生，
其中高风险 {risk_summary.get('high', 0)} 人，中风险 {risk_summary.get('medium', 0)} 人。

## 四、教学建议

1. 针对薄弱知识点进行专项训练
2. 对风险学生进行一对一辅导
3. 定期跟踪学生成绩变化
"""
