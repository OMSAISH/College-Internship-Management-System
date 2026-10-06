from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.interview import InterviewStatus, InterviewResult

class InterviewBase(BaseModel):
    interviewer_name: str = Field(..., min_length=2, max_length=100)
    interviewer_email: Optional[str] = None
    round_name: str = Field(..., min_length=2, max_length=100)
    scheduled_at: datetime
    duration_minutes: int = Field(45, ge=15, le=180)
    location_or_link: str = Field(..., min_length=3)

class InterviewCreate(InterviewBase):
    application_id: int

class InterviewUpdate(BaseModel):
    interviewer_name: Optional[str] = None
    interviewer_email: Optional[str] = None
    round_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=180)
    location_or_link: Optional[str] = None
    status: Optional[InterviewStatus] = None
    cancellation_reason: Optional[str] = None
    feedback: Optional[str] = None
    result: Optional[InterviewResult] = None

class InterviewResponse(InterviewBase):
    id: int
    application_id: int
    scheduled_by_user_id: Optional[int] = None
    status: InterviewStatus
    cancellation_reason: Optional[str] = None
    feedback: Optional[str] = None
    result: InterviewResult
    created_at: datetime
    updated_at: datetime
    
    # Nested info
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    internship_title: Optional[str] = None
    company_name: Optional[str] = None

    class Config:
        from_attributes = True
