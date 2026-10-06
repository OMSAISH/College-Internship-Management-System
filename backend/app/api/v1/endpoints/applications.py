from typing import Any, List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user, require_staff_or_admin, require_student
from backend.app.models.user import User, UserRole
from backend.app.models.student import StudentProfile, PlacementStatus
from backend.app.models.internship import Internship, InternshipStatus
from backend.app.models.application import Application, ApplicationStatus, ApplicationStatusHistory, ApplicationDocument
from backend.app.schemas.application import (
    ApplicationCreate, ApplicationStatusUpdate, ApplicationWithdraw,
    ApplicationResponse, ApplicationTimelineResponse
)
from backend.app.schemas.internship import InternshipResponse
from backend.app.schemas.company import CompanyResponse
from backend.app.schemas.user import UserResponse
from backend.app.services.audit_service import log_audit_event
from backend.app.services.notification_service import create_notification
from backend.app.services.email_service import email_service
from backend.app.models.notification import NotificationCategory

router = APIRouter()

def build_application_response(app: Application) -> ApplicationResponse:
    item = ApplicationResponse.from_orm(app)
    if app.internship:
        i_resp = InternshipResponse.from_orm(app.internship)
        if app.internship.company:
            c_resp = CompanyResponse.from_orm(app.internship.company)
            c_resp.average_rating = app.internship.company.average_rating
            i_resp.company = c_resp
        item.internship = i_resp
    if app.student:
        item.student = UserResponse.from_orm(app.student)
    
    # Map timeline items
    t_items = []
    for t in app.timeline:
        t_res = ApplicationTimelineResponse.from_orm(t)
        if t.changed_by:
            t_res.changed_by_name = t.changed_by.full_name
        t_items.append(t_res)
    item.timeline = t_items
    return item

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def submit_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
) -> Any:
    """Student multi-step application submission with full business rule validation."""
    # 1. Check internship exists and is open
    internship = db.query(Internship).filter(Internship.id == app_in.internship_id).first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship opportunity not found.")
    
    if internship.status != InternshipStatus.APPROVED:
        raise HTTPException(status_code=400, detail="This internship is not actively accepting applications.")

    # 2. Check application deadline
    today = date.today()
    if internship.application_deadline < today:
        raise HTTPException(
            status_code=400,
            detail=f"The application deadline for this internship passed on {internship.application_deadline}."
        )

    # 3. Check duplicate application
    existing = db.query(Application).filter(
        Application.internship_id == app_in.internship_id,
        Application.student_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already submitted an application for this internship."
        )

    # 4. Create application
    application = Application(
        internship_id=app_in.internship_id,
        student_id=current_user.id,
        resume_url=app_in.resume_url,
        cover_letter=app_in.cover_letter,
        qualifications=app_in.qualifications,
        status=ApplicationStatus.PENDING
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # 5. Record initial timeline entry
    history = ApplicationStatusHistory(
        application_id=application.id,
        status=ApplicationStatus.PENDING,
        comment="Application submitted by candidate",
        changed_by_user_id=current_user.id
    )
    db.add(history)

    # 6. Add document record
    doc = ApplicationDocument(
        application_id=application.id,
        document_type="RESUME",
        file_url=app_in.resume_url,
        file_name=app_in.resume_url.split("/")[-1],
        file_size=1024 * 150
    )
    db.add(doc)
    db.commit()
    db.refresh(application)

    # 7. Audit log & notifications
    log_audit_event(
        db=db,
        action="APPLICATION_SUBMITTED",
        entity_type="APPLICATION",
        entity_id=application.id,
        user=current_user,
        details=f"Applied for {internship.title} at {internship.company.name}"
    )

    create_notification(
        db=db,
        user_id=current_user.id,
        title="Application Submitted Successfully",
        message=f"Your application for {internship.title} has been received and is under review.",
        category=NotificationCategory.APPLICATION,
        link=f"/student/applications"
    )

    # If internship has a coordinator/poster, notify them
    if internship.posted_by_user_id:
        create_notification(
            db=db,
            user_id=internship.posted_by_user_id,
            title="New Application Received",
            message=f"{current_user.full_name} applied for {internship.title}.",
            category=NotificationCategory.APPLICATION,
            link=f"/faculty/applications"
        )

    return build_application_response(application)

@router.get("/my", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve all applications submitted by the current student."""
    applications = db.query(Application).filter(
        Application.student_id == current_user.id
    ).order_by(desc(Application.applied_at)).all()
    
    return [build_application_response(a) for a in applications]

@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    internship_id: Optional[int] = None,
    status_filter: Optional[ApplicationStatus] = None,
    student_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Faculty / Admin: List and review candidate applications with comprehensive filters."""
    query = db.query(Application).join(User, Application.student_id == User.id).join(Internship, Application.internship_id == Internship.id)

    if internship_id:
        query = query.filter(Application.internship_id == internship_id)
    if status_filter:
        query = query.filter(Application.status == status_filter)
    if student_id:
        query = query.filter(Application.student_id == student_id)
    if search:
        query = query.filter(
            or_(
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                Internship.title.ilike(f"%{search}%")
            )
        )

    applications = query.order_by(desc(Application.applied_at)).offset(skip).limit(limit).all()
    return [build_application_response(a) for a in applications]

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application_details(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve full details of an application including history and documents."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    
    is_staff = current_user.role in [UserRole.ADMIN, UserRole.FACULTY]
    if not is_staff and app.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this application.")

    return build_application_response(app)

@router.put("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """State machine transition for application status (Shortlist, Reject, Accept, etc.)."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    old_status = app.status
    new_status = status_update.status

    # State Machine Validation
    if old_status == ApplicationStatus.WITHDRAWN and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=400,
            detail="Withdrawn applications cannot be modified unless restored by an institutional administrator."
        )

    app.status = new_status
    if status_update.faculty_notes:
        app.faculty_notes = status_update.faculty_notes
    if status_update.faculty_rating:
        app.faculty_rating = status_update.faculty_rating
    app.updated_at = datetime.utcnow()

    # Timeline entry
    comment = status_update.comment or f"Status updated from {old_status.value} to {new_status.value}"
    history = ApplicationStatusHistory(
        application_id=app.id,
        status=new_status,
        comment=comment,
        changed_by_user_id=current_user.id
    )
    db.add(history)

    # If student is ACCEPTED, update their StudentProfile placement status to PLACED!
    if new_status == ApplicationStatus.ACCEPTED:
        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == app.student_id).first()
        if student_profile:
            student_profile.placement_status = PlacementStatus.PLACED

    db.commit()
    db.refresh(app)

    # Log audit event
    log_audit_event(
        db=db,
        action="APPLICATION_STATUS_CHANGE",
        entity_type="APPLICATION",
        entity_id=app.id,
        user=current_user,
        details=f"Status changed from {old_status.value} to {new_status.value}"
    )

    # Notification & Email to student
    create_notification(
        db=db,
        user_id=app.student_id,
        title=f"Application {new_status.value}",
        message=f"Your application for {app.internship.title} is now {new_status.value}. {comment}",
        category=NotificationCategory.APPLICATION,
        link=f"/student/applications"
    )

    email_service.send_email(
        to_email=app.student.email,
        subject=f"Application Update: {new_status.value} for {app.internship.title}",
        template_name="application_status",
        context={
            "student_name": app.student.full_name,
            "internship_title": app.internship.title,
            "company_name": app.internship.company.name,
            "status": new_status.value,
            "comment": comment
        }
    )

    return build_application_response(app)

@router.post("/{application_id}/withdraw", response_model=ApplicationResponse)
def withdraw_application(
    application_id: int,
    withdraw_data: ApplicationWithdraw,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
) -> Any:
    """Student withdraws their active application."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if app.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to withdraw this application.")

    if app.status in [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED]:
        raise HTTPException(status_code=400, detail=f"Cannot withdraw an application that has already been {app.status.value.lower()}.")

    app.status = ApplicationStatus.WITHDRAWN
    app.withdrawn_reason = withdraw_data.reason
    app.updated_at = datetime.utcnow()

    history = ApplicationStatusHistory(
        application_id=app.id,
        status=ApplicationStatus.WITHDRAWN,
        comment=f"Withdrawn by student. Reason: {withdraw_data.reason}",
        changed_by_user_id=current_user.id
    )
    db.add(history)
    db.commit()
    db.refresh(app)

    log_audit_event(
        db=db,
        action="APPLICATION_WITHDRAWN",
        entity_type="APPLICATION",
        entity_id=app.id,
        user=current_user,
        details=f"Student withdrew application for {app.internship.title}"
    )

    return build_application_response(app)
