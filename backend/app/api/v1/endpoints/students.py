from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.app.core.database import get_db
from backend.app.core.deps import get_current_user, require_staff_or_admin, require_admin
from backend.app.models.user import User, UserRole
from backend.app.models.student import StudentProfile, PlacementStatus
from backend.app.schemas.student import StudentProfileResponse, StudentProfileUpdate, compute_student_profile_completion
from backend.app.services.audit_service import log_audit_event
from backend.app.services.file_service import file_service

router = APIRouter()

@router.get("/me/profile", response_model=StudentProfileResponse)
def get_my_student_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve the current student's profile."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=400, detail="Authenticated user is not a student.")
    
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(
            user_id=current_user.id,
            student_id_number=f"STU{current_user.id:04d}",
            department="Computer Science",
            batch_year=datetime.utcnow().year + 1,
            gpa=3.5
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    res = StudentProfileResponse.from_orm(profile)
    res.completion_percentage = compute_student_profile_completion(profile, current_user)
    res.user = current_user
    return res

@router.put("/me/profile", response_model=StudentProfileResponse)
def update_my_student_profile(
    profile_in: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update current student's profile attributes."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=400, detail="Only students can update student profile.")
    
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    
    update_data = profile_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        if field in ["skills", "education", "projects", "certifications"] and val is not None:
            # Handle Pydantic models serialization if present
            if isinstance(val, list):
                val = [item.dict() if hasattr(item, "dict") else item for item in val]
        setattr(profile, field, val)

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    log_audit_event(
        db=db,
        action="UPDATE_PROFILE",
        entity_type="STUDENT_PROFILE",
        entity_id=profile.id,
        user=current_user,
        details="Student updated profile details"
    )

    res = StudentProfileResponse.from_orm(profile)
    res.completion_percentage = compute_student_profile_completion(profile, current_user)
    res.user = current_user
    return res

@router.post("/me/resume")
def upload_my_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Upload or update student PDF resume."""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=400, detail="Only students can upload a resume.")
    
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    
    file_url, original_filename, size = file_service.save_resume_file(file)
    profile.resume_url = file_url
    profile.resume_filename = original_filename
    profile.resume_updated_at = datetime.utcnow()
    db.commit()

    log_audit_event(
        db=db,
        action="UPLOAD_RESUME",
        entity_type="STUDENT_PROFILE",
        entity_id=profile.id,
        user=current_user,
        details=f"Uploaded resume {original_filename} ({size} bytes)"
    )

    return {
        "message": "Resume uploaded successfully.",
        "resume_url": file_url,
        "resume_filename": original_filename,
        "file_size": size
    }

@router.get("", response_model=List[StudentProfileResponse])
def list_students(
    search: Optional[str] = None,
    department: Optional[str] = None,
    placement_status: Optional[PlacementStatus] = None,
    min_gpa: Optional[float] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Faculty / Admin: Search and filter institutional students."""
    query = db.query(StudentProfile).join(User, StudentProfile.user_id == User.id).filter(User.deleted_at.is_(None))
    
    if search:
        query = query.filter(
            or_(
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                StudentProfile.student_id_number.ilike(f"%{search}%")
            )
        )
    if department:
        query = query.filter(StudentProfile.department == department)
    if placement_status:
        query = query.filter(StudentProfile.placement_status == placement_status)
    if min_gpa is not None:
        query = query.filter(StudentProfile.gpa >= min_gpa)

    profiles = query.order_by(desc(StudentProfile.gpa)).offset(skip).limit(limit).all()
    results = []
    for p in profiles:
        item = StudentProfileResponse.from_orm(p)
        item.completion_percentage = compute_student_profile_completion(p, p.user)
        item.user = p.user
        results.append(item)
    return results

@router.get("/{student_user_id}", response_model=StudentProfileResponse)
def get_student_by_user_id(
    student_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """View specific student profile."""
    # Only faculty, admin, or the student themselves can view
    if current_user.role not in [UserRole.ADMIN, UserRole.FACULTY] and current_user.id != student_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this student's profile.")
    
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    
    res = StudentProfileResponse.from_orm(profile)
    res.completion_percentage = compute_student_profile_completion(profile, profile.user)
    res.user = profile.user
    return res

@router.post("/{student_user_id}/deactivate")
def deactivate_student(
    student_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Student can deactivate own account; Admin can deactivate any student."""
    if current_user.role != UserRole.ADMIN and current_user.id != student_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to deactivate this account.")
    
    target_user = db.query(User).filter(User.id == student_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    target_user.is_active = False
    db.commit()
    log_audit_event(
        db=db,
        action="ACCOUNT_DEACTIVATED",
        entity_type="USER",
        entity_id=target_user.id,
        user=current_user,
        details=f"Account deactivated by {current_user.full_name}"
    )
    return {"message": "Account has been successfully deactivated."}

@router.post("/{student_user_id}/activate")
def activate_student(
    student_user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Admin: Reactivate deactivated student account."""
    target_user = db.query(User).filter(User.id == student_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    target_user.is_active = True
    db.commit()
    log_audit_event(
        db=db,
        action="ACCOUNT_ACTIVATED",
        entity_type="USER",
        entity_id=target_user.id,
        user=current_user,
        details=f"Account activated by Admin {current_user.full_name}"
    )
    return {"message": "Account has been successfully reactivated."}
