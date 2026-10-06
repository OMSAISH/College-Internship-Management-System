from datetime import datetime, date
import enum
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Date, ForeignKey, Float, Enum as SAEnum, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class WorkMode(str, enum.Enum):
    ON_SITE = "ON_SITE"
    REMOTE = "REMOTE"
    HYBRID = "HYBRID"

class InternshipStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"

class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    posted_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(200), nullable=False, index=True)
    domain = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    responsibilities = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    eligibility_criteria = Column(Text, nullable=False)
    benefits = Column(Text, nullable=False)
    location = Column(String(200), nullable=False)
    work_mode = Column(SAEnum(WorkMode), nullable=False, default=WorkMode.HYBRID)
    
    stipend_amount = Column(Float, nullable=False, default=0.0)
    stipend_currency = Column(String(10), nullable=False, default="INR")
    duration_weeks = Column(Integer, nullable=False)  # 4 to 26 weeks
    openings = Column(Integer, nullable=False, default=1)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    application_deadline = Column(Date, nullable=False, index=True)
    
    skills_required = Column(JSON, default=list)  # List[str]
    status = Column(SAEnum(InternshipStatus), nullable=False, default=InternshipStatus.APPROVED, index=True)
    approval_notes = Column(Text, nullable=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="internships")
    posted_by = relationship("User", foreign_keys=[posted_by_user_id])
    applications = relationship("Application", back_populates="internship", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="internship", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="internship", cascade="all, delete-orphan")
