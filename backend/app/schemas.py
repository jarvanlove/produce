from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import date, datetime


# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserLogin(BaseModel):
    username: str
    password: str


# Class
class ClassBase(BaseModel):
    name: str
    subject: str
    grade: str
    school_name: str


class ClassCreate(ClassBase):
    pass


class ClassResponse(ClassBase):
    id: int
    student_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# Student
class StudentBase(BaseModel):
    student_no: str
    name: str


class StudentCreate(StudentBase):
    class_id: int


class StudentResponse(StudentBase):
    id: int
    class_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Exam
class ExamBase(BaseModel):
    name: str
    exam_date: date
    full_score: int = 100


class ExamCreate(ExamBase):
    class_id: int


class ExamResponse(ExamBase):
    id: int
    class_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Score
class ScoreBase(BaseModel):
    total_score: float
    class_rank: Optional[int] = None
    school_rank: Optional[int] = None
    subject_scores: Dict[str, Any] = {}


class ScoreCreate(ScoreBase):
    student_id: int
    exam_id: int


class ScoreResponse(ScoreBase):
    id: int
    student_id: int
    exam_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Import
class ImportResponse(BaseModel):
    imported: int
    skipped: int
    errors: List[str]


# Dashboard
class DashboardData(BaseModel):
    class_avg: float
    std_dev: float
    pass_rate: float
    excellent_rate: float
    score_distribution: List[Dict[str, Any]]
    history_trend: List[Dict[str, Any]]


# Risk
class RiskSummary(BaseModel):
    high: int
    medium: int
    low: int


class RiskAlertResponse(BaseModel):
    id: int
    student_name: str
    risk_type: str
    risk_level: str
    reason: str
    advice: str
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Report
class ReportCreate(BaseModel):
    class_id: int
    exam_id: int
    report_type: str = "full"


class ReportResponse(BaseModel):
    id: int
    class_id: int
    exam_id: int
    report_type: str
    content: str
    generated_by: str
    created_at: datetime

    class Config:
        from_attributes = True
