import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from sqlalchemy.ext.asyncio import create_async_engine
from app.database import Base
from app.models import User, Class, Student, Exam, Score
from app.utils.security import get_password_hash
from app.config import settings


async def import_demo_data(session, class_id: int) -> int:
    """Import demo data from docs/templates/一年级.xlsx"""
    excel_path = Path(__file__).parent.parent.parent / "docs" / "templates" / "一年级.xlsx"
    if not excel_path.exists():
        print(f"演示数据文件不存在: {excel_path}")
        return 0

    df = pd.read_excel(excel_path, header=None, skiprows=4)
    df = df.dropna(how="all")

    if len(df) == 0:
        print("演示数据文件为空")
        return 0

    # Create exam
    from datetime import date
    exam = Exam(
        class_id=class_id,
        name="一年级下学期期中考试",
        exam_date=date(2026, 4, 27),
    )
    session.add(exam)
    await session.flush()

    imported = 0
    max_total_score = 0

    for _, row in df.iterrows():
        school_name = str(row[0]) if pd.notna(row[0]) else ""
        class_name = str(row[1]) if pd.notna(row[1]) else ""
        student_no = str(row[2]) if pd.notna(row[2]) else ""
        name = str(row[3]) if pd.notna(row[3]) else ""

        if not student_no or not name:
            continue

        total_score = float(row[4]) if pd.notna(row[4]) else 0
        class_rank = int(float(row[5])) if pd.notna(row[5]) else None
        school_rank = int(float(row[6])) if pd.notna(row[6]) else None

        subject_scores = {}
        if pd.notna(row[8]):
            subject_scores["语文"] = float(row[8])
        if pd.notna(row[12]):
            subject_scores["数学"] = float(row[12])

        if total_score > max_total_score:
            max_total_score = total_score

        student = Student(
            class_id=class_id,
            student_no=student_no,
            name=name,
        )
        session.add(student)
        await session.flush()

        score = Score(
            student_id=student.id,
            exam_id=exam.id,
            total_score=total_score,
            class_rank=class_rank,
            school_rank=school_rank,
            subject_scores=subject_scores,
        )
        session.add(score)
        imported += 1

    if max_total_score > 0:
        exam.full_score = int(max_total_score)
        session.add(exam)

    await session.commit()
    print(f"演示数据导入完成: {imported} 名学生, 考试: {exam.name}")
    return imported


async def init():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy.ext.asyncio import async_sessionmaker
    session_maker = async_sessionmaker(engine, expire_on_commit=False)

    async with session_maker() as session:
        # Create default user
        default_user = User(
            username="admin",
            name="管理员",
            hashed_password=get_password_hash("123456")
        )
        session.add(default_user)

        # Create sample class (will be updated from demo data)
        sample_class = Class(
            name="一年级1班",
            subject="数学",
            grade="一年级",
            school_name="王庄郎柳集小学",
            student_count=0
        )
        session.add(sample_class)
        await session.flush()

        # Import demo data
        imported = await import_demo_data(session, sample_class.id)
        if imported > 0:
            sample_class.student_count = imported
            session.add(sample_class)
            await session.commit()

        print("数据库初始化完成")
        print("默认账号：admin")
        print("默认密码：123456")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init())
