import pytest
import pyotp
import secrets
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.email_service import email_service

client = TestClient(app)

def test_public_registration_role_enforcement():
    """Verify that public registration rejects requests attempting to claim ADMIN or FACULTY roles."""
    # Attempting to register as ADMIN must fail
    res_admin = client.post("/api/v1/auth/register", json={
        "email": "intruder@sanjivani.edu.in",
        "first_name": "Fake",
        "last_name": "Admin",
        "role": "ADMIN",
        "password": "Password@1234"
    })
    assert res_admin.status_code == 403

    # Attempting to register as FACULTY must fail
    res_fac = client.post("/api/v1/auth/register", json={
        "email": "intruder2@sanjivani.edu.in",
        "first_name": "Fake",
        "last_name": "Faculty",
        "role": "FACULTY",
        "password": "Password@1234"
    })
    assert res_fac.status_code == 403

def test_full_student_registration_verification_and_2fa_lifecycle():
    """Complete lifecycle test: Registration -> Email Verification -> Login -> 2FA Setup -> 2FA Login."""
    unique_suffix = secrets.token_hex(4)
    email = f"student_{unique_suffix}@student.sanjivani.edu.in"
    password = "SecureStudent@2026!"

    # 1. Register Student
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "first_name": "Aditya",
        "last_name": "Kapse",
        "phone": "+91 98220 99881",
        "role": "STUDENT",
        "password": password
    })
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email_verified"] is False

    # 2. Login before verification must be blocked
    unverified_login = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert unverified_login.status_code == 403
    assert "email address has not been verified" in unverified_login.json()["detail"].lower()

    # 3. Retrieve Verification Token from Email Service
    assert email in email_service.latest_tokens
    token = email_service.latest_tokens[email]["token"]

    # 4. Verify Email
    verify_res = client.post("/api/v1/auth/verify-email", json={"token": token})
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True

    # 5. Token reuse must be rejected
    reuse_res = client.post("/api/v1/auth/verify-email", json={"token": token})
    assert reuse_res.status_code == 400

    # 6. Login now succeeds
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200
    access_token = login_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {access_token}"}

    # 7. Setup 2FA
    setup_res = client.post("/api/v1/auth/2fa/setup", headers=auth_headers)
    assert setup_res.status_code == 200
    setup_data = setup_res.json()
    secret = setup_data["secret"]
    assert "otpauth_uri" in setup_data
    assert setup_data["qr_code_data_uri"].startswith("data:image/png;base64,")

    # 8. Attempt invalid TOTP code
    invalid_enable = client.post("/api/v1/auth/2fa/verify-and-enable", headers=auth_headers, json={"code": "000000"})
    assert invalid_enable.status_code == 400

    # 9. Verify with correct TOTP code
    correct_totp = pyotp.TOTP(secret).now()
    enable_res = client.post("/api/v1/auth/2fa/verify-and-enable", headers=auth_headers, json={"code": correct_totp})
    assert enable_res.status_code == 200
    recovery_codes = enable_res.json()["recovery_codes"]
    assert len(recovery_codes) == 10

    # 10. Subsequent Login requires 2FA
    step1 = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert step1.status_code == 200
    step1_data = step1.json()
    assert step1_data["requires_2fa"] is True
    temp_token = step1_data["temp_token"]

    # 11. 2FA Step with invalid TOTP rejected
    bad_2fa = client.post("/api/v1/auth/2fa/login", json={"temp_token": temp_token, "totp_code": "111111"})
    assert bad_2fa.status_code == 401

    # 12. 2FA Step with valid TOTP succeeds
    valid_totp = pyotp.TOTP(secret).now()
    good_2fa = client.post("/api/v1/auth/2fa/login", json={"temp_token": temp_token, "totp_code": valid_totp})
    assert good_2fa.status_code == 200
    assert "access_token" in good_2fa.json()

    # 13. Test Single-Use Recovery Code Login
    rec_step1 = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    rec_temp_token = rec_step1.json()["temp_token"]
    first_recovery_code = recovery_codes[0]

    rec_login = client.post("/api/v1/auth/2fa/login", json={
        "temp_token": rec_temp_token,
        "recovery_code": first_recovery_code
    })
    assert rec_login.status_code == 200
    assert "access_token" in rec_login.json()

    # 14. Reusing the SAME recovery code must fail
    reuse_step1 = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    reuse_temp = reuse_step1.json()["temp_token"]
    reuse_rec = client.post("/api/v1/auth/2fa/login", json={
        "temp_token": reuse_temp,
        "recovery_code": first_recovery_code
    })
    assert reuse_rec.status_code == 401
    assert "Invalid or already used recovery code" in reuse_rec.json()["detail"]

def test_password_reset_and_session_invalidation():
    """Verify password reset invalidates all existing sessions and revokes active access."""
    email = "aarav.sharma@student.sanjivani.edu.in"
    original_pass = "Student@1234"
    new_pass = "AaravNewPassword@2026!"

    # 1. Login to obtain an active session
    login1 = client.post("/api/v1/auth/login", json={"email": email, "password": original_pass})
    assert login1.status_code == 200
    old_token = login1.json()["access_token"]
    old_headers = {"Authorization": f"Bearer {old_token}"}

    # Verify session works
    me_res = client.get("/api/v1/auth/me", headers=old_headers)
    assert me_res.status_code == 200

    # 2. Request password reset
    forgot_res = client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert forgot_res.status_code == 200

    # Get reset token
    reset_token = email_service.latest_tokens[email]["token"]

    # 3. Perform Password Reset
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "token": reset_token,
        "new_password": new_pass
    })
    assert reset_res.status_code == 200

    # 4. Old access token session must now be rejected
    revoked_me = client.get("/api/v1/auth/me", headers=old_headers)
    assert revoked_me.status_code == 401

    # 5. Old password no longer works
    old_login = client.post("/api/v1/auth/login", json={"email": email, "password": original_pass})
    assert old_login.status_code == 401

    # 6. New password works
    new_login = client.post("/api/v1/auth/login", json={"email": email, "password": new_pass})
    assert new_login.status_code == 200

    # Revert back to original password for other tests
    new_token = new_login.json()["access_token"]
    client.post("/api/v1/auth/change-password", headers={"Authorization": f"Bearer {new_token}"}, json={
        "current_password": new_pass,
        "new_password": original_pass
    })

def test_session_management_and_revocation():
    """Verify session listing and revocation endpoints."""
    # Login as student
    login_res = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@student.sanjivani.edu.in",
        "password": "Student@1234"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch active sessions
    sessions_res = client.get("/api/v1/auth/sessions", headers=headers)
    assert sessions_res.status_code == 200
    sessions = sessions_res.json()
    assert len(sessions) >= 1

    # Sign out of all sessions
    revoke_res = client.post("/api/v1/auth/sessions/revoke-all", headers=headers)
    assert revoke_res.status_code == 200

    # Access token is now revoked
    after_revoke = client.get("/api/v1/auth/me", headers=headers)
    assert after_revoke.status_code == 401

def test_faculty_invitation_workflow():
    """Admin invites faculty coordinator -> Faculty coordinator accepts and activates account."""
    # 1. Login as Admin with 2FA
    step1 = client.post("/api/v1/auth/login", json={"email": "tpo@sanjivani.edu.in", "password": "Admin@1234"})
    totp = pyotp.TOTP("JBSWY3DPEHPK3PXP").now()
    step2 = client.post("/api/v1/auth/2fa/login", json={"temp_token": step1.json()["temp_token"], "totp_code": totp})
    admin_headers = {"Authorization": f"Bearer {step2.json()['access_token']}"}

    unique_suffix = secrets.token_hex(3)
    fac_email = f"prof_{unique_suffix}@sanjivani.edu.in"

    # 2. Invite Faculty
    invite_res = client.post("/api/v1/auth/faculty/invite", headers=admin_headers, json={
        "email": fac_email,
        "department": "Artificial Intelligence & Data Science",
        "designation": "Associate Professor"
    })
    assert invite_res.status_code == 200
    token = invite_res.json()["token"]

    # 3. Faculty accepts invitation
    accept_res = client.post("/api/v1/auth/faculty/accept", json={
        "token": token,
        "first_name": "Prof. Anand",
        "last_name": "Joshi",
        "phone": "+91 98220 77112",
        "password": "FacultySecure@2026!"
    })
    assert accept_res.status_code == 200

    # 4. Faculty logs in with new credentials
    fac_login = client.post("/api/v1/auth/login", json={
        "email": fac_email,
        "password": "FacultySecure@2026!"
    })
    assert fac_login.status_code == 200
    assert fac_login.json()["user"]["role"] == "FACULTY"
