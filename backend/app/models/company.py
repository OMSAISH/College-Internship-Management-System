from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    registration_number = Column(String(100), unique=True, nullable=False, index=True)
    industry = Column(String(100), nullable=False, index=True)
    website = Column(String(255), nullable=True)
    logo_url = Column(String(500), nullable=True)
    location = Column(String(255), nullable=False)
    about = Column(Text, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    contacts = relationship("CompanyContact", back_populates="company", cascade="all, delete-orphan")
    internships = relationship("Internship", back_populates="company", cascade="all, delete-orphan")
    ratings = relationship("CompanyRating", back_populates="company", cascade="all, delete-orphan")

    @property
    def average_rating(self) -> float:
        if not self.ratings:
            return 0.0
        return round(sum(r.overall_rating for r in self.ratings) / len(self.ratings), 1)

class CompanyContact(Base):
    __tablename__ = "company_contacts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=False)
    designation = Column(String(100), nullable=False)
    is_primary = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    company = relationship("Company", back_populates="contacts")

class CompanyRating(Base):
    __tablename__ = "company_ratings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    culture_rating = Column(Integer, nullable=False)       # 1-5
    mentorship_rating = Column(Integer, nullable=False)    # 1-5
    learning_rating = Column(Integer, nullable=False)      # 1-5
    work_env_rating = Column(Integer, nullable=False)      # 1-5
    overall_rating = Column(Integer, nullable=False)       # 1-5
    review = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="ratings")
    student = relationship("User", back_populates="company_ratings")
