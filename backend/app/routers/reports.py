from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Report, Class, Exam
from app.schemas import ReportCreate, ReportResponse
from app.services.report_generator import generate_report
from app.services.export_service import export_to_docx, export_to_pdf

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/generate")
async def create_report(
    body: ReportCreate,
    db: AsyncSession = Depends(get_db),
):
    """生成 AI 分析报告并保存到数据库。"""
    try:
        content = await generate_report(body.class_id, body.exam_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    report = Report(
        class_id=body.class_id,
        exam_id=body.exam_id,
        report_type=body.report_type or "full",
        content=content,
        generated_by="ai",
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    return {"report_id": report.id, "status": "completed"}


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, db: AsyncSession = Depends(get_db)):
    """获取报告详情。"""
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")
    return report


@router.get("/{report_id}/export")
async def export_report(
    report_id: int,
    format: str = Query(..., description="导出格式：docx 或 pdf"),
    db: AsyncSession = Depends(get_db),
):
    """导出报告为 Word 或 PDF 格式。"""
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")

    # 获取班级和考试信息用于文件名和标题页
    cls = await db.get(Class, report.class_id)
    exam = await db.get(Exam, report.exam_id)

    class_name = cls.name if cls else None
    exam_name = exam.name if exam else None

    safe_exam_name = exam_name.replace(" ", "_") if exam_name else f"report_{report_id}"

    if format == "docx":
        buffer = export_to_docx(
            content=report.content or "",
            report_id=report_id,
            exam_name=exam_name,
            class_name=class_name,
            created_at=report.created_at,
        )
        filename = f"{safe_exam_name}_学情分析报告_{report_id}.docx"
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif format == "pdf":
        buffer = export_to_pdf(
            content=report.content or "",
            report_id=report_id,
            exam_name=exam_name,
            class_name=class_name,
            created_at=report.created_at,
        )
        filename = f"{safe_exam_name}_学情分析报告_{report_id}.pdf"
        media_type = "application/pdf"
    else:
        raise HTTPException(status_code=400, detail="不支持的导出格式，仅支持 docx 或 pdf")

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )
