from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Boolean, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(32), unique=True, nullable=False)
    name = Column(String(32), nullable=False)
    hashed_password = Column(String(128), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), nullable=False)
    subject = Column(String(32), nullable=False)
    grade = Column(String(16), nullable=False)
    school_name = Column(String(128), nullable=False)
    student_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    student_no = Column(String(32), nullable=False)
    name = Column(String(32), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    name = Column(String(64), nullable=False)
    exam_date = Column(Date, nullable=False)
    full_score = Column(Integer, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    total_score = Column(Float, nullable=False)
    class_rank = Column(Integer)
    school_rank = Column(Integer)
    subject_scores = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class KnowledgePoint(Base):
    __tablename__ = "knowledge_points"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    name = Column(String(64), nullable=False)
    parent_id = Column(Integer, ForeignKey("knowledge_points.id"), nullable=True)
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    risk_type = Column(String(32), nullable=False)
    risk_level = Column(String(16), nullable=False)
    reason = Column(String(256))
    advice = Column(String(512))
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    report_type = Column(String(32), nullable=False)
    content = Column(Text)
    generated_by = Column(String(32), default="ai")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
