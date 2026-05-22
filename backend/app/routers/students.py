from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from app.database import get_db
from app.models import Student, Score, Exam

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("/classes/{class_id}")
async def list_students(class_id: int, db: AsyncSession = Depends(get_db)):
    """返回班级学生列表，附带最近一次考试的总分和班名次"""
    result = await db.execute(
        select(Student).where(Student.class_id == class_id)
    )
    students = result.scalars().all()

    data = []
    for student in students:
        latest_score_result = await db.execute(
            select(Score, Exam)
            .join(Exam, Score.exam_id == Exam.id)
            .where(Score.student_id == student.id)
            .order_by(Exam.exam_date.desc())
            .limit(1)
        )
        row = latest_score_result.first()
        latest_total_score = None
        latest_class_rank = None
        if row:
            score, exam = row
            latest_total_score = score.total_score
            latest_class_rank = score.class_rank

        data.append({
            "id": student.id,
            "name": student.name,
            "student_no": student.student_no,
            "latest_total_score": latest_total_score,
            "latest_class_rank": latest_class_rank,
        })

    return data


@router.get("/{student_id}/profile")
async def student_profile(student_id: int, db: AsyncSession = Depends(get_db)):
    """返回学生个人画像：基本信息、成绩趋势、学科雷达、薄弱点"""
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")

    result = await db.execute(
        select(Score, Exam)
        .join(Exam, Score.exam_id == Exam.id)
        .where(Score.student_id == student_id)
        .order_by(Exam.exam_date.asc())
    )
    rows = result.all()

    trend = []
    subject_radar: Dict[str, float] = {}
    weak_points: List[str] = []

    for score, exam in rows:
        trend.append({
            "exam_name": exam.name,
            "total_score": score.total_score,
            "class_rank": score.class_rank,
        })

    # 用最新一次考试的 subject_scores 做雷达图和薄弱点
    if rows:
        latest_score, _ = rows[-1]
        subject_scores = latest_score.subject_scores or {}
        for subject, s in subject_scores.items():
            if isinstance(s, (int, float)):
                subject_radar[subject] = float(s)
                if float(s) < 70:
                    weak_points.append(subject)

    return {
        "student": {
            "name": student.name,
            "student_no": student.student_no,
        },
        "trend": trend,
        "subject_radar": subject_radar,
        "weak_points": weak_points,
    }
