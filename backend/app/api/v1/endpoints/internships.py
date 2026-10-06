from typing import Any, List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user, get_optional_current_user, require_staff_or_admin, require_admin
from backend.app.models.user import User, UserRole
from backend.app.models.internship import Internship, WorkMode, InternshipStatus
from backend.app.models.company import Company
from backend.app.models.bookmark import Bookmark
from backend.app.schemas.internship import InternshipCreate, InternshipUpdate, InternshipResponse
from backend.app.schemas.company import CompanyResponse
from backend.app.services.audit_service import log_audit_event
from backend.app.services.notification_service import create_notification
from backend.app.models.notification import NotificationCategory

router = APIRouter()

@router.get("", response_model=List[InternshipResponse])
def list_internships(
    search: Optional[str] = None,
    domain: Optional[str] = None,
    location: Optional[str] = None,
    work_mode: Optional[WorkMode] = None,
    min_stipend: Optional[float] = None,
    duration_weeks: Optional[int] = None,
    company_id: Optional[int] = None,
    status_filter: Optional[InternshipStatus] = None,
    is_featured: Optional[bool] = None,
    sort_by: str = "newest",  # newest, stipend_high, deadline_soon
    skip: int = 0,
    limit: int = 50,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Discover internships with full-text search and multi-facet filtering."""
    query = db.query(Internship).join(Company, Internship.company_id == Company.id)

    # If student or unauthenticated, only show APPROVED non-archived non-expired
    is_staff = current_user and current_user.role in [UserRole.ADMIN, UserRole.FACULTY]
    if not is_staff:
        query = query.filter(
            Internship.status == InternshipStatus.APPROVED,
            Company.is_archived == False
        )
    elif status_filter:
        query = query.filter(Internship.status == status_filter)

    if search:
        query = query.filter(
            or_(
                Internship.title.ilike(f"%{search}%"),
                Internship.description.ilike(f"%{search}%"),
                Company.name.ilike(f"%{search}%"),
                Internship.domain.ilike(f"%{search}%")
            )
        )
    if domain:
        query = query.filter(Internship.domain == domain)
    if location:
        query = query.filter(Internship.location.ilike(f"%{location}%"))
    if work_mode:
        query = query.filter(Internship.work_mode == work_mode)
    if min_stipend is not None:
        query = query.filter(Internship.stipend_amount >= min_stipend)
    if duration_weeks is not None:
        query = query.filter(Internship.duration_weeks <= duration_weeks)
    if company_id:
        query = query.filter(Internship.company_id == company_id)
    if is_featured is not None:
        query = query.filter(Internship.is_featured == is_featured)

    # Sorting
    if sort_by == "stipend_high":
        query = query.order_by(desc(Internship.stipend_amount))
    elif sort_by == "deadline_soon":
        query = query.order_by(asc(Internship.application_deadline))
    else:
        query = query.order_by(desc(Internship.created_at))

    internships = query.offset(skip).limit(limit).all()

    # Get bookmarks for current user if student
    user_bookmarks = set()
    if current_user:
        bms = db.query(Bookmark.internship_id).filter(Bookmark.user_id == current_user.id).all()
        user_bookmarks = {b[0] for b in bms}

    results = []
    for i in internships:
        item = InternshipResponse.from_orm(i)
        if i.company:
            c_resp = CompanyResponse.from_orm(i.company)
            c_resp.average_rating = i.company.average_rating
            item.company = c_resp
        item.applications_count = len(i.applications)
        item.is_bookmarked = (i.id in user_bookmarks)
        results.append(item)
    return results

@router.get("/domains", response_model=List[str])
def list_available_domains(db: Session = Depends(get_db)) -> Any:
    """Return unique domain categories."""
    domains = db.query(Internship.domain).distinct().all()
    return sorted([d[0] for d in domains if d[0]])

@router.get("/bookmarks/my", response_model=List[InternshipResponse])
def get_my_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List internships bookmarked by the logged-in student."""
    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == current_user.id).all()
    results = []
    for b in bookmarks:
        i = b.internship
        if i:
            item = InternshipResponse.from_orm(i)
            if i.company:
                c_resp = CompanyResponse.from_orm(i.company)
                c_resp.average_rating = i.company.average_rating
                item.company = c_resp
            item.applications_count = len(i.applications)
            item.is_bookmarked = True
            results.append(item)
    return results

@router.get("/{internship_id}", response_model=InternshipResponse)
def get_internship_detail(
    internship_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get full details of a specific internship posting."""
    internship = db.query(Internship).filter(Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship opportunity not found.")
    
    item = InternshipResponse.from_orm(internship)
    if internship.company:
        c_resp = CompanyResponse.from_orm(internship.company)
        c_resp.average_rating = internship.company.average_rating
        item.company = c_resp
    item.applications_count = len(internship.applications)
    
    if current_user:
        bm = db.query(Bookmark).filter(Bookmark.user_id == current_user.id, Bookmark.internship_id == internship_id).first()
        item.is_bookmarked = (bm is not None)
    else:
        item.is_bookmarked = False

    return item

@router.post("", response_model=InternshipResponse, status_code=status.HTTP_201_CREATED)
def create_internship(
    internship_in: InternshipCreate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Create a new internship opportunity."""
    company = db.query(Company).filter(Company.id == internship_in.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Selected company does not exist.")

    # Admins postings are directly APPROVED, faculty postings can be auto-approved or pending
    init_status = InternshipStatus.APPROVED if current_user.role == UserRole.ADMIN else InternshipStatus.APPROVED

    internship = Internship(
        company_id=internship_in.company_id,
        posted_by_user_id=current_user.id,
        title=internship_in.title,
        domain=internship_in.domain,
        description=internship_in.description,
        responsibilities=internship_in.responsibilities,
        requirements=internship_in.requirements,
        eligibility_criteria=internship_in.eligibility_criteria,
        benefits=internship_in.benefits,
        location=internship_in.location,
        work_mode=internship_in.work_mode,
        stipend_amount=internship_in.stipend_amount,
        stipend_currency=internship_in.stipend_currency,
        duration_weeks=internship_in.duration_weeks,
        openings=internship_in.openings,
        start_date=internship_in.start_date,
        end_date=internship_in.end_date,
        application_deadline=internship_in.application_deadline,
        skills_required=internship_in.skills_required,
        is_featured=internship_in.is_featured,
        status=init_status
    )
    db.add(internship)
    db.commit()
    db.refresh(internship)

    log_audit_event(
        db=db,
        action="CREATE_INTERNSHIP",
        entity_type="INTERNSHIP",
        entity_id=internship.id,
        user=current_user,
        details=f"Created internship '{internship.title}' at {company.name}"
    )

    item = InternshipResponse.from_orm(internship)
    item.company = CompanyResponse.from_orm(company)
    return item

@router.put("/{internship_id}", response_model=InternshipResponse)
def update_internship(
    internship_id: int,
    internship_in: InternshipUpdate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Update internship posting."""
    internship = db.query(Internship).filter(Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found.")

    for field, val in internship_in.dict(exclude_unset=True).items():
        setattr(internship, field, val)

    internship.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(internship)

    log_audit_event(
        db=db,
        action="UPDATE_INTERNSHIP",
        entity_type="INTERNSHIP",
        entity_id=internship.id,
        user=current_user,
        details=f"Updated internship '{internship.title}'"
    )

    item = InternshipResponse.from_orm(internship)
    if internship.company:
        item.company = CompanyResponse.from_orm(internship.company)
    return item

@router.post("/{internship_id}/approve")
def approve_internship(
    internship_id: int,
    approve: bool = True,
    notes: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Admin workflow: Approve or Reject internship posting."""
    internship = db.query(Internship).filter(Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found.")

    internship.status = InternshipStatus.APPROVED if approve else InternshipStatus.REJECTED
    internship.approval_notes = notes
    db.commit()

    log_audit_event(
        db=db,
        action="APPROVE_INTERNSHIP" if approve else "REJECT_INTERNSHIP",
        entity_type="INTERNSHIP",
        entity_id=internship.id,
        user=current_user,
        details=f"Status changed to {internship.status.value}"
    )

    return {"message": f"Internship posting has been {internship.status.value.lower()}.", "status": internship.status.value}

@router.post("/{internship_id}/bookmark")
def toggle_bookmark(
    internship_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Toggle bookmark / save status for an internship."""
    bm = db.query(Bookmark).filter(Bookmark.user_id == current_user.id, Bookmark.internship_id == internship_id).first()
    if bm:
        db.delete(bm)
        db.commit()
        return {"bookmarked": False, "message": "Internship removed from saved list."}
    else:
        new_bm = Bookmark(user_id=current_user.id, internship_id=internship_id)
        db.add(new_bm)
        db.commit()
        return {"bookmarked": True, "message": "Internship added to saved list."}
