from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.models import Class, Student
from app.schemas import ClassCreate, ClassUpdate, ClassResponse

router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.get("", response_model=List[ClassResponse])
async def list_classes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Class))
    classes = result.scalars().all()

    # 实时统计每个班级的学生人数
    for cls in classes:
        count_result = await db.execute(select(Student).where(Student.class_id == cls.id))
        cls.student_count = len(count_result.scalars().all())

    return classes


@router.post("", response_model=ClassResponse)
async def create_class(data: ClassCreate, db: AsyncSession = Depends(get_db)):
    cls = Class(name=data.name, subject=data.subject, grade=data.grade, school_name=data.school_name)
    db.add(cls)
    await db.commit()
    await db.refresh(cls)
    return cls


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(class_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail="班级不存在")
    return cls


@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(class_id: int, data: ClassUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail="班级不存在")
    cls.name = data.name
    cls.subject = data.subject
    cls.grade = data.grade
    cls.school_name = data.school_name
    await db.commit()
    await db.refresh(cls)
    return cls


@router.delete("/{class_id}")
async def delete_class(class_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail="班级不存在")
    await db.delete(cls)
    await db.commit()
    return {"message": "已删除"}
