from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user, require_staff_or_admin
from backend.app.models.user import User, UserRole
from backend.app.models.application import Application
from backend.app.models.evaluation import Evaluation
from backend.app.schemas.evaluation import EvaluationCreate, EvaluationUpdate, EvaluationResponse, compute_overall_evaluation_score
from backend.app.services.audit_service import log_audit_event
from backend.app.services.notification_service import create_notification
from backend.app.models.notification import NotificationCategory

router = APIRouter()

def build_evaluation_response(ev: Evaluation) -> EvaluationResponse:
    resp = EvaluationResponse.from_orm(ev)
    if ev.student:
        resp.student_name = ev.student.full_name
    if ev.internship:
        resp.internship_title = ev.internship.title
        if ev.internship.company:
            resp.company_name = ev.internship.company.name
    if ev.evaluator:
        resp.evaluator_name = ev.evaluator.full_name
    return resp

@router.post("", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
def submit_evaluation(
    eval_in: EvaluationCreate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Submit a structured performance evaluation with multi-criteria rubric."""
    app = db.query(Application).filter(Application.id == eval_in.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    overall = compute_overall_evaluation_score(eval_in)

    evaluation = Evaluation(
        application_id=eval_in.application_id,
        internship_id=app.internship_id,
        student_id=app.student_id,
        evaluator_user_id=current_user.id,
        technical_score=eval_in.technical_score,
        communication_score=eval_in.communication_score,
        problem_solving_score=eval_in.problem_solving_score,
        teamwork_score=eval_in.teamwork_score,
        punctuality_score=eval_in.punctuality_score,
        responsibility_score=eval_in.responsibility_score,
        learning_ability_score=eval_in.learning_ability_score,
        overall_score=overall,
        strengths=eval_in.strengths,
        areas_for_improvement=eval_in.areas_for_improvement,
        comments=eval_in.comments,
        hiring_recommendation=eval_in.hiring_recommendation
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    log_audit_event(
        db=db,
        action="SUBMIT_EVALUATION",
        entity_type="EVALUATION",
        entity_id=evaluation.id,
        user=current_user,
        details=f"Submitted evaluation for {app.student.full_name} (Score: {overall}/5.0)"
    )

    create_notification(
        db=db,
        user_id=app.student_id,
        title="Performance Evaluation Published",
        message=f"A new evaluation has been submitted for your internship application with an overall score of {overall}/5.0.",
        category=NotificationCategory.EVALUATION,
        link="/student/applications"
    )

    return build_evaluation_response(evaluation)

@router.get("", response_model=List[EvaluationResponse])
def list_evaluations(
    student_id: Optional[int] = None,
    internship_id: Optional[int] = None,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List evaluations."""
    query = db.query(Evaluation)
    if not include_archived:
        query = query.filter(Evaluation.is_archived == False)

    if current_user.role == UserRole.STUDENT:
        query = query.filter(Evaluation.student_id == current_user.id)
    else:
        if student_id:
            query = query.filter(Evaluation.student_id == student_id)
        if internship_id:
            query = query.filter(Evaluation.internship_id == internship_id)

    evals = query.order_by(desc(Evaluation.created_at)).offset(skip).limit(limit).all()
    return [build_evaluation_response(e) for e in evals]

@router.get("/{evaluation_id}", response_model=EvaluationResponse)
def get_evaluation(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve detailed evaluation."""
    e = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Evaluation record not found.")

    if current_user.role == UserRole.STUDENT and e.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this evaluation.")

    return build_evaluation_response(e)

@router.put("/{evaluation_id}", response_model=EvaluationResponse)
def update_evaluation(
    evaluation_id: int,
    update_in: EvaluationUpdate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Update evaluation details."""
    e = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Evaluation record not found.")

    for field, val in update_in.dict(exclude_unset=True).items():
        setattr(e, field, val)

    # Recompute overall score if any score changed
    scores = [
        e.technical_score, e.communication_score, e.problem_solving_score,
        e.teamwork_score, e.punctuality_score, e.responsibility_score, e.learning_ability_score
    ]
    e.overall_score = round(sum(scores) / len(scores), 2)
    e.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(e)

    log_audit_event(
        db=db,
        action="UPDATE_EVALUATION",
        entity_type="EVALUATION",
        entity_id=e.id,
        user=current_user,
        details=f"Updated evaluation for {e.student.full_name}"
    )

    return build_evaluation_response(e)

@router.post("/{evaluation_id}/archive")
def archive_evaluation(
    evaluation_id: int,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Archive / unarchive evaluation."""
    e = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Evaluation record not found.")

    e.is_archived = not e.is_archived
    db.commit()
    return {"message": f"Evaluation {'archived' if e.is_archived else 'restored'} successfully.", "is_archived": e.is_archived}
