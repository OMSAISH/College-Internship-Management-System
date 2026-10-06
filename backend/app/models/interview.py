from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class InterviewStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    RESCHEDULED = "RESCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class InterviewResult(str, enum.Enum):
    PENDING = "PENDING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    ON_HOLD = "ON_HOLD"

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    interviewer_name = Column(String(100), nullable=False)
    interviewer_email = Column(String(255), nullable=True)
    round_name = Column(String(100), nullable=False, default="Technical Round")
    
    scheduled_at = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False, default=45)
    location_or_link = Column(String(500), nullable=False)
    
    status = Column(SAEnum(InterviewStatus), nullable=False, default=InterviewStatus.SCHEDULED, index=True)
    cancellation_reason = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    result = Column(SAEnum(InterviewResult), nullable=False, default=InterviewResult.PENDING, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="interviews")
    scheduled_by = relationship("User", foreign_keys=[scheduled_by_user_id])
