from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
import pandas as pd

from app.database import get_db
from app.models import Exam, Score, Student, Class
from app.schemas import ExamResponse, ScoreResponse
from app.services.stats_engine import (
    calculate_class_avg,
    calculate_std_dev,
    calculate_pass_rate,
    calculate_excellent_rate,
    score_distribution,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/classes/{class_id}/exams", response_model=List[ExamResponse])
async def list_exams(class_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Exam).where(Exam.class_id == class_id))
    return result.scalars().all()


@router.get("/classes/{class_id}/exams/{exam_id}/stats")
async def exam_stats(class_id: int, exam_id: int, db: AsyncSession = Depends(get_db)):
    cls = await db.get(Class, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="班级不存在")

    exam = await db.get(Exam, exam_id)
    if not exam or exam.class_id != class_id:
        raise HTTPException(status_code=404, detail="考试不存在")

    result = await db.execute(
        select(Score).where(Score.exam_id == exam_id)
    )
    scores = result.scalars().all()
    if not scores:
        return {
            "class_name": cls.name,
            "exam_name": exam.name,
            "class_avg": 0,
            "std_dev": 0,
            "pass_rate": 0,
            "excellent_rate": 0,
            "score_distribution": [],
            "student_count": 0,
        }

    series = pd.Series([s.total_score for s in scores])
    full_score = exam.full_score if exam.full_score else None
    return {
        "class_name": cls.name,
        "exam_name": exam.name,
        "class_avg": calculate_class_avg(series),
        "std_dev": calculate_std_dev(series),
        "pass_rate": calculate_pass_rate(series, full_score),
        "excellent_rate": calculate_excellent_rate(series, full_score),
        "score_distribution": score_distribution(series, full_score),
        "student_count": len(scores),
    }


@router.get("/classes/{class_id}/exams/{exam_id}/scores", response_model=List[Dict[str, Any]])
async def exam_scores(class_id: int, exam_id: int, db: AsyncSession = Depends(get_db)):
    exam = await db.get(Exam, exam_id)
    if not exam or exam.class_id != class_id:
        raise HTTPException(status_code=404, detail="考试不存在")

    result = await db.execute(
        select(Score, Student)
        .join(Student, Score.student_id == Student.id)
        .where(Score.exam_id == exam_id)
    )
    rows = result.all()
    return [
        {
            "id": score.id,
            "student_id": student.id,
            "student_name": student.name,
            "student_no": student.student_no,
            "total_score": score.total_score,
            "class_rank": score.class_rank,
            "school_rank": score.school_rank,
            "subject_scores": score.subject_scores,
        }
        for score, student in rows
    ]
