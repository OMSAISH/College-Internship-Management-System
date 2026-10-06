from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.feedback import FeedbackTargetType, FeedbackStatus

class FeedbackCreate(BaseModel):
    target_type: FeedbackTargetType = FeedbackTargetType.SYSTEM
    target_id: Optional[int] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: str = Field(..., min_length=3, max_length=200)
    comment: str = Field(..., min_length=5)

class FeedbackUpdate(BaseModel):
    status: Optional[FeedbackStatus] = None
    admin_response: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    from_user_id: int
    from_user_name: Optional[str] = None
    from_user_role: Optional[str] = None
    target_type: FeedbackTargetType
    target_id: Optional[int] = None
    rating: Optional[int] = None
    title: str
    comment: str
    status: FeedbackStatus
    admin_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
