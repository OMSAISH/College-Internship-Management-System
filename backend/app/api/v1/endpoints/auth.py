from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.security import get_password_hash, verify_password, create_access_token
from backend.app.core.deps import get_current_user
from backend.app.models.user import User, UserRole
from backend.app.models.student import StudentProfile, PlacementStatus
from backend.app.models.faculty import FacultyProfile
from backend.app.schemas.user import UserCreate, UserLogin, UserResponse, Token, PasswordChangeRequest
from backend.app.services.audit_service import log_audit_event
from backend.app.services.email_service import email_service

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Register a new student or faculty member."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists in the system."
        )
    
    # Create user
    user = User(
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone,
        role=user_in.role,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize empty profile based on role
    if user.role == UserRole.STUDENT:
        student_id_code = f"STU{datetime.utcnow().year}{user.id:04d}"
        profile = StudentProfile(
            user_id=user.id,
            student_id_number=student_id_code,
            department="Computer Science",
            batch_year=datetime.utcnow().year + 1,
            gpa=3.5,
            placement_status=PlacementStatus.NOT_PLACED
        )
        db.add(profile)
        db.commit()
    elif user.role == UserRole.FACULTY:
        emp_code = f"FAC{datetime.utcnow().year}{user.id:03d}"
        f_profile = FacultyProfile(
            user_id=user.id,
            employee_id=emp_code,
            department="Engineering & Technology",
            designation="Assistant Professor & Internship Mentor"
        )
        db.add(f_profile)
        db.commit()

    # Log audit event
    client_ip = request.client.host if request.client else None
    log_audit_event(
        db=db,
        action="USER_REGISTRATION",
        entity_type="USER",
        entity_id=user.id,
        user=user,
        details=f"User registered with role {user.role.value}",
        ip_address=client_ip
    )

    # Send welcome email notification
    email_service.send_email(
        to_email=user.email,
        subject="Welcome to College Internship Management System",
        template_name="welcome",
        context={"name": user.full_name, "role": user.role.value}
    )

    return user

@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Authenticate user with email and password and return access token."""
    user = db.query(User).filter(User.email == login_data.email.lower(), User.deleted_at.is_(None)).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password combination."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator."
        )

    # Issue JWT token
    access_token = create_access_token(subject=user.id)
    
    # Audit log login
    client_ip = request.client.host if request.client else None
    log_audit_event(
        db=db,
        action="LOGIN_SUCCESS",
        entity_type="USER",
        entity_id=user.id,
        user=user,
        details="User successfully authenticated",
        ip_address=client_ip
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Return the profile of the authenticated user."""
    return current_user

@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Change current user's password securely."""
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )
    if len(req.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )
    
    current_user.password_hash = get_password_hash(req.new_password)
    db.commit()
    log_audit_event(
        db=db,
        action="PASSWORD_CHANGED",
        entity_type="USER",
        entity_id=current_user.id,
        user=current_user,
        details="Password was changed successfully"
    )
    return {"message": "Password updated successfully."}

@router.post("/forgot-password")
def forgot_password(email: str, db: Session = Depends(get_db)) -> Any:
    """Send simulated password reset instruction to user's email."""
    user = db.query(User).filter(User.email == email.lower()).first()
    if user:
        email_service.send_email(
            to_email=user.email,
            subject="Password Reset Request",
            template_name="generic",
            context={"message": "You requested a password reset. Use your institutional portal or contact your coordinator."}
        )
    return {"message": "If this email is registered, password reset instructions have been sent."}
