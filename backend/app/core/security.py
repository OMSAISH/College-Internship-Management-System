import os
import io
import base64
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Any, Union, Optional, List, Tuple
import bcrypt
from jose import jwt, JWTError
from cryptography.fernet import Fernet
import pyotp
import qrcode

from backend.app.core.config import settings

# Initialize Fernet cipher for TOTP secret encryption at rest
_fernet = Fernet(settings.TOTP_ENCRYPTION_KEY.encode() if isinstance(settings.TOTP_ENCRYPTION_KEY, str) else settings.TOTP_ENCRYPTION_KEY)

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def hash_secret_token(token: str) -> str:
    """Generate SHA-256 hash of a sensitive verification or recovery token."""
    return hashlib.sha256(token.strip().encode("utf-8")).hexdigest()

def generate_secure_token() -> str:
    """Generate cryptographically secure 32-byte URL-safe string."""
    return secrets.token_urlsafe(32)

def create_access_token(subject: Union[str, Any], session_id: Optional[str] = None, expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "sid": session_id or secrets.token_hex(8)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None

def create_refresh_token(subject: Union[str, Any], session_id: str) -> str:
    """Generate long-lived JWT refresh token bound to a session ID."""
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "sid": session_id
    }
    return jwt.encode(to_encode, settings.JWT_REFRESH_SECRET, algorithm=settings.ALGORITHM)

def decode_refresh_token(token: str) -> Optional[dict]:
    """Decode and validate JWT refresh token."""
    try:
        payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None

def create_temp_2fa_token(user_id: int) -> str:
    """Create short-lived (5 min) challenge token for TOTP verification step."""
    expire = datetime.utcnow() + timedelta(minutes=settings.MFA_TICKET_EXPIRE_MINUTES)
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "type": "2fa_challenge"
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_temp_2fa_token(token: str) -> Optional[int]:
    """Verify challenge token and return user_id if valid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "2fa_challenge":
            return None
        return int(payload.get("sub"))
    except Exception:
        return None

# --- TOTP (RFC 6238) & Encryption Helpers ---

def encrypt_totp_secret(secret_base32: str) -> str:
    """Encrypt TOTP secret using Fernet before storing in DB."""
    return _fernet.encrypt(secret_base32.encode("utf-8")).decode("utf-8")

def decrypt_totp_secret(encrypted_secret: str) -> str:
    """Decrypt TOTP secret."""
    return _fernet.decrypt(encrypted_secret.encode("utf-8")).decode("utf-8")

def generate_totp_secret() -> str:
    """Generate a standard 32-character base32 secret for TOTP."""
    return pyotp.random_base32()

def get_totp_uri(secret_base32: str, email: str) -> str:
    """Generate standard otpauth:// URI for authenticator applications."""
    totp = pyotp.TOTP(secret_base32)
    return totp.provisioning_uri(name=email, issuer_name="Sanjivani University CIMS")

def generate_qr_code_data_uri(otpauth_uri: str) -> str:
    """Generate PNG data URI of the QR code for instant display."""
    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(otpauth_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"

def verify_totp_code(secret_base32: str, code: str) -> bool:
    """Verify standard 6-digit TOTP code with standard 30s clock drift tolerance."""
    if not code or len(code.strip()) != 6:
        return False
    try:
        totp = pyotp.TOTP(secret_base32)
        # valid_window=1 allows 30 seconds before and after for clock drift
        return bool(totp.verify(code.strip(), valid_window=1))
    except Exception:
        return False

# --- Backup / Recovery Codes ---

def generate_recovery_codes(count: int = 10) -> List[str]:
    """Generate list of 10 cryptographically secure one-time recovery codes (XXXX-XXXX)."""
    codes = []
    for _ in range(count):
        part1 = secrets.token_hex(2).upper()
        part2 = secrets.token_hex(2).upper()
        codes.append(f"{part1}-{part2}")
    return codes
