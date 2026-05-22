from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from app.database import get_db
from app.models import Exam, Score, Student, Class
from app.services.risk_detector import analyze_risk

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.get("/classes/{class_id}/exams/{exam_id}")
async def analyze_exam_risk(class_id: int, exam_id: int, db: AsyncSession = Depends(get_db)):
    cls = await db.get(Class, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="班级不存在")

    exam = await db.get(Exam, exam_id)
    if not exam or exam.class_id != class_id:
        raise HTTPException(status_code=404, detail="考试不存在")

    # 获取该班级所有考试（用于历史趋势）
    exam_result = await db.execute(
        select(Exam).where(Exam.class_id == class_id).order_by(Exam.exam_date)
    )
    exams = exam_result.scalars().all()
    exam_ids = [e.id for e in exams]
    exam_map = {e.id: e for e in exams}

    # 获取该班级所有学生的所有成绩
    score_result = await db.execute(
        select(Score, Student)
        .join(Student, Score.student_id == Student.id)
        .where(Student.class_id == class_id)
        .where(Score.exam_id.in_(exam_ids))
    )
    rows = score_result.all()

    # 按学生聚合成绩历史
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

    # 获取当前考试的各科成绩（用于偏科检测）
    current_result = await db.execute(
        select(Score, Student)
        .join(Student, Score.student_id == Student.id)
        .where(Score.exam_id == exam_id)
    )
    current_rows = current_result.all()

    current_scores: Dict[int, Dict[str, float]] = {}
    for score, student in current_rows:
        current_scores[student.id] = score.subject_scores or {}

    # 风险分析
    risk_students = []
    for sid, history in student_history.items():
        # 按考试日期排序总分
        sorted_pairs = sorted(zip(history["exam_ids"], history["total_scores"]), key=lambda x: exam_map[x[0]].exam_date)
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

    # 统计
    summary = {"high": 0, "medium": 0, "low": 0}
    for rs in risk_students:
        for alert in rs["alerts"]:
            level = alert.get("risk_level", "low")
            if level in summary:
                summary[level] += 1

    return {
        "class_name": cls.name,
        "exam_name": exam.name,
        "summary": summary,
        "risk_students": risk_students,
        "student_count": len(current_rows),
    }
