from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class ApplicationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SHORTLISTED = "SHORTLISTED"
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("internship_id", "student_id", name="uq_student_internship_application"),
    )

    id = Column(Integer, primary_key=True, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    resume_url = Column(String(500), nullable=False)
    cover_letter = Column(Text, nullable=False)
    qualifications = Column(JSON, default=dict)
    
    status = Column(SAEnum(ApplicationStatus), nullable=False, default=ApplicationStatus.PENDING, index=True)
    faculty_notes = Column(Text, nullable=True)
    faculty_rating = Column(Integer, nullable=True)
    withdrawn_reason = Column(Text, nullable=True)
    
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    internship = relationship("Internship", back_populates="applications")
    student = relationship("User", back_populates="applications", foreign_keys=[student_id])
    timeline = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationStatusHistory.created_at.asc()")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="application", cascade="all, delete-orphan")

class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SAEnum(ApplicationStatus), nullable=False)
    comment = Column(Text, nullable=True)
    changed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    application = relationship("Application", back_populates="timeline")
    changed_by = relationship("User", foreign_keys=[changed_by_user_id])

class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False, default="RESUME")
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    application = relationship("Application", back_populates="documents")
