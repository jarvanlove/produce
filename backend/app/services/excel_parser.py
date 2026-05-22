import pandas as pd
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Student, Exam, Score, Class
from app.schemas import ImportResponse


async def parse_excel(
    content: bytes,
    class_id: int,
    exam_name: str,
    exam_date: str,
    db: AsyncSession
) -> ImportResponse:
    # 验证班级存在
    cls_result = await db.execute(select(Class).where(Class.id == class_id))
    cls = cls_result.scalar_one_or_none()
    if not cls:
        return ImportResponse(imported=0, skipped=0, errors=["班级不存在"])

    df = pd.read_excel(io.BytesIO(content), header=None)

    # Skip title rows (first 2-3 rows are headers in Chinese template)
    # Find the row with column headers
    header_row = None
    for i in range(min(5, len(df))):
        row_values = df.iloc[i].astype(str).tolist()
        if "姓名" in row_values or "考号" in row_values or "学号" in row_values:
            header_row = i
            break

    if header_row is None:
        return ImportResponse(imported=0, skipped=0, errors=["无法识别表头"])

    # Parse data rows
    data_df = df.iloc[header_row + 1:].copy()
    data_df.columns = df.iloc[header_row]

    imported = 0
    errors = []

    # Create exam
    from datetime import datetime
    exam = Exam(
        class_id=class_id,
        name=exam_name,
        exam_date=datetime.strptime(exam_date, "%Y-%m-%d").date(),
    )
    db.add(exam)
    await db.flush()

    try:
        for _, row in data_df.iterrows():
            try:
                # Find name and student_no columns
                name = None
                student_no = None
                total_score = 0
                subject_scores = {}

                for col in data_df.columns:
                    col_str = str(col)
                    if col_str in ["姓名", "name", "学生姓名"]:
                        name = str(row[col]) if pd.notna(row[col]) else None
                    elif col_str in ["考号", "学号", "学籍号", "student_no"]:
                        student_no = str(row[col]) if pd.notna(row[col]) else None
                    elif col_str in ["总分", "总得分", "total", "total_score"]:
                        total_score = float(row[col]) if pd.notna(row[col]) else 0
                    elif col_str.endswith("得分") or col_str.endswith("成绩"):
                        subject_name = col_str.replace("得分", "").replace("成绩", "").strip()
                        if pd.notna(row[col]):
                            subject_scores[subject_name] = float(row[col])

                if not name or not student_no:
                    continue

                # Check if student exists
                result = await db.execute(
                    select(Student).where(
                        Student.class_id == class_id,
                        Student.student_no == student_no
                    )
                )
                student = result.scalar_one_or_none()

                if not student:
                    student = Student(
                        class_id=class_id,
                        student_no=student_no,
                        name=name
                    )
                    db.add(student)
                    await db.flush()

                # Create score
                score = Score(
                    student_id=student.id,
                    exam_id=exam.id,
                    total_score=total_score,
                    subject_scores=subject_scores
                )
                db.add(score)
                imported += 1

            except Exception as e:
                errors.append(f"行导入失败: {e}")

        if imported == 0 and len(errors) == 0:
            # 没有有效数据行，回滚并删除已创建的考试
            await db.rollback()
            return ImportResponse(imported=0, skipped=0, errors=["未找到有效学生数据"])

        await db.commit()

        # 更新班级学生人数
        result = await db.execute(select(Student).where(Student.class_id == class_id))
        student_count = len(result.scalars().all())
        cls_result = await db.execute(select(Class).where(Class.id == class_id))
        cls = cls_result.scalar_one_or_none()
        if cls:
            cls.student_count = student_count
            await db.commit()

        return ImportResponse(imported=imported, skipped=0, errors=errors)

    except Exception as e:
        await db.rollback()
        return ImportResponse(imported=0, skipped=0, errors=[f"导入失败: {e}"])
