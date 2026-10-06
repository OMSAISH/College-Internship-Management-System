from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user, require_admin, require_staff_or_admin
from backend.app.models.user import User, UserRole
from backend.app.models.feedback import Feedback, FeedbackTargetType, FeedbackStatus
from backend.app.schemas.feedback import FeedbackCreate, FeedbackUpdate, FeedbackResponse
from backend.app.services.audit_service import log_audit_event

router = APIRouter()

def build_feedback_response(fb: Feedback) -> FeedbackResponse:
    resp = FeedbackResponse.from_orm(fb)
    if fb.user:
        resp.from_user_name = fb.user.full_name
        resp.from_user_role = fb.user.role.value
    return resp

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    fb_in: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Submit platform, company, or internship feedback."""
    feedback = Feedback(
        from_user_id=current_user.id,
        target_type=fb_in.target_type,
        target_id=fb_in.target_id,
        rating=fb_in.rating,
        title=fb_in.title,
        comment=fb_in.comment,
        status=FeedbackStatus.SUBMITTED
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    log_audit_event(
        db=db,
        action="SUBMIT_FEEDBACK",
        entity_type="FEEDBACK",
        entity_id=feedback.id,
        user=current_user,
        details=f"Submitted feedback on {fb_in.target_type.value}: {fb_in.title}"
    )

    return build_feedback_response(feedback)

@router.get("", response_model=List[FeedbackResponse])
def list_feedbacks(
    target_type: Optional[FeedbackTargetType] = None,
    status_filter: Optional[FeedbackStatus] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List feedback submissions."""
    query = db.query(Feedback)

    if current_user.role == UserRole.STUDENT:
        # Students only see own feedback
        query = query.filter(Feedback.from_user_id == current_user.id)
    
    if target_type:
        query = query.filter(Feedback.target_type == target_type)
    if status_filter:
        query = query.filter(Feedback.status == status_filter)

    feedbacks = query.order_by(desc(Feedback.created_at)).offset(skip).limit(limit).all()
    return [build_feedback_response(f) for f in feedbacks]

@router.put("/{feedback_id}", response_model=FeedbackResponse)
def update_feedback(
    feedback_id: int,
    fb_update: FeedbackUpdate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Admin responds to feedback and updates status."""
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback entry not found.")

    if fb_update.status:
        fb.status = fb_update.status
    if fb_update.admin_response:
        fb.admin_response = fb_update.admin_response
    fb.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(fb)

    log_audit_event(
        db=db,
        action="RESPOND_FEEDBACK",
        entity_type="FEEDBACK",
        entity_id=fb.id,
        user=current_user,
        details=f"Admin responded to feedback '{fb.title}'"
    )

    return build_feedback_response(fb)
