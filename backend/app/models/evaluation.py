from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class HiringRecommendation(str, enum.Enum):
    STRONGLY_RECOMMEND = "STRONGLY_RECOMMEND"
    RECOMMEND = "RECOMMEND"
    NEUTRAL = "NEUTRAL"
    DO_NOT_RECOMMEND = "DO_NOT_RECOMMEND"

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    evaluator_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # 7 Standardized Criteria (1-5 ratings)
    technical_score = Column(Integer, nullable=False)
    communication_score = Column(Integer, nullable=False)
    problem_solving_score = Column(Integer, nullable=False)
    teamwork_score = Column(Integer, nullable=False)
    punctuality_score = Column(Integer, nullable=False)
    responsibility_score = Column(Integer, nullable=False)
    learning_ability_score = Column(Integer, nullable=False)
    
    overall_score = Column(Float, nullable=False)
    strengths = Column(Text, nullable=True)
    areas_for_improvement = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    hiring_recommendation = Column(SAEnum(HiringRecommendation), nullable=False, default=HiringRecommendation.RECOMMEND)
    
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="evaluations")
    internship = relationship("Internship", back_populates="evaluations")
    student = relationship("User", foreign_keys=[student_id])
    evaluator = relationship("User", foreign_keys=[evaluator_user_id])
