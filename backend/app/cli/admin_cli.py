import sys
import argparse
from datetime import datetime, timedelta
from backend.app.core.database import SessionLocal
from backend.app.core.security import (
    get_password_hash,
    generate_totp_secret,
    encrypt_totp_secret,
    get_totp_uri,
    generate_recovery_codes,
    hash_secret_token,
    generate_secure_token,
)
from backend.app.models.user import User, UserRole
from backend.app.models.auth_security import (
    TwoFactorRecoveryCode,
    FacultyInvitation,
    SecurityEvent,
)
from backend.app.services.email_service import email_service
from backend.app.core.config import settings

def provision_admin(email: str, password: str, first_name: str, last_name: str):
    """Securely provision an administrator with mandatory Two-Factor Authentication."""
    db = SessionLocal()
    try:
        email = email.strip().lower()
        user = db.query(User).filter(User.email == email).first()

        raw_secret = generate_totp_secret()
        encrypted_secret = encrypt_totp_secret(raw_secret)

        if not user:
            user = User(
                email=email,
                password_hash=get_password_hash(password),
                first_name=first_name,
                last_name=last_name,
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                email_verified=True,
                email_verified_at=datetime.utcnow(),
                two_factor_enabled=True,
                two_factor_secret_encrypted=encrypted_secret
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Created new Administrator account: {email}")
        else:
            user.role = UserRole.ADMIN
            user.password_hash = get_password_hash(password)
            user.first_name = first_name
            user.last_name = last_name
            user.is_active = True
            user.is_verified = True
            user.email_verified = True
            user.two_factor_enabled = True
            user.two_factor_secret_encrypted = encrypted_secret
            db.commit()
            print(f"✅ Updated existing user to Administrator with 2FA: {email}")

        # Invalidate old recovery codes and generate 10 fresh codes
        db.query(TwoFactorRecoveryCode).filter(TwoFactorRecoveryCode.user_id == user.id).delete()
        recovery_codes = generate_recovery_codes(10)
        for code in recovery_codes:
            db.add(TwoFactorRecoveryCode(
                user_id=user.id,
                code_hash=hash_secret_token(code),
                used=False
            ))

        db.add(SecurityEvent(
            user_id=user.id,
            event_type="ADMIN_PROVISIONED",
            details=f"Admin {email} provisioned via CLI with mandatory 2FA"
        ))
        db.commit()

        otpauth_uri = get_totp_uri(raw_secret, email)

        print("\n" + "="*60)
        print("🔐 ADMINISTRATOR TWO-FACTOR AUTHENTICATION DETAILS")
        print("="*60)
        print(f"Email:              {email}")
        print(f"TOTP Secret Key:    {raw_secret}")
        print(f"Authenticator URI:  {otpauth_uri}")
        print("-" * 60)
        print("Scan this URI in Google Authenticator, Microsoft Authenticator, or 1Password.")
        print("-" * 60)
        print("⚠️  ONE-TIME BACKUP RECOVERY CODES (Store securely!):")
        for i, code in enumerate(recovery_codes, 1):
            print(f"  {i:2d}. {code}")
        print("="*60 + "\n")

    finally:
        db.close()

def invite_faculty(email: str, department: str, designation: str):
    """Generate an institutional faculty invitation."""
    db = SessionLocal()
    try:
        email = email.strip().lower()
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"❌ User with email {email} already exists.")
            return

        raw_token = generate_secure_token()
        token_hash = hash_secret_token(raw_token)
        invitation = FacultyInvitation(
            email=email,
            department=department,
            designation=designation,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(invitation)
        db.commit()

        invite_url = f"{settings.FRONTEND_URL}/accept-faculty-invite?token={raw_token}"
        print(f"\n✅ Faculty Invitation Generated for {email} ({department}):")
        print(f"🔗 Invitation URL: {invite_url}\n")
    finally:
        db.close()

def clean_demo_accounts():
    """Remove any test or demo persona accounts (admin@demo.local, faculty@demo.local, student@demo.local)."""
    db = SessionLocal()
    try:
        demo_emails = ["admin@demo.local", "faculty@demo.local", "student@demo.local"]
        deleted_count = db.query(User).filter(User.email.in_(demo_emails)).delete(synchronize_session=False)
        db.commit()
        print(f"🧹 Removed {deleted_count} demo/test account(s) from the database.")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sanjivani University CIMS Administrative Provisioning CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # provision-admin
    admin_parser = subparsers.add_parser("provision-admin", help="Provision real Administrator with 2FA")
    admin_parser.add_argument("--email", required=True, help="Official Admin Email (e.g. tpo@sanjivani.edu.in)")
    admin_parser.add_argument("--password", required=True, help="Strong Administrator Password")
    admin_parser.add_argument("--first-name", default="TPO", help="First name")
    admin_parser.add_argument("--last-name", default="Director", help="Last name")

    # invite-faculty
    fac_parser = subparsers.add_parser("invite-faculty", help="Invite Faculty Coordinator")
    fac_parser.add_argument("--email", required=True, help="Faculty institutional email")
    fac_parser.add_argument("--department", required=True, help="Department name")
    fac_parser.add_argument("--designation", default="Assistant Professor & T&P Coordinator", help="Designation")

    # clean-demo-accounts
    subparsers.add_parser("clean-demo-accounts", help="Purge legacy demo accounts")

    args = parser.parse_args()
    if args.command == "provision-admin":
        provision_admin(args.email, args.password, args.first_name, args.last_name)
    elif args.command == "invite-faculty":
        invite_faculty(args.email, args.department, args.designation)
    elif args.command == "clean-demo-accounts":
        clean_demo_accounts()
