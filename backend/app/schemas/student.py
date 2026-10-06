from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from backend.app.models.student import PlacementStatus
from backend.app.schemas.user import UserResponse

class EducationItem(BaseModel):
    degree: str
    institution: str
    start_year: int
    end_year: Optional[int] = None
    gpa: Optional[float] = None

class ProjectItem(BaseModel):
    title: str
    description: str
    tech_stack: List[str] = []
    github_url: Optional[str] = None
    live_url: Optional[str] = None

class CertificationItem(BaseModel):
    name: str
    issuer: str
    issue_date: Optional[str] = None
    credential_url: Optional[str] = None

class StudentProfileBase(BaseModel):
    student_id_number: str
    department: str
    batch_year: int
    gpa: float = Field(..., ge=0.0, le=4.0)
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: List[str] = []
    education: List[EducationItem] = []
    projects: List[ProjectItem] = []
    certifications: List[CertificationItem] = []

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileUpdate(BaseModel):
    department: Optional[str] = None
    batch_year: Optional[int] = None
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: Optional[List[str]] = None
    education: Optional[List[EducationItem]] = None
    projects: Optional[List[ProjectItem]] = None
    certifications: Optional[List[CertificationItem]] = None
    placement_status: Optional[PlacementStatus] = None

class StudentProfileResponse(StudentProfileBase):
    id: int
    user_id: int
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_updated_at: Optional[datetime] = None
    placement_status: PlacementStatus
    completion_percentage: Optional[int] = 0
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

def compute_student_profile_completion(profile: Any, user: Any) -> int:
    score = 0
    total = 10
    if user.first_name and user.last_name: score += 1
    if user.email: score += 1
    if user.phone: score += 1
    if profile.student_id_number: score += 1
    if profile.department: score += 1
    if profile.gpa and profile.gpa > 0: score += 1
    if profile.resume_url: score += 2
    if profile.skills and len(profile.skills) > 0: score += 1
    if profile.bio: score += 1
    return int((score / total) * 100)
