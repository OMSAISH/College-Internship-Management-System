from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.application import ApplicationStatus
from backend.app.schemas.user import UserResponse
from backend.app.schemas.internship import InternshipResponse

class ApplicationTimelineResponse(BaseModel):
    id: int
    application_id: int
    status: ApplicationStatus
    comment: Optional[str] = None
    changed_by_user_id: Optional[int] = None
    changed_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationDocumentResponse(BaseModel):
    id: int
    document_type: str
    file_url: str
    file_name: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    internship_id: int
    resume_url: str = Field(..., min_length=5)
    cover_letter: str = Field(..., min_length=20)
    qualifications: Dict[str, Any] = {}

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    comment: Optional[str] = None
    faculty_notes: Optional[str] = None
    faculty_rating: Optional[int] = Field(None, ge=1, le=5)

class ApplicationWithdraw(BaseModel):
    reason: str = Field(..., min_length=5)

class ApplicationResponse(BaseModel):
    id: int
    internship_id: int
    student_id: int
    resume_url: str
    cover_letter: str
    qualifications: Dict[str, Any]
    status: ApplicationStatus
    faculty_notes: Optional[str] = None
    faculty_rating: Optional[int] = None
    withdrawn_reason: Optional[str] = None
    applied_at: datetime
    updated_at: datetime
    internship: Optional[InternshipResponse] = None
    student: Optional[UserResponse] = None
    timeline: List[ApplicationTimelineResponse] = []
    documents: List[ApplicationDocumentResponse] = []

    class Config:
        from_attributes = True
