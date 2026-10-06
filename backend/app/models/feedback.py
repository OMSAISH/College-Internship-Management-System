from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class FeedbackTargetType(str, enum.Enum):
    COMPANY = "COMPANY"
    INTERNSHIP = "INTERNSHIP"
    SYSTEM = "SYSTEM"
    STUDENT = "STUDENT"

class FeedbackStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_type = Column(SAEnum(FeedbackTargetType), nullable=False, default=FeedbackTargetType.SYSTEM, index=True)
    target_id = Column(Integer, nullable=True)  # Company ID, Internship ID, or Student ID
    
    rating = Column(Integer, nullable=True)  # 1-5
    title = Column(String(200), nullable=False)
    comment = Column(Text, nullable=False)
    status = Column(SAEnum(FeedbackStatus), nullable=False, default=FeedbackStatus.SUBMITTED, index=True)
    admin_response = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    user = relationship("User", back_populates="feedbacks_submitted", foreign_keys=[from_user_id])
