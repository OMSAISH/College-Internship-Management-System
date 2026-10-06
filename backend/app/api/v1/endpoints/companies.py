from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user, require_staff_or_admin, require_student
from backend.app.models.user import User, UserRole
from backend.app.models.company import Company, CompanyContact, CompanyRating
from backend.app.models.internship import Internship, InternshipStatus
from backend.app.schemas.company import (
    CompanyCreate, CompanyUpdate, CompanyResponse,
    CompanyContactCreate, CompanyContactResponse,
    CompanyRatingCreate, CompanyRatingResponse
)
from backend.app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("", response_model=List[CompanyResponse])
def list_companies(
    search: Optional[str] = None,
    industry: Optional[str] = None,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
) -> Any:
    """List companies with search, filter, and review averages."""
    query = db.query(Company)
    if not include_archived:
        query = query.filter(Company.is_archived == False)
    
    if search:
        query = query.filter(
            or_(
                Company.name.ilike(f"%{search}%"),
                Company.location.ilike(f"%{search}%"),
                Company.registration_number.ilike(f"%{search}%")
            )
        )
    if industry:
        query = query.filter(Company.industry == industry)

    companies = query.order_by(Company.name.asc()).offset(skip).limit(limit).all()
    results = []
    for c in companies:
        resp = CompanyResponse.from_orm(c)
        resp.average_rating = c.average_rating
        resp.active_internships_count = len([i for i in c.internships if i.status == InternshipStatus.APPROVED])
        results.append(resp)
    return results

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve detailed company profile."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")
    
    resp = CompanyResponse.from_orm(company)
    resp.average_rating = company.average_rating
    resp.active_internships_count = len([i for i in company.internships if i.status == InternshipStatus.APPROVED])
    return resp

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company_in: CompanyCreate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Add a new partner company."""
    existing = db.query(Company).filter(
        or_(
            Company.name.ilike(company_in.name),
            Company.registration_number == company_in.registration_number
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A company with this name or registration number already exists."
        )

    company = Company(
        name=company_in.name,
        registration_number=company_in.registration_number,
        industry=company_in.industry,
        website=company_in.website,
        logo_url=company_in.logo_url,
        location=company_in.location,
        about=company_in.about,
        created_by_user_id=current_user.id
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    if company_in.contacts:
        for contact_data in company_in.contacts:
            contact = CompanyContact(
                company_id=company.id,
                contact_name=contact_data.contact_name,
                email=contact_data.email,
                phone=contact_data.phone,
                designation=contact_data.designation,
                is_primary=contact_data.is_primary
            )
            db.add(contact)
        db.commit()
        db.refresh(company)

    log_audit_event(
        db=db,
        action="CREATE_COMPANY",
        entity_type="COMPANY",
        entity_id=company.id,
        user=current_user,
        details=f"Created company {company.name}"
    )

    resp = CompanyResponse.from_orm(company)
    resp.average_rating = 0.0
    resp.active_internships_count = 0
    return resp

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_in: CompanyUpdate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Update company details."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")

    for field, val in company_in.dict(exclude_unset=True).items():
        setattr(company, field, val)

    company.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(company)

    log_audit_event(
        db=db,
        action="UPDATE_COMPANY",
        entity_type="COMPANY",
        entity_id=company.id,
        user=current_user,
        details=f"Updated company {company.name}"
    )

    resp = CompanyResponse.from_orm(company)
    resp.average_rating = company.average_rating
    resp.active_internships_count = len([i for i in company.internships if i.status == InternshipStatus.APPROVED])
    return resp

@router.post("/{company_id}/archive")
def archive_company(
    company_id: int,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Archive / de-archive partner company."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")

    company.is_archived = not company.is_archived
    db.commit()

    action = "ARCHIVE_COMPANY" if company.is_archived else "UNARCHIVE_COMPANY"
    log_audit_event(
        db=db,
        action=action,
        entity_type="COMPANY",
        entity_id=company.id,
        user=current_user,
        details=f"{action} on {company.name}"
    )

    return {"message": f"Company {'archived' if company.is_archived else 'restored'} successfully.", "is_archived": company.is_archived}

@router.post("/{company_id}/ratings", response_model=CompanyRatingResponse, status_code=status.HTTP_201_CREATED)
def rate_company(
    company_id: int,
    rating_in: CompanyRatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Students can submit ratings and reviews for partner companies."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")

    rating = CompanyRating(
        company_id=company_id,
        student_id=current_user.id,
        culture_rating=rating_in.culture_rating,
        mentorship_rating=rating_in.mentorship_rating,
        learning_rating=rating_in.learning_rating,
        work_env_rating=rating_in.work_env_rating,
        overall_rating=rating_in.overall_rating,
        review=rating_in.review
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)

    resp = CompanyRatingResponse.from_orm(rating)
    resp.student_name = current_user.full_name
    return resp

@router.post("/{company_id}/contacts", response_model=CompanyContactResponse, status_code=status.HTTP_201_CREATED)
def add_company_contact(
    company_id: int,
    contact_in: CompanyContactCreate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Add a new contact person for a company."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")

    contact = CompanyContact(
        company_id=company_id,
        contact_name=contact_in.contact_name,
        email=contact_in.email,
        phone=contact_in.phone,
        designation=contact_in.designation,
        is_primary=contact_in.is_primary
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact
