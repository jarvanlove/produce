import json
from datetime import datetime
from typing import Any, Dict, List

import httpx
import pandas as pd
from sqlalchemy import select

from app.config import settings
from app.models import Class, Exam, Score, Student, SystemSetting
from app.services.stats_engine import (
    calculate_class_avg,
    calculate_std_dev,
    calculate_pass_rate,
    calculate_excellent_rate,
    score_distribution,
)
from app.services.risk_detector import analyze_risk


def _build_fallback_report(
    class_name: str,
    exam_name: str,
    stats: Dict[str, Any],
    risk_summary: Dict[str, int],
    risk_students: List[Dict[str, Any]],
) -> str:
    """当 AI API 不可用时，使用模板生成报告。"""
    lines = [
        f"# {class_name} {exam_name} 学情分析报告",
        "",
        f"> 生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "> 生成方式：系统模板（AI 服务暂不可用）",
        "",
        "## 一、班级整体概况",
        "",
        f"- **班级均分**：{stats.get('class_avg', 0)} 分",
        f"- **标准差**：{stats.get('std_dev', 0)} 分",
        f"- **及格率**：{stats.get('pass_rate', 0) * 100:.1f}%",
        f"- **优秀率**：{stats.get('excellent_rate', 0) * 100:.1f}%",
        f"- **参考人数**：{stats.get('student_count', 0)} 人",
        "",
        "### 分数段分布",
        "",
    ]

    dist = stats.get("score_distribution", [])
    if dist:
        lines.append("| 分数段 | 人数 |")
        lines.append("|--------|------|")
        for d in dist:
            lines.append(f"| {d['range']} | {d['count']} |")
        lines.append("")
    else:
        lines.append("暂无分数段分布数据。")
        lines.append("")

    lines.extend([
        "## 二、风险预警概况",
        "",
        f"- **高风险**：{risk_summary.get('high', 0)} 人",
        f"- **中风险**：{risk_summary.get('medium', 0)} 人",
        f"- **低风险**：{risk_summary.get('low', 0)} 人",
        "",
    ])

    if risk_students:
        lines.append("### 风险学生详情")
        lines.append("")
        for rs in risk_students:
            name = rs.get("student_name", "未知")
            for alert in rs.get("alerts", []):
                level = alert.get("risk_level", "low")
                reason = alert.get("reason", "")
                advice = alert.get("advice", "")
                lines.append(f"- **{name}**（{level}）：{reason}")
                lines.append(f"  - 建议：{advice}")
        lines.append("")
    else:
        lines.append("本次考试未发现明显风险学生，请继续保持关注。")
        lines.append("")

    lines.extend([
        "## 三、教学建议",
        "",
        "1. **关注后进生**：对于分数段靠后的学生，建议安排课后辅导或小组互助。",
        "2. **稳定尖子生**：优秀率仍有提升空间，可适当增加拓展性练习。",
        "3. **平衡学科发展**：如有偏科学生，建议加强薄弱学科的针对性训练。",
        "4. **动态跟踪**：建议持续跟踪风险学生的学习状态，及时干预。",
        "",
        "---",
        "",
        "*本报告由学情智能分析与预警系统自动生成，仅供参考。*",
    ])

    return "\n".join(lines)


def _build_prompt(
    class_name: str,
    exam_name: str,
    stats: Dict[str, Any],
    risk_summary: Dict[str, int],
    risk_students: List[Dict[str, Any]],
) -> str:
    """构建发送给 AI 的结构化 prompt。"""
    stats_json = json.dumps(stats, ensure_ascii=False, indent=2)
    risk_json = json.dumps(
        {"summary": risk_summary, "risk_students": risk_students},
        ensure_ascii=False,
        indent=2,
    )

    prompt = f"""你是一位资深教育专家，请根据以下班级考试数据撰写一份学情分析报告。
要求：
1. 使用 Markdown 格式输出；
2. 报告结构包含：班级整体概况、风险预警分析、教学改进建议；
3. 语言专业、客观，适合教师阅读；
4. 不要编造数据，所有结论必须基于提供的数据。

班级：{class_name}
考试：{exam_name}

【统计数据】
{stats_json}

【风险预警数据】
{risk_json}

请直接输出报告正文（Markdown），不要添加额外说明。"""
    return prompt


async def _get_ai_settings(db: Any) -> Dict[str, str]:
    """从数据库读取 AI 配置，未设置则使用环境变量默认值。"""
    result = await db.execute(select(SystemSetting))
    rows = result.scalars().all()
    db_settings = {row.key: row.value for row in rows}

    return {
        "provider": db_settings.get("ai_provider", "deepseek"),
        "api_key": db_settings.get("ai_api_key", settings.DEEPSEEK_API_KEY),
        "base_url": db_settings.get("ai_base_url", settings.DEEPSEEK_BASE_URL),
        "model": db_settings.get("ai_model", settings.DEEPSEEK_MODEL),
    }


async def generate_report(class_id: int, exam_id: int, db: Any) -> str:
    """
    生成 AI 分析报告。

    流程：
    1. 查询班级、考试及成绩数据；
    2. 计算统计指标与风险预警；
    3. 读取 AI 配置并调用对应 API；
    4. 若 API 失败或无 API Key，返回 fallback 模板报告。
    """
    # ---- 1. 获取基础信息 ----
    cls = await db.get(Class, class_id)
    exam = await db.get(Exam, exam_id)
    if not cls or not exam or exam.class_id != class_id:
        raise ValueError("班级或考试不存在")

    # ---- 2. 获取当前考试统计数据 ----
    result = await db.execute(select(Score).where(Score.exam_id == exam_id))
    scores = result.scalars().all()

    if scores:
        series = pd.Series([s.total_score for s in scores])
        full_score = exam.full_score if exam.full_score else None
        stats = {
            "class_name": cls.name,
            "exam_name": exam.name,
            "class_avg": calculate_class_avg(series),
            "std_dev": calculate_std_dev(series),
            "pass_rate": calculate_pass_rate(series, full_score),
            "excellent_rate": calculate_excellent_rate(series, full_score),
            "score_distribution": score_distribution(series, full_score),
            "student_count": len(scores),
        }
    else:
        stats = {
            "class_name": cls.name,
            "exam_name": exam.name,
            "class_avg": 0,
            "std_dev": 0,
            "pass_rate": 0,
            "excellent_rate": 0,
            "score_distribution": [],
            "student_count": 0,
        }

    # ---- 3. 获取风险数据（复用 risk.py 逻辑） ----
    exam_result = await db.execute(
        select(Exam).where(Exam.class_id == class_id).order_by(Exam.exam_date)
    )
    exams = exam_result.scalars().all()
    exam_ids = [e.id for e in exams]
    exam_map = {e.id: e for e in exams}

    score_result = await db.execute(
        select(Score, Student)
        .join(Student, Score.student_id == Student.id)
        .where(Student.class_id == class_id)
        .where(Score.exam_id.in_(exam_ids))
    )
    rows = score_result.all()

    student_history: Dict[int, Dict[str, Any]] = {}
    for score, student in rows:
        sid = student.id
        if sid not in student_history:
            student_history[sid] = {
                "student_id": sid,
                "name": student.name,
                "student_no": student.student_no,
                "total_scores": [],
                "exam_ids": [],
            }
        student_history[sid]["total_scores"].append(score.total_score)
        student_history[sid]["exam_ids"].append(score.exam_id)

    current_result = await db.execute(
        select(Score, Student)
        .join(Student, Score.student_id == Student.id)
        .where(Score.exam_id == exam_id)
    )
    current_rows = current_result.all()
    current_scores: Dict[int, Dict[str, float]] = {}
    for score, student in current_rows:
        current_scores[student.id] = score.subject_scores or {}

    risk_students: List[Dict[str, Any]] = []
    for sid, history in student_history.items():
        sorted_pairs = sorted(
            zip(history["exam_ids"], history["total_scores"]),
            key=lambda x: exam_map[x[0]].exam_date,
        )
        total_scores = [s for _, s in sorted_pairs]
        student_input = {
            "student_id": history["student_id"],
            "name": history["name"],
            "total_scores": total_scores,
            "subject_scores": current_scores.get(sid, {}),
        }
        alerts = analyze_risk(student_input)
        if alerts:
            risk_students.append({
                "student_id": history["student_id"],
                "student_name": history["name"],
                "student_no": history["student_no"],
                "alerts": alerts,
            })

    risk_summary = {"high": 0, "medium": 0, "low": 0}
    for rs in risk_students:
        for alert in rs["alerts"]:
            level = alert.get("risk_level", "low")
            if level in risk_summary:
                risk_summary[level] += 1

    # ---- 4. 读取 AI 配置并调用 API ----
    ai_config = await _get_ai_settings(db)
    api_key = ai_config.get("api_key", "")
    base_url = ai_config.get("base_url", "")
    model = ai_config.get("model", "")

    if not api_key or not base_url:
        return _build_fallback_report(
            cls.name, exam.name, stats, risk_summary, risk_students
        )

    prompt = _build_prompt(cls.name, exam.name, stats, risk_summary, risk_students)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "你是一位资深中学教育专家，擅长学情分析与教学改进建议。",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2048,
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return content.strip()
    except Exception:
        # 任何 API 异常都降级到模板报告
        return _build_fallback_report(
            cls.name, exam.name, stats, risk_summary, risk_students
        )
