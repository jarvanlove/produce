import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine
from app.database import Base
from app.models import User, Class, Student, Exam, Score, KnowledgePoint, RiskAlert, Report
from app.utils.security import get_password_hash
from app.config import settings


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
            username="T2024001",
            name="演示教师",
            hashed_password=get_password_hash("admin")
        )
        session.add(default_user)

        # Create sample class
        sample_class = Class(
            name="一年级1班",
            subject="数学",
            grade="一年级",
            school_name="演示学校",
            student_count=48
        )
        session.add(sample_class)

        await session.commit()
        print("数据库初始化完成")
        print("默认账号：T2024001")
        print("默认密码：admin")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init())
