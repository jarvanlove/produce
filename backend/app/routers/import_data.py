from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import ImportResponse
from app.services.excel_parser import parse_excel

router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/excel", response_model=ImportResponse)
async def import_excel(
    file: UploadFile = File(...),
    class_id: int = Form(...),
    exam_name: str = Form(...),
    exam_date: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    result = await parse_excel(content, class_id, exam_name, exam_date, db)
    return result
