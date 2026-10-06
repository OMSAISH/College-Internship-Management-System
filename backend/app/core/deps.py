from datetime import datetime
from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.user import User, UserRole
from backend.app.models.auth_security import UserSession

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    session_id = payload.get("sid")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate user credentials token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate active session revocation if session ID is present
    if session_id:
        session_record = db.query(UserSession).filter(
            UserSession.session_id == session_id,
            UserSession.user_id == int(user_id)
        ).first()
        if session_record:
            if session_record.revoked_at is not None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="This session has been revoked or signed out. Please log in again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            if session_record.expires_at < datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session expired. Please log in again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            # Update last activity
            session_record.last_used_at = datetime.utcnow()
            db.commit()

    user = db.query(User).filter(User.id == int(user_id), User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact college administrator."
        )
    return user

def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        session_id = payload.get("sid")
        if not user_id:
            return None
        
        if session_id:
            session_record = db.query(UserSession).filter(
                UserSession.session_id == session_id,
                UserSession.user_id == int(user_id)
            ).first()
            if session_record and (session_record.revoked_at is not None or session_record.expires_at < datetime.utcnow()):
                return None

        return db.query(User).filter(User.id == int(user_id), User.deleted_at.is_(None)).first()
    except Exception:
        return None

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {[r.value for r in self.allowed_roles]}"
            )
        return user

require_admin = RoleChecker([UserRole.ADMIN])
require_faculty = RoleChecker([UserRole.FACULTY, UserRole.ADMIN])
require_student = RoleChecker([UserRole.STUDENT, UserRole.ADMIN])
require_staff_or_admin = RoleChecker([UserRole.FACULTY, UserRole.ADMIN])
