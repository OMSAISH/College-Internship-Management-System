from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum as SAEnum, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class PlacementStatus(str, enum.Enum):
    NOT_PLACED = "NOT_PLACED"
    PLACED = "PLACED"
    OPTED_OUT = "OPTED_OUT"

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    student_id_number = Column(String(50), unique=True, nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    batch_year = Column(Integer, nullable=False)
    gpa = Column(Float, nullable=False, default=0.0)
    bio = Column(Text, nullable=True)
    
    # Resume & Social
    resume_url = Column(String(500), nullable=True)
    resume_filename = Column(String(255), nullable=True)
    resume_updated_at = Column(DateTime, nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    github_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)

    # Rich Profile Data (Structured JSON)
    skills = Column(JSON, default=list)            # List[str] e.g. ["Python", "FastAPI", "React"]
    education = Column(JSON, default=list)         # List[dict] degree, institution, start_year, end_year, gpa
    projects = Column(JSON, default=list)          # List[dict] title, description, tech_stack, github_url
    certifications = Column(JSON, default=list)    # List[dict] name, issuer, issue_date, credential_url
    
    placement_status = Column(SAEnum(PlacementStatus), default=PlacementStatus.NOT_PLACED, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    user = relationship("User", back_populates="student_profile")
