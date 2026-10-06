from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class CompanyContactBase(BaseModel):
    contact_name: str
    email: str
    phone: str
    designation: str
    is_primary: bool = True

class CompanyContactCreate(CompanyContactBase):
    pass

class CompanyContactResponse(CompanyContactBase):
    id: int
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CompanyRatingBase(BaseModel):
    culture_rating: int = Field(..., ge=1, le=5)
    mentorship_rating: int = Field(..., ge=1, le=5)
    learning_rating: int = Field(..., ge=1, le=5)
    work_env_rating: int = Field(..., ge=1, le=5)
    overall_rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None

class CompanyRatingCreate(CompanyRatingBase):
    pass

class CompanyRatingResponse(CompanyRatingBase):
    id: int
    company_id: int
    student_id: int
    student_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    registration_number: str = Field(..., min_length=2, max_length=100)
    industry: str
    website: Optional[str] = None
    logo_url: Optional[str] = None
    location: str
    about: str

class CompanyCreate(CompanyBase):
    contacts: Optional[List[CompanyContactCreate]] = []

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    location: Optional[str] = None
    about: Optional[str] = None
    is_verified: Optional[bool] = None
    is_archived: Optional[bool] = None

class CompanyResponse(CompanyBase):
    id: int
    is_verified: bool
    is_archived: bool
    average_rating: float = 0.0
    active_internships_count: Optional[int] = 0
    contacts: List[CompanyContactResponse] = []
    ratings: List[CompanyRatingResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
