from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class NotificationCategory(str, enum.Enum):
    APPLICATION = "APPLICATION"
    INTERVIEW = "INTERVIEW"
    EVALUATION = "EVALUATION"
    INTERNSHIP = "INTERNSHIP"
    SYSTEM = "SYSTEM"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(SAEnum(NotificationCategory), nullable=False, default=NotificationCategory.SYSTEM, index=True)
    link = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    user = relationship("User", back_populates="notifications")
