from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from backend.app.models.notification import NotificationCategory

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    category: NotificationCategory
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationMarkRead(BaseModel):
    is_read: bool = True
