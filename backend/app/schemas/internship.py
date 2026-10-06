from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, model_validator
from backend.app.models.internship import WorkMode, InternshipStatus
from backend.app.schemas.company import CompanyResponse

class InternshipBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    domain: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10)
    responsibilities: str = Field(..., min_length=10)
    requirements: str = Field(..., min_length=10)
    eligibility_criteria: str = Field(..., min_length=10)
    benefits: str = Field(..., min_length=5)
    location: str = Field(..., min_length=2)
    work_mode: WorkMode = WorkMode.HYBRID
    stipend_amount: float = Field(0.0, ge=0.0)
    stipend_currency: str = "INR"
    duration_weeks: int = Field(..., ge=4, le=26)
    openings: int = Field(1, ge=1)
    start_date: date
    end_date: date
    application_deadline: date
    skills_required: List[str] = []
    is_featured: bool = False

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValueError("Start date must be before end date")
        if self.application_deadline and self.start_date and self.application_deadline > self.start_date:
            raise ValueError("Application deadline cannot be after internship start date")
        return self

class InternshipCreate(InternshipBase):
    company_id: int

class InternshipUpdate(BaseModel):
    title: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    eligibility_criteria: Optional[str] = None
    benefits: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[WorkMode] = None
    stipend_amount: Optional[float] = None
    stipend_currency: Optional[str] = None
    duration_weeks: Optional[int] = Field(None, ge=4, le=26)
    openings: Optional[int] = Field(None, ge=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    application_deadline: Optional[date] = None
    skills_required: Optional[List[str]] = None
    status: Optional[InternshipStatus] = None
    approval_notes: Optional[str] = None
    is_featured: Optional[bool] = None

class InternshipResponse(InternshipBase):
    id: int
    company_id: int
    posted_by_user_id: Optional[int] = None
    status: InternshipStatus
    approval_notes: Optional[str] = None
    company: Optional[CompanyResponse] = None
    applications_count: Optional[int] = 0
    is_bookmarked: Optional[bool] = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
