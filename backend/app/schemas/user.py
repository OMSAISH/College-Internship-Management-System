import re
from typing import Optional, List, Union
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from backend.app.models.user import UserRole

EMAIL_REGEX = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

class UserBase(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    role: UserRole = UserRole.STUDENT

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(EMAIL_REGEX, v):
            raise ValueError("Invalid email address format")
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        if not any(c in "!@#$%^&*()_+-=[]{}|;':,.<>?/" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v:
            clean = "".join(filter(str.isdigit, v))
            if len(clean) < 10 or len(clean) > 15:
                raise ValueError("Phone number must have between 10 and 15 digits")
        return v

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        if not any(c in "!@#$%^&*()_+-=[]{}|;':,.<>?/" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    email_verified: bool = False
    two_factor_enabled: bool = False
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str = Field(..., min_length=3)
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    user: UserResponse

class TwoFactorRequiredResponse(BaseModel):
    requires_2fa: bool = True
    temp_token: str
    email: str
    message: str = "Two-factor authentication code required"

class TwoFactorLoginRequest(BaseModel):
    temp_token: str
    totp_code: Optional[str] = None
    recovery_code: Optional[str] = None

class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_uri: str
    qr_code_data_uri: str

class TwoFactorEnableRequest(BaseModel):
    code: str

class TwoFactorEnableResponse(BaseModel):
    message: str
    recovery_codes: List[str]

class RegenerateRecoveryCodesResponse(BaseModel):
    message: str
    recovery_codes: List[str]

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        if not any(c in "!@#$%^&*()_+-=[]{}|;':,.<>?/" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v

class EmailVerificationRequest(BaseModel):
    token: str

class UserSessionResponse(BaseModel):
    id: int
    session_id: str
    device_information: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    last_used_at: datetime
    is_current: bool = False

    class Config:
        from_attributes = True

class SecurityEventResponse(BaseModel):
    id: int
    event_type: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FacultyInviteRequest(BaseModel):
    email: str
    department: str
    designation: str

class FacultyInviteAccept(BaseModel):
    token: str
    first_name: str
    last_name: str
    password: str
    phone: Optional[str] = None
