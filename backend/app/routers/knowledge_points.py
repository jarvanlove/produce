from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models import KnowledgePoint, ExamKnowledgeMapping

router = APIRouter(prefix="/api/knowledge-points", tags=["knowledge_points"])


@router.get("/classes/{class_id}")
async def list_knowledge_points(class_id: int, db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """获取班级的知识点列表（树形扁平列表）。"""
    result = await db.execute(
        select(KnowledgePoint).where(KnowledgePoint.class_id == class_id).order_by(KnowledgePoint.id)
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "class_id": r.class_id,
            "name": r.name,
            "parent_id": r.parent_id,
            "weight": r.weight,
        }
        for r in rows
    ]


@router.post("")
async def create_knowledge_point(
    body: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """创建知识点。"""
    kp = KnowledgePoint(
        class_id=body["class_id"],
        name=body["name"],
        parent_id=body.get("parent_id"),
        weight=body.get("weight", 1.0),
    )
    db.add(kp)
    await db.commit()
    await db.refresh(kp)
    return {
        "id": kp.id,
        "class_id": kp.class_id,
        "name": kp.name,
        "parent_id": kp.parent_id,
        "weight": kp.weight,
    }


@router.put("/{kp_id}")
async def update_knowledge_point(
    kp_id: int,
    body: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """修改知识点。"""
    result = await db.execute(select(KnowledgePoint).where(KnowledgePoint.id == kp_id))
    kp = result.scalar_one_or_none()
    if not kp:
        raise HTTPException(status_code=404, detail="知识点不存在")
    kp.name = body.get("name", kp.name)
    kp.parent_id = body.get("parent_id", kp.parent_id)
    kp.weight = body.get("weight", kp.weight)
    await db.commit()
    await db.refresh(kp)
    return {
        "id": kp.id,
        "class_id": kp.class_id,
        "name": kp.name,
        "parent_id": kp.parent_id,
        "weight": kp.weight,
    }


@router.delete("/{kp_id}")
async def delete_knowledge_point(kp_id: int, db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    """删除知识点。"""
    result = await db.execute(select(KnowledgePoint).where(KnowledgePoint.id == kp_id))
    kp = result.scalar_one_or_none()
    if not kp:
        raise HTTPException(status_code=404, detail="知识点不存在")
    await db.delete(kp)
    await db.commit()
    return {"message": "已删除"}


@router.get("/classes/{class_id}/exams/{exam_id}/mapping")
async def get_exam_knowledge_mapping(
    class_id: int, exam_id: int, db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """获取考试关联的知识点列表。"""
    result = await db.execute(
        select(ExamKnowledgeMapping, KnowledgePoint)
        .join(KnowledgePoint, ExamKnowledgeMapping.knowledge_point_id == KnowledgePoint.id)
        .where(ExamKnowledgeMapping.exam_id == exam_id)
    )
    rows = result.all()
    return [
        {
            "mapping_id": r.ExamKnowledgeMapping.id,
            "knowledge_point_id": r.KnowledgePoint.id,
            "name": r.KnowledgePoint.name,
            "max_score": r.ExamKnowledgeMapping.max_score,
        }
        for r in rows
    ]


@router.post("/classes/{class_id}/exams/{exam_id}/mapping")
async def set_exam_knowledge_mapping(
    class_id: int,
    exam_id: int,
    body: List[Dict[str, Any]],
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    """设置考试关联的知识点（覆盖式）。"""
    # 删除旧映射
    old = await db.execute(
        select(ExamKnowledgeMapping).where(ExamKnowledgeMapping.exam_id == exam_id)
    )
    for row in old.scalars().all():
        await db.delete(row)

    # 创建新映射
    for item in body:
        mapping = ExamKnowledgeMapping(
            exam_id=exam_id,
            knowledge_point_id=item["knowledge_point_id"],
            max_score=item.get("max_score", 100.0),
        )
        db.add(mapping)

    await db.commit()
    return {"message": "关联已更新"}
