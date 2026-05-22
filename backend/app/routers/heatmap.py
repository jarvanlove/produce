from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from app.database import get_db
from app.models import Exam, Score, Student, Class

router = APIRouter(prefix="/api/heatmap", tags=["heatmap"])


@router.get("/classes/{class_id}/exams/{exam_id}")
async def knowledge_heatmap(
    class_id: int, exam_id: int, db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    cls = await db.get(Class, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="班级不存在")

    exam = await db.get(Exam, exam_id)
    if not exam or exam.class_id != class_id:
        raise HTTPException(status_code=404, detail="考试不存在")

    result = await db.execute(
        select(Score, Student)
        .join(Student, Score.student_id == Student.id)
        .where(Score.exam_id == exam_id)
        .order_by(Score.total_score.desc())
    )
    rows = result.all()
    if not rows:
        return {
            "knowledge_points": [],
            "students": [],
            "data": [],
        }

    # Derive knowledge points from subject_scores keys
    # Use the first row to extract subject names
    first_score = rows[0][0]
    subject_scores = first_score.subject_scores or {}
    knowledge_points = list(subject_scores.keys()) if subject_scores else ["总分"]

    students: List[str] = []
    data: List[List[float]] = []

    for score, student in rows:
        students.append(student.name)
        ss = score.subject_scores or {}
        row: List[float] = []
        for kp in knowledge_points:
            if kp in ss:
                # Normalize to 0-100 mastery rate
                raw = ss[kp]
                # Assume subject full score is around 100; if > 100 treat as is
                mastery = min(100.0, max(0.0, float(raw)))
                row.append(round(mastery, 1))
            else:
                # Fallback to total_score normalized
                mastery = min(100.0, max(0.0, float(score.total_score)))
                row.append(round(mastery, 1))
        data.append(row)

    return {
        "knowledge_points": knowledge_points,
        "students": students,
        "data": data,
    }
