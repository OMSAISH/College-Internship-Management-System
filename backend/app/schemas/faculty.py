from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from backend.app.schemas.user import UserResponse

class FacultyProfileBase(BaseModel):
    employee_id: str
    department: str
    designation: str
    cabin_location: Optional[str] = None

class FacultyProfileCreate(FacultyProfileBase):
    pass

class FacultyProfileUpdate(BaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None
    cabin_location: Optional[str] = None

class FacultyProfileResponse(FacultyProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True
