from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.evaluation import HiringRecommendation

class EvaluationBase(BaseModel):
    technical_score: int = Field(..., ge=1, le=5)
    communication_score: int = Field(..., ge=1, le=5)
    problem_solving_score: int = Field(..., ge=1, le=5)
    teamwork_score: int = Field(..., ge=1, le=5)
    punctuality_score: int = Field(..., ge=1, le=5)
    responsibility_score: int = Field(..., ge=1, le=5)
    learning_ability_score: int = Field(..., ge=1, le=5)
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    comments: Optional[str] = None
    hiring_recommendation: HiringRecommendation = HiringRecommendation.RECOMMEND

class EvaluationCreate(EvaluationBase):
    application_id: int

class EvaluationUpdate(BaseModel):
    technical_score: Optional[int] = Field(None, ge=1, le=5)
    communication_score: Optional[int] = Field(None, ge=1, le=5)
    problem_solving_score: Optional[int] = Field(None, ge=1, le=5)
    teamwork_score: Optional[int] = Field(None, ge=1, le=5)
    punctuality_score: Optional[int] = Field(None, ge=1, le=5)
    responsibility_score: Optional[int] = Field(None, ge=1, le=5)
    learning_ability_score: Optional[int] = Field(None, ge=1, le=5)
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    comments: Optional[str] = None
    hiring_recommendation: Optional[HiringRecommendation] = None
    is_archived: Optional[bool] = None

class EvaluationResponse(EvaluationBase):
    id: int
    application_id: int
    internship_id: int
    student_id: int
    evaluator_user_id: Optional[int] = None
    overall_score: float
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    # Additional display properties
    student_name: Optional[str] = None
    internship_title: Optional[str] = None
    company_name: Optional[str] = None
    evaluator_name: Optional[str] = None

    class Config:
        from_attributes = True

def compute_overall_evaluation_score(criteria: EvaluationBase) -> float:
    scores = [
        criteria.technical_score,
        criteria.communication_score,
        criteria.problem_solving_score,
        criteria.teamwork_score,
        criteria.punctuality_score,
        criteria.responsibility_score,
        criteria.learning_ability_score
    ]
    return round(sum(scores) / len(scores), 2)
