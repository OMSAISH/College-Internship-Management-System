from datetime import datetime, timedelta
import secrets
from typing import Optional, List, Tuple
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.security import (
    hash_secret_token,
    generate_secure_token,
    generate_recovery_codes,
    create_access_token,
    create_refresh_token,
)
from backend.app.models.user import User
from backend.app.models.auth_security import (
    EmailVerificationToken,
    PasswordResetToken,
    TwoFactorRecoveryCode,
    UserSession,
    SecurityEvent,
)

class SecurityService:
    @staticmethod
    def get_client_info(request: Optional[Request]) -> Tuple[Optional[str], Optional[str]]:
        """Extract client IP and User-Agent from request."""
        if not request:
            return None, None
        ip = None
        if request.headers.get("x-forwarded-for"):
            ip = request.headers.get("x-forwarded-for").split(",")[0].strip()
        elif request.client:
            ip = request.client.host
        user_agent = request.headers.get("user-agent", "Unknown Device")[:250]
        return ip, user_agent

    @classmethod
    def record_security_event(
        cls,
        db: Session,
        event_type: str,
        user_id: Optional[int] = None,
        details: Optional[str] = None,
        request: Optional[Request] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> SecurityEvent:
        """Persist a security audit trail event."""
        if request and not ip_address:
            ip_address, user_agent = cls.get_client_info(request)
        
        event = SecurityEvent(
            user_id=user_id,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
            created_at=datetime.utcnow()
        )
        db.add(event)
        db.commit()
        return event

    @classmethod
    def check_and_handle_failed_login(cls, db: Session, user: User, request: Optional[Request] = None):
        """Track failed login attempts and enforce brute-force account lockout."""
        now = datetime.utcnow()
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            cls.record_security_event(
                db=db,
                event_type="ACCOUNT_LOCKED",
                user_id=user.id,
                details=f"Account locked for {settings.LOCKOUT_DURATION_MINUTES} minutes due to {user.failed_login_attempts} failed attempts",
                request=request
            )
        else:
            cls.record_security_event(
                db=db,
                event_type="LOGIN_FAILED",
                user_id=user.id,
                details=f"Invalid credentials (Attempt {user.failed_login_attempts}/{settings.MAX_FAILED_LOGIN_ATTEMPTS})",
                request=request
            )
        db.commit()

    @classmethod
    def reset_failed_login_attempts(cls, db: Session, user: User):
        """Clear failed login attempts upon successful login."""
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.utcnow()
        db.commit()

    @classmethod
    def create_verification_token(cls, db: Session, user_id: int) -> str:
        """Create a cryptographically secure email verification token."""
        raw_token = generate_secure_token()
        token_hash = hash_secret_token(raw_token)
        expires_at = datetime.utcnow() + timedelta(hours=settings.EMAIL_VERIFICATION_EXPIRE_HOURS)

        token_record = EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(token_record)
        db.commit()
        return raw_token

    @classmethod
    def verify_email_token(cls, db: Session, raw_token: str) -> Optional[User]:
        """Verify an email token and mark the user verified."""
        token_hash = hash_secret_token(raw_token)
        token_record = db.query(EmailVerificationToken).filter(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.used_at.is_(None)
        ).first()

        if not token_record or token_record.expires_at < datetime.utcnow():
            return None

        # Mark token used
        token_record.used_at = datetime.utcnow()
        user = db.query(User).filter(User.id == token_record.user_id).first()
        if user:
            user.email_verified = True
            user.email_verified_at = datetime.utcnow()
            user.is_verified = True
            db.commit()
        return user

    @classmethod
    def create_password_reset_token(cls, db: Session, user_id: int) -> str:
        """Create a secure password reset token."""
        raw_token = generate_secure_token()
        token_hash = hash_secret_token(raw_token)
        expires_at = datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)

        token_record = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(token_record)
        db.commit()
        return raw_token

    @classmethod
    def verify_password_reset_token(cls, db: Session, raw_token: str) -> Optional[User]:
        """Validate a password reset token."""
        token_hash = hash_secret_token(raw_token)
        token_record = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None)
        ).first()

        if not token_record or token_record.expires_at < datetime.utcnow():
            return None

        return db.query(User).filter(User.id == token_record.user_id).first()

    @classmethod
    def consume_password_reset_token(cls, db: Session, raw_token: str):
        """Mark password reset token as consumed."""
        token_hash = hash_secret_token(raw_token)
        token_record = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash
        ).first()
        if token_record:
            token_record.used_at = datetime.utcnow()
            db.commit()

    @classmethod
    def generate_and_store_recovery_codes(cls, db: Session, user_id: int) -> List[str]:
        """Generate 10 recovery codes, invalidate previous ones, store hashes, and return plaintext codes."""
        # Invalidate previous unused recovery codes
        db.query(TwoFactorRecoveryCode).filter(
            TwoFactorRecoveryCode.user_id == user_id,
            TwoFactorRecoveryCode.used.is_(False)
        ).delete(synchronize_session=False)

        raw_codes = generate_recovery_codes(count=10)
        for code in raw_codes:
            record = TwoFactorRecoveryCode(
                user_id=user_id,
                code_hash=hash_secret_token(code),
                used=False
            )
            db.add(record)
        db.commit()
        return raw_codes

    @classmethod
    def verify_and_consume_recovery_code(cls, db: Session, user_id: int, raw_code: str) -> bool:
        """Validate a single-use backup recovery code and immediately mark it as consumed."""
        code_hash = hash_secret_token(raw_code.strip().upper())
        record = db.query(TwoFactorRecoveryCode).filter(
            TwoFactorRecoveryCode.user_id == user_id,
            TwoFactorRecoveryCode.code_hash == code_hash,
            TwoFactorRecoveryCode.used.is_(False)
        ).first()

        if not record:
            return False

        record.used = True
        record.used_at = datetime.utcnow()
        db.commit()
        return True

    @classmethod
    def create_user_session(
        cls,
        db: Session,
        user_id: int,
        request: Optional[Request] = None
    ) -> Tuple[str, str, str]:
        """Create a new session record and return (session_id, access_token, refresh_token)."""
        session_id = secrets.token_hex(16)
        refresh_token = create_refresh_token(subject=user_id, session_id=session_id)
        refresh_token_hash = hash_secret_token(refresh_token)
        access_token = create_access_token(subject=user_id, session_id=session_id)

        ip, user_agent = cls.get_client_info(request)
        expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        session = UserSession(
            user_id=user_id,
            session_id=session_id,
            refresh_token_hash=refresh_token_hash,
            device_information=user_agent,
            ip_address=ip,
            expires_at=expires_at
        )
        db.add(session)
        db.commit()
        return session_id, access_token, refresh_token

    @classmethod
    def revoke_all_sessions(cls, db: Session, user_id: int):
        """Invalidate all active sessions for a user (used after password reset or 'Sign out all devices')."""
        now = datetime.utcnow()
        db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None)
        ).update({"revoked_at": now}, synchronize_session=False)
        db.commit()

security_service = SecurityService()
