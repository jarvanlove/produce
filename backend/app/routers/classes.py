from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.models import Class
from app.schemas import ClassCreate, ClassResponse

router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.get("", response_model=List[ClassResponse])
async def list_classes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Class))
    return result.scalars().all()


@router.post("", response_model=ClassResponse)
async def create_class(data: ClassCreate, db: AsyncSession = Depends(get_db)):
    cls = Class(**data.model_dump())
    db.add(cls)
    await db.commit()
    await db.refresh(cls)
    return cls


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(class_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Class).where(Class.id == class_id))
    return result.scalar_one_or_none()


@router.delete("/{class_id}")
async def delete_class(class_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    if cls:
        await db.delete(cls)
        await db.commit()
    return {"message": "已删除"}
