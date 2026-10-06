from typing import Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user, require_staff_or_admin
from backend.app.models.user import User, UserRole
from backend.app.models.application import Application, ApplicationStatus, ApplicationStatusHistory
from backend.app.models.interview import Interview, InterviewStatus, InterviewResult
from backend.app.schemas.interview import InterviewCreate, InterviewUpdate, InterviewResponse
from backend.app.services.audit_service import log_audit_event
from backend.app.services.notification_service import create_notification
from backend.app.services.email_service import email_service
from backend.app.models.notification import NotificationCategory

router = APIRouter()

def build_interview_response(iv: Interview) -> InterviewResponse:
    resp = InterviewResponse.from_orm(iv)
    if iv.application:
        if iv.application.student:
            resp.student_name = iv.application.student.full_name
            resp.student_email = iv.application.student.email
        if iv.application.internship:
            resp.internship_title = iv.application.internship.title
            if iv.application.internship.company:
                resp.company_name = iv.application.internship.company.name
    return resp

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def schedule_interview(
    interview_in: InterviewCreate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Schedule an interview round for an applicant."""
    app = db.query(Application).filter(Application.id == interview_in.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if app.status in [ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot schedule an interview for a {app.status.value.lower()} application."
        )

    # Validate interview date vs deadline
    if interview_in.scheduled_at.date() < app.internship.application_deadline:
        pass # allow scheduling any time before or after deadline as long as it's reasonable

    interview = Interview(
        application_id=interview_in.application_id,
        scheduled_by_user_id=current_user.id,
        interviewer_name=interview_in.interviewer_name,
        interviewer_email=interview_in.interviewer_email,
        round_name=interview_in.round_name,
        scheduled_at=interview_in.scheduled_at,
        duration_minutes=interview_in.duration_minutes,
        location_or_link=interview_in.location_or_link,
        status=InterviewStatus.SCHEDULED,
        result=InterviewResult.PENDING
    )
    db.add(interview)

    # Transition application status to INTERVIEW_SCHEDULED
    app.status = ApplicationStatus.INTERVIEW_SCHEDULED
    app.updated_at = datetime.utcnow()
    
    history = ApplicationStatusHistory(
        application_id=app.id,
        status=ApplicationStatus.INTERVIEW_SCHEDULED,
        comment=f"Interview scheduled: {interview_in.round_name} on {interview_in.scheduled_at.strftime('%b %d, %Y at %I:%M %p')}",
        changed_by_user_id=current_user.id
    )
    db.add(history)
    db.commit()
    db.refresh(interview)

    log_audit_event(
        db=db,
        action="SCHEDULE_INTERVIEW",
        entity_type="INTERVIEW",
        entity_id=interview.id,
        user=current_user,
        details=f"Scheduled {interview.round_name} for {app.student.full_name}"
    )

    # Notify student
    create_notification(
        db=db,
        user_id=app.student_id,
        title="Interview Scheduled",
        message=f"You have been scheduled for {interview.round_name} for {app.internship.title}.",
        category=NotificationCategory.INTERVIEW,
        link="/student/interviews"
    )

    email_service.send_email(
        to_email=app.student.email,
        subject=f"Interview Invitation: {interview.round_name} - {app.internship.title}",
        template_name="interview_invitation",
        context={
            "student_name": app.student.full_name,
            "internship_title": app.internship.title,
            "company_name": app.internship.company.name,
            "round_name": interview.round_name,
            "scheduled_at": interview.scheduled_at.strftime("%b %d, %Y at %I:%M %p"),
            "interviewer_name": interview.interviewer_name,
            "location": interview.location_or_link
        }
    )

    return build_interview_response(interview)

@router.get("", response_model=List[InterviewResponse])
def list_interviews(
    status_filter: Optional[InterviewStatus] = None,
    application_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List interviews for current student or coordinator calendar."""
    query = db.query(Interview).join(Application, Interview.application_id == Application.id)

    if current_user.role == UserRole.STUDENT:
        query = query.filter(Application.student_id == current_user.id)
    
    if application_id:
        query = query.filter(Interview.application_id == application_id)
    if status_filter:
        query = query.filter(Interview.status == status_filter)

    interviews = query.order_by(asc(Interview.scheduled_at)).offset(skip).limit(limit).all()
    return [build_interview_response(iv) for iv in interviews]

@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve details of a specific interview."""
    iv = db.query(Interview).filter(Interview.id == interview_id).first()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found.")
    
    if current_user.role == UserRole.STUDENT and iv.application.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this interview.")

    return build_interview_response(iv)

@router.put("/{interview_id}", response_model=InterviewResponse)
def update_or_reschedule_interview(
    interview_id: int,
    update_in: InterviewUpdate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Update or reschedule an interview."""
    iv = db.query(Interview).filter(Interview.id == interview_id).first()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found.")

    rescheduled = False
    if update_in.scheduled_at and update_in.scheduled_at != iv.scheduled_at:
        rescheduled = True
        iv.status = InterviewStatus.RESCHEDULED

    for field, val in update_in.dict(exclude_unset=True).items():
        setattr(iv, field, val)

    iv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(iv)

    log_audit_event(
        db=db,
        action="UPDATE_INTERVIEW",
        entity_type="INTERVIEW",
        entity_id=iv.id,
        user=current_user,
        details=f"Updated interview {iv.round_name}"
    )

    if rescheduled:
        create_notification(
            db=db,
            user_id=iv.application.student_id,
            title="Interview Rescheduled",
            message=f"Your {iv.round_name} has been rescheduled to {iv.scheduled_at.strftime('%b %d, %Y at %I:%M %p')}.",
            category=NotificationCategory.INTERVIEW,
            link="/student/interviews"
        )

    return build_interview_response(iv)

@router.post("/{interview_id}/complete", response_model=InterviewResponse)
def complete_interview(
    interview_id: int,
    result: InterviewResult,
    feedback: str,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Mark an interview as completed with feedback and result."""
    iv = db.query(Interview).filter(Interview.id == interview_id).first()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found.")

    iv.status = InterviewStatus.COMPLETED
    iv.result = result
    iv.feedback = feedback
    iv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(iv)

    log_audit_event(
        db=db,
        action="COMPLETE_INTERVIEW",
        entity_type="INTERVIEW",
        entity_id=iv.id,
        user=current_user,
        details=f"Marked interview {iv.round_name} as {result.value}"
    )

    create_notification(
        db=db,
        user_id=iv.application.student_id,
        title="Interview Feedback Available",
        message=f"Feedback and results for your {iv.round_name} have been published.",
        category=NotificationCategory.INTERVIEW,
        link="/student/interviews"
    )

    return build_interview_response(iv)
