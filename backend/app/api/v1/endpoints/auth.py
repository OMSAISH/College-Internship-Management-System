from datetime import datetime, timedelta
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.security import (
    get_password_hash,
    verify_password,
    hash_secret_token,
    generate_secure_token,
    create_temp_2fa_token,
    decode_temp_2fa_token,
    generate_totp_secret,
    encrypt_totp_secret,
    decrypt_totp_secret,
    get_totp_uri,
    generate_qr_code_data_uri,
    verify_totp_code,
    decode_refresh_token,
)
from backend.app.core.deps import get_current_user, require_admin
from backend.app.models.user import User, UserRole
from backend.app.models.student import StudentProfile, PlacementStatus
from backend.app.models.faculty import FacultyProfile
from backend.app.models.auth_security import (
    UserSession,
    SecurityEvent,
    FacultyInvitation,
)
from backend.app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    PasswordChangeRequest,
    TwoFactorRequiredResponse,
    TwoFactorLoginRequest,
    TwoFactorSetupResponse,
    TwoFactorEnableRequest,
    TwoFactorEnableResponse,
    RegenerateRecoveryCodesResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    EmailVerificationRequest,
    UserSessionResponse,
    SecurityEventResponse,
    FacultyInviteRequest,
    FacultyInviteAccept,
)
from backend.app.services.email_service import email_service
from backend.app.services.security_service import security_service

router = APIRouter()

# -------------------------------------------------------------
# 1. Real User Registration & Email Verification
# -------------------------------------------------------------

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Public registration for students with mandatory email verification and 2FA onboarding."""
    # Enforce role security: Public registration is strictly restricted to STUDENT role
    if user_in.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration is only available for students. Faculty coordinators require an institutional invitation, and administrators are provisioned securely."
        )

    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists in the system."
        )

    # Create user in unverified state
    user = User(
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone,
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=False,
        email_verified=False,
        two_factor_enabled=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize Sanjivani University Student Profile
    student_prn = f"SU{datetime.utcnow().year}CS{user.id:04d}"
    profile = StudentProfile(
        user_id=user.id,
        student_id_number=student_prn,
        department="Computer Engineering",
        batch_year=datetime.utcnow().year + 1,
        gpa=8.5,
        placement_status=PlacementStatus.NOT_PLACED
    )
    db.add(profile)
    db.commit()

    # Generate cryptographically secure verification token
    raw_token = security_service.create_verification_token(db, user.id)
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"

    # Log Security Audit Event
    security_service.record_security_event(
        db=db,
        event_type="REGISTRATION",
        user_id=user.id,
        details=f"Student account registered (PRN: {student_prn}). Verification email dispatched.",
        request=request
    )

    # Send verification email
    email_service.send_email(
        to_email=user.email,
        subject="Verify Your Sanjivani University CIMS Account",
        template_name="email_verification",
        context={
            "name": user.full_name,
            "verification_url": verification_url,
            "token": raw_token,
            "expires_in": "24 hours"
        }
    )

    return UserResponse.model_validate(user)

@router.post("/verify-email")
def verify_email(
    payload: EmailVerificationRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Verify email address using a single-use token."""
    user = security_service.verify_email_token(db, payload.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification link is invalid, expired, or has already been used."
        )

    security_service.record_security_event(
        db=db,
        event_type="EMAIL_VERIFIED",
        user_id=user.id,
        details="Email address verified successfully",
        request=request
    )

    return {
        "message": "Email verified successfully! You may now log in and configure Two-Factor Authentication.",
        "email": user.email,
        "is_verified": True
    }

@router.post("/resend-verification")
def resend_verification(
    req: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Resend a fresh email verification link."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if user and not user.email_verified:
        raw_token = security_service.create_verification_token(db, user.id)
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"
        email_service.send_email(
            to_email=user.email,
            subject="Verify Your Sanjivani University CIMS Account",
            template_name="email_verification",
            context={
                "name": user.full_name,
                "verification_url": verification_url,
                "token": raw_token,
                "expires_in": "24 hours"
            }
        )
    return {"message": "If an unverified account exists for this email, a verification link has been sent."}

# -------------------------------------------------------------
# 2. Authentication & Two-Factor Challenge
# -------------------------------------------------------------

@router.post("/login")
def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Authenticate with email and password. Returns access token or prompts for 2FA."""
    user = db.query(User).filter(User.email == login_data.email.lower(), User.deleted_at.is_(None)).first()

    # Check brute-force lockout
    if user and user.locked_until:
        if user.locked_until > datetime.utcnow():
            remaining_mins = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked due to repeated failed login attempts. Please try again in {remaining_mins} minutes."
            )
        else:
            # Lockout period expired
            user.locked_until = None
            db.commit()

    if not user or not verify_password(login_data.password, user.password_hash):
        if user:
            security_service.check_and_handle_failed_login(db, user, request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password combination."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the Training & Placement Office."
        )

    # Verify email requirement
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email address has not been verified yet. Please click the link sent to your email."
        )

    # If 2FA is enabled: return short-lived challenge ticket
    if user.two_factor_enabled:
        temp_token = create_temp_2fa_token(user.id)
        return {
            "requires_2fa": True,
            "temp_token": temp_token,
            "email": user.email,
            "message": "Enter the 6-digit verification code from your authenticator app."
        }

    # If Admin: mandatory 2FA required by policy
    if user.role == UserRole.ADMIN and not user.two_factor_enabled:
        temp_token = create_temp_2fa_token(user.id)
        return {
            "requires_2fa": False,
            "requires_2fa_setup": True,
            "temp_token": temp_token,
            "email": user.email,
            "message": "Administrator accounts require mandatory two-factor authentication setup."
        }

    # Successful standard authentication
    security_service.reset_failed_login_attempts(db, user)
    session_id, access_token, refresh_token = security_service.create_user_session(db, user.id, request)

    security_service.record_security_event(
        db=db,
        event_type="LOGIN_SUCCESS",
        user_id=user.id,
        details=f"Successful password login (Role: {user.role.value})",
        request=request
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.post("/2fa/login")
def verify_2fa_login(
    payload: TwoFactorLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Complete login using 6-digit TOTP code or single-use recovery code."""
    user_id = decode_temp_2fa_token(payload.temp_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication session expired. Please enter your email and password again."
        )

    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )

    # 1. Attempt TOTP verification
    if payload.totp_code:
        if not user.two_factor_secret_encrypted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA secret not found on account."
            )
        try:
            secret = decrypt_totp_secret(user.two_factor_secret_encrypted)
            is_valid = verify_totp_code(secret, payload.totp_code)
        except Exception:
            is_valid = False

        if not is_valid:
            security_service.record_security_event(
                db=db,
                event_type="2FA_VERIFICATION_FAILED",
                user_id=user.id,
                details="Invalid 6-digit TOTP code submitted",
                request=request
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid verification code. Please check your authenticator application."
            )

        security_service.record_security_event(
            db=db,
            event_type="2FA_VERIFIED",
            user_id=user.id,
            details="2FA successfully verified via TOTP authenticator",
            request=request
        )

    # 2. Attempt Backup / Recovery Code verification
    elif payload.recovery_code:
        consumed = security_service.verify_and_consume_recovery_code(db, user.id, payload.recovery_code)
        if not consumed:
            security_service.record_security_event(
                db=db,
                event_type="2FA_VERIFICATION_FAILED",
                user_id=user.id,
                details="Invalid or previously consumed backup recovery code submitted",
                request=request
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or already used recovery code."
            )

        security_service.record_security_event(
            db=db,
            event_type="RECOVERY_CODE_USED",
            user_id=user.id,
            details="Login authenticated using single-use backup recovery code",
            request=request
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either a 6-digit TOTP code or a backup recovery code."
        )

    # Login successful: issue session tokens
    security_service.reset_failed_login_attempts(db, user)
    session_id, access_token, refresh_token = security_service.create_user_session(db, user.id, request)

    security_service.record_security_event(
        db=db,
        event_type="LOGIN_SUCCESS",
        user_id=user.id,
        details=f"Successful 2FA login (Role: {user.role.value})",
        request=request
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

# -------------------------------------------------------------
# 3. Two-Factor Authentication Setup & Management
# -------------------------------------------------------------

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Generate TOTP secret key, otpauth URI, and QR code data URI for enrollment."""
    raw_secret = generate_totp_secret()
    encrypted_secret = encrypt_totp_secret(raw_secret)

    # Stash secret on user until verified
    current_user.two_factor_secret_encrypted = encrypted_secret
    db.commit()

    otpauth_uri = get_totp_uri(raw_secret, current_user.email)
    qr_code_data_uri = generate_qr_code_data_uri(otpauth_uri)

    return {
        "secret": raw_secret,
        "otpauth_uri": otpauth_uri,
        "qr_code_data_uri": qr_code_data_uri
    }

@router.post("/2fa/verify-and-enable", response_model=TwoFactorEnableResponse)
def verify_and_enable_2fa(
    payload: TwoFactorEnableRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Verify code from authenticator app, enable 2FA, and generate 10 one-time recovery codes."""
    if not current_user.two_factor_secret_encrypted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA enrollment has not been initiated. Please call /2fa/setup first."
        )

    raw_secret = decrypt_totp_secret(current_user.two_factor_secret_encrypted)
    if not verify_totp_code(raw_secret, payload.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please confirm the code from your authenticator application."
        )

    # Mark 2FA enabled
    current_user.two_factor_enabled = True
    db.commit()

    # Generate 10 single-use recovery codes
    recovery_codes = security_service.generate_and_store_recovery_codes(db, current_user.id)

    # Record security event
    ip, _ = security_service.get_client_info(request)
    security_service.record_security_event(
        db=db,
        event_type="2FA_ENROLLED",
        user_id=current_user.id,
        details="Two-factor authentication successfully enabled with 10 recovery codes",
        request=request
    )

    # Send confirmation email
    email_service.send_email(
        to_email=current_user.email,
        subject="Two-Factor Authentication Enabled - Sanjivani University CIMS",
        template_name="2fa_enabled",
        context={
            "name": current_user.full_name,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "ip_address": ip or "Secure Client"
        }
    )

    return {
        "message": "Two-factor authentication successfully enabled.",
        "recovery_codes": recovery_codes
    }

@router.post("/2fa/regenerate-recovery-codes", response_model=RegenerateRecoveryCodesResponse)
def regenerate_recovery_codes(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Generate 10 fresh one-time recovery codes and invalidate previous ones."""
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is not enabled on this account."
        )

    codes = security_service.generate_and_store_recovery_codes(db, current_user.id)

    security_service.record_security_event(
        db=db,
        event_type="RECOVERY_CODES_REGENERATED",
        user_id=current_user.id,
        details="Regenerated 10 fresh recovery codes. Old unused codes invalidated.",
        request=request
    )

    return {
        "message": "New recovery codes generated successfully. Store them safely.",
        "recovery_codes": codes
    }

@router.post("/2fa/disable")
def disable_2fa(
    req: PasswordChangeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Disable 2FA after password confirmation (Admins cannot disable 2FA)."""
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Two-factor authentication is mandatory for administrators and cannot be disabled."
        )

    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password confirmation."
        )

    current_user.two_factor_enabled = False
    current_user.two_factor_secret_encrypted = None
    db.commit()

    security_service.record_security_event(
        db=db,
        event_type="2FA_DISABLED",
        user_id=current_user.id,
        details="Two-factor authentication disabled by user",
        request=request
    )

    email_service.send_email(
        to_email=current_user.email,
        subject="Security Notice: Two-Factor Authentication Disabled",
        template_name="security_alert",
        context={
            "name": current_user.full_name,
            "event_title": "2FA Was Disabled",
            "event_description": "Two-factor authentication was disabled for your Sanjivani University account.",
            "action": "2FA_DISABLED",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        }
    )

    return {"message": "Two-factor authentication has been disabled."}

# -------------------------------------------------------------
# 4. Password Reset Workflow
# -------------------------------------------------------------

@router.post("/forgot-password")
def forgot_password(
    req: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Request password reset link. Returns generic response to prevent email enumeration."""
    user = db.query(User).filter(User.email == req.email.lower(), User.deleted_at.is_(None)).first()
    if user:
        raw_token = security_service.create_password_reset_token(db, user.id)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"

        security_service.record_security_event(
            db=db,
            event_type="PASSWORD_RESET_REQUESTED",
            user_id=user.id,
            details="Password reset token generated and dispatched via email",
            request=request
        )

        email_service.send_email(
            to_email=user.email,
            subject="Reset Your Sanjivani University CIMS Password",
            template_name="password_reset",
            context={
                "name": user.full_name,
                "reset_url": reset_url,
                "token": raw_token,
                "expires_in": f"{settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes"
            }
        )

    return {
        "message": "If an account exists for this email address, you will receive a secure password reset link."
    }

@router.post("/reset-password")
def reset_password(
    payload: PasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Reset password using secure token, update hash, and invalidate all existing user sessions."""
    user = security_service.verify_password_reset_token(db, payload.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link is invalid or has expired."
        )

    # Update password
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    # Invalidate token
    security_service.consume_password_reset_token(db, payload.token)

    # Invalidate all active sessions across all devices
    security_service.revoke_all_sessions(db, user.id)

    security_service.record_security_event(
        db=db,
        event_type="PASSWORD_RESET_SUCCESS",
        user_id=user.id,
        details="Password reset completed. All active sessions invalidated.",
        request=request
    )

    email_service.send_email(
        to_email=user.email,
        subject="Your Sanjivani University CIMS Password Has Been Changed",
        template_name="security_alert",
        context={
            "name": user.full_name,
            "event_title": "Password Reset Successful",
            "event_description": "Your account password was successfully reset. All previous sessions have been logged out.",
            "action": "PASSWORD_RESET",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        }
    )

    return {"message": "Your password has been reset successfully. Please log in with your new password."}

# -------------------------------------------------------------
# 5. Session Management & Device Security
# -------------------------------------------------------------

@router.get("/sessions", response_model=List[UserSessionResponse])
def get_user_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List active sessions for current user with device, IP, and timestamp."""
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.revoked_at.is_(None),
        UserSession.expires_at > datetime.utcnow()
    ).order_by(UserSession.last_used_at.desc()).all()

    current_ip, _ = security_service.get_client_info(request)

    res = []
    for s in sessions:
        res.append(UserSessionResponse(
            id=s.id,
            session_id=s.session_id,
            device_information=s.device_information,
            ip_address=s.ip_address,
            created_at=s.created_at,
            last_used_at=s.last_used_at,
            is_current=(s.ip_address == current_ip)
        ))
    return res

@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Revoke a specific device session."""
    session = db.query(UserSession).filter(
        UserSession.session_id == session_id,
        UserSession.user_id == current_user.id,
        UserSession.revoked_at.is_(None)
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    session.revoked_at = datetime.utcnow()
    db.commit()

    security_service.record_security_event(
        db=db,
        event_type="SESSION_REVOKED",
        user_id=current_user.id,
        details=f"Session {session_id} terminated",
        request=request
    )

    return {"message": "Device session terminated successfully."}

@router.post("/sessions/revoke-all")
def revoke_all_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Sign out of all devices and active sessions."""
    security_service.revoke_all_sessions(db, current_user.id)
    security_service.record_security_event(
        db=db,
        event_type="ALL_SESSIONS_REVOKED",
        user_id=current_user.id,
        details="User signed out of all devices",
        request=request
    )
    return {"message": "Successfully signed out of all devices."}

@router.get("/security-events", response_model=List[SecurityEventResponse])
def get_security_events(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """View recent security activity for current user."""
    events = db.query(SecurityEvent).filter(
        SecurityEvent.user_id == current_user.id
    ).order_by(SecurityEvent.created_at.desc()).limit(limit).all()
    return events

# -------------------------------------------------------------
# 6. Profile & Password Changes
# -------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)) -> Any:
    """Return authenticated user profile."""
    return UserResponse.model_validate(current_user)

@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Change user password securely and invalidate other active sessions."""
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )

    current_user.password_hash = get_password_hash(req.new_password)
    db.commit()

    # Invalidate other sessions
    security_service.revoke_all_sessions(db, current_user.id)

    security_service.record_security_event(
        db=db,
        event_type="PASSWORD_CHANGED",
        user_id=current_user.id,
        details="Password changed from user settings. Other sessions revoked.",
        request=request
    )

    email_service.send_email(
        to_email=current_user.email,
        subject="Security Notice: Password Changed",
        template_name="security_alert",
        context={
            "name": current_user.full_name,
            "event_title": "Password Updated",
            "event_description": "Your account password was updated from Security Settings.",
            "action": "PASSWORD_CHANGED",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        }
    )

    return {"message": "Password updated successfully. Other active sessions have been terminated."}

# -------------------------------------------------------------
# 7. Faculty Institutional Invitation Flow (Admin Only)
# -------------------------------------------------------------

@router.post("/faculty/invite")
def invite_faculty(
    payload: FacultyInviteRequest,
    request: Request,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Admin-only endpoint to securely invite a faculty member with an institutional token."""
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A user with this email already exists.")

    raw_token = generate_secure_token()
    token_hash = hash_secret_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(days=7)

    invitation = FacultyInvitation(
        email=payload.email.lower(),
        department=payload.department,
        designation=payload.designation,
        token_hash=token_hash,
        created_by_user_id=current_admin.id,
        expires_at=expires_at
    )
    db.add(invitation)
    db.commit()

    invitation_url = f"{settings.FRONTEND_URL}/accept-faculty-invite?token={raw_token}"

    email_service.send_email(
        to_email=payload.email.lower(),
        subject="Faculty Coordinator Invitation - Sanjivani University TPO",
        template_name="faculty_invitation",
        context={
            "department": payload.department,
            "designation": payload.designation,
            "invitation_url": invitation_url,
            "token": raw_token
        }
    )

    security_service.record_security_event(
        db=db,
        event_type="FACULTY_INVITED",
        user_id=current_admin.id,
        details=f"Invited faculty {payload.email} for {payload.department}",
        request=request
    )

    return {
        "message": f"Faculty invitation dispatched to {payload.email}.",
        "invitation_url": invitation_url,
        "token": raw_token
    }

@router.post("/faculty/accept")
def accept_faculty_invite(
    payload: FacultyInviteAccept,
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Accept an institutional faculty invitation, set password, and activate account."""
    token_hash = hash_secret_token(payload.token)
    invitation = db.query(FacultyInvitation).filter(
        FacultyInvitation.token_hash == token_hash,
        FacultyInvitation.accepted_at.is_(None)
    ).first()

    if not invitation or invitation.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The faculty invitation token is invalid, expired, or has already been accepted."
        )

    # Create faculty user
    user = User(
        email=invitation.email.lower(),
        password_hash=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        role=UserRole.FACULTY,
        is_active=True,
        is_verified=True,
        email_verified=True,
        email_verified_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create faculty profile
    emp_code = f"SU{datetime.utcnow().year}FAC{user.id:03d}"
    f_profile = FacultyProfile(
        user_id=user.id,
        employee_id=emp_code,
        department=invitation.department,
        designation=invitation.designation
    )
    db.add(f_profile)

    invitation.accepted_at = datetime.utcnow()
    db.commit()

    security_service.record_security_event(
        db=db,
        event_type="FACULTY_INVITE_ACCEPTED",
        user_id=user.id,
        details=f"Faculty account initialized for {invitation.department} (Employee ID: {emp_code})",
        request=request
    )

    return {
        "message": "Faculty coordinator account successfully created! Please log in and configure Two-Factor Authentication.",
        "email": user.email
    }
