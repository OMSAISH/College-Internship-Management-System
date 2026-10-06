from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user, require_admin
from backend.app.models.user import User, UserRole
from backend.app.models.faculty import FacultyProfile
from backend.app.schemas.faculty import FacultyProfileResponse, FacultyProfileUpdate

router = APIRouter()

@router.get("/me/profile", response_model=FacultyProfileResponse)
def get_my_faculty_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve the current faculty coordinator's profile."""
    if current_user.role not in [UserRole.FACULTY, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Authenticated user is not faculty/admin.")
    
    profile = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
    if not profile:
        profile = FacultyProfile(
            user_id=current_user.id,
            employee_id=f"FAC{current_user.id:04d}",
            department="Engineering & Technology",
            designation="Internship Coordinator"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    res = FacultyProfileResponse.from_orm(profile)
    res.user = current_user
    return res

@router.put("/me/profile", response_model=FacultyProfileResponse)
def update_my_faculty_profile(
    profile_in: FacultyProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update current faculty profile."""
    profile = db.query(FacultyProfile).filter(FacultyProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Faculty profile not found.")
    
    for field, val in profile_in.dict(exclude_unset=True).items():
        setattr(profile, field, val)

    db.commit()
    db.refresh(profile)

    res = FacultyProfileResponse.from_orm(profile)
    res.user = current_user
    return res

@router.get("", response_model=List[FacultyProfileResponse])
def list_faculty_members(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List all faculty members and coordinators."""
    profiles = db.query(FacultyProfile).join(User, FacultyProfile.user_id == User.id).filter(User.deleted_at.is_(None)).offset(skip).limit(limit).all()
    results = []
    for p in profiles:
        item = FacultyProfileResponse.from_orm(p)
        item.user = p.user
        results.append(item)
    return results
