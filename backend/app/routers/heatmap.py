from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from app.database import get_db
from app.models import Exam, Score, Student, Class, ExamKnowledgeMapping, KnowledgePoint

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

    # 优先从 ExamKnowledgeMapping 读取配置的知识点
    mapping_result = await db.execute(
        select(ExamKnowledgeMapping, KnowledgePoint)
        .join(KnowledgePoint, ExamKnowledgeMapping.knowledge_point_id == KnowledgePoint.id)
        .where(ExamKnowledgeMapping.exam_id == exam_id)
    )
    mapping_rows = mapping_result.all()

    if mapping_rows:
        # 使用老师配置的知识点
        knowledge_points: List[str] = [r.KnowledgePoint.name for r in mapping_rows]
        kp_id_to_name: Dict[int, str] = {
            r.KnowledgePoint.id: r.KnowledgePoint.name for r in mapping_rows
        }
        kp_name_to_max: Dict[str, float] = {
            r.KnowledgePoint.name: r.ExamKnowledgeMapping.max_score for r in mapping_rows
        }

        students: List[str] = []
        data: List[List[float]] = []

        for score, student in rows:
            students.append(student.name)
            ss = score.subject_scores or {}
            row: List[float] = []
            for kp_name in knowledge_points:
                # 尝试从 subject_scores 中匹配知识点名称
                raw = ss.get(kp_name)
                if raw is not None:
                    max_score = kp_name_to_max.get(kp_name, 100.0)
                    mastery = min(100.0, max(0.0, float(raw) / max_score * 100))
                    row.append(round(mastery, 1))
                else:
                    # 回退到总分
                    mastery = min(100.0, max(0.0, float(score.total_score)))
                    row.append(round(mastery, 1))
            data.append(row)
    else:
        # 没有配置，从 subject_scores 的 key 自动推导（兼容旧数据）
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
                    raw = ss[kp]
                    mastery = min(100.0, max(0.0, float(raw)))
                    row.append(round(mastery, 1))
                else:
                    mastery = min(100.0, max(0.0, float(score.total_score)))
                    row.append(round(mastery, 1))
            data.append(row)

    return {
        "knowledge_points": knowledge_points,
        "students": students,
        "data": data,
    }
