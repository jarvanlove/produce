from typing import List, Dict, Any
from app.services.stats_engine import (
    detect_continuous_decline,
    detect_sharp_drop,
    detect_severe_imbalance
)


def analyze_risk(student_history: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    分析学生风险，返回风险列表

    student_history: {
        "student_id": int,
        "name": str,
        "total_scores": [85, 78, 70, 65],  # 历次总分
        "subject_scores": {"语文": 90, "数学": 60}  # 当前各科成绩
    }
    """
    alerts = []
    total_scores = student_history.get("total_scores", [])
    subject_scores = student_history.get("subject_scores", {})

    if detect_continuous_decline(total_scores):
        alerts.append({
            "risk_type": "continuous_decline",
            "risk_level": "high",
            "reason": f"连续{len(total_scores)}次考试呈下滑趋势",
            "advice": "建议立即安排一对一诊断，排查学习障碍"
        })

    if detect_sharp_drop(total_scores, threshold=10):
        alerts.append({
            "risk_type": "sharp_drop",
            "risk_level": "high",
            "reason": f"本次考试较上次大幅退步{total_scores[-2] - total_scores[-1]:.1f}分",
            "advice": "关注学习状态，排查外部干扰因素"
        })

    if detect_severe_imbalance(subject_scores):
        scores = list(subject_scores.values())
        diff = max(scores) - min(scores)
        alerts.append({
            "risk_type": "severe_imbalance",
            "risk_level": "medium",
            "reason": f"偏科严重，最高分与最低分相差{diff:.1f}分",
            "advice": "加强薄弱学科专题训练，平衡各科发展"
        })

    return alerts
