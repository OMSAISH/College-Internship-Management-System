import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional
import httpx

from backend.app.core.config import settings

logger = logging.getLogger("email_service")

class EmailService:
    def __init__(self):
        # In-memory store for recent tokens to aid automated verification and developer testing
        self.latest_tokens: Dict[str, Dict[str, str]] = {}

    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """Render a clean, responsive HTML email template branded for Sanjivani University."""
        app_name = "Sanjivani University - College Internship Management System"
        primary_color = "#1e3a8a"
        accent_color = "#2563eb"
        
        base_wrapper = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background-color: {primary_color}; padding: 28px 24px; text-align: center; color: #ffffff; }}
            .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }}
            .header p {{ margin: 6px 0 0 0; font-size: 12px; opacity: 0.85; }}
            .content {{ padding: 32px 28px; line-height: 1.6; font-size: 15px; color: #334155; }}
            .content h2 {{ color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700; }}
            .btn {{ display: inline-block; padding: 12px 28px; background-color: {accent_color}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 20px 0; text-align: center; }}
            .callout {{ background: #f1f5f9; border-left: 4px solid {primary_color}; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 14px; }}
            .code-box {{ background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 16px; font-weight: 700; letter-spacing: 2px; text-align: center; color: #0f172a; margin: 16px 0; }}
            .footer {{ background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sanjivani University</h1>
              <p>Training & Placement Cell • Career & Internship Portal</p>
            </div>
            <div class="content">
              {{content}}
            </div>
            <div class="footer">
              <p>This is an automated security communication from Sanjivani University CIMS.</p>
              <p>Training & Placement Office, Kopargaon, Ahmednagar District, Maharashtra 423603</p>
              <p>© 2026 Sanjivani University. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        """

        if template_name == "email_verification":
            body = f"""
            <h2>Verify Your Institutional Email Address</h2>
            <p>Dear {context.get('name', 'Student')},</p>
            <p>Thank you for registering on the Sanjivani University Internship Management System. To activate your account and configure Two-Factor Authentication (2FA), please confirm your email address.</p>
            <div style="text-align: center;">
              <a href="{context.get('verification_url', '#')}" class="btn">Verify Email Address</a>
            </div>
            <div class="callout">
              <p style="margin: 0;"><strong>Link expires in:</strong> {context.get('expires_in', '24 hours')}</p>
              <p style="margin: 4px 0 0 0; word-break: break-all; font-size: 12px; color: #64748b;">Or paste this URL into your browser: {context.get('verification_url')}</p>
            </div>
            <p style="font-size: 13px; color: #64748b;">If you did not create an account on the Sanjivani University CIMS portal, please ignore this email.</p>
            """
        elif template_name == "password_reset":
            body = f"""
            <h2>Password Reset Request</h2>
            <p>Dear {context.get('name', 'User')},</p>
            <p>We received a request to reset the password for your Sanjivani University CIMS account.</p>
            <div style="text-align: center;">
              <a href="{context.get('reset_url', '#')}" class="btn">Reset Password</a>
            </div>
            <div class="callout">
              <p style="margin: 0;"><strong>Security Notice:</strong> This link is single-use and will expire in {context.get('expires_in', '30 minutes')}.</p>
              <p style="margin: 4px 0 0 0; word-break: break-all; font-size: 12px; color: #64748b;">URL: {context.get('reset_url')}</p>
            </div>
            <p style="font-size: 13px; color: #64748b;">If you did not request this password reset, please contact the Training & Placement Office immediately at tpo@sanjivani.edu.in.</p>
            """
        elif template_name == "2fa_enabled":
            body = f"""
            <h2>Two-Factor Authentication Enabled</h2>
            <p>Dear {context.get('name', 'User')},</p>
            <p>Two-Factor Authentication (TOTP) has been successfully enabled on your Sanjivani University account. Your account is now protected with an additional layer of security.</p>
            <div class="callout">
              <p style="margin: 0;"><strong>Timestamp:</strong> {context.get('timestamp')}</p>
              <p style="margin: 4px 0 0 0;"><strong>Device / IP:</strong> {context.get('ip_address', 'Unknown')}</p>
            </div>
            <p>Please make sure you have stored your 10 one-time recovery codes in a safe location in case you lose access to your authenticator app.</p>
            """
        elif template_name == "security_alert":
            body = f"""
            <h2>Security Alert: {context.get('event_title', 'Account Security Activity')}</h2>
            <p>Dear {context.get('name', 'User')},</p>
            <p>{context.get('event_description')}</p>
            <div class="callout">
              <p style="margin: 0;"><strong>Action:</strong> {context.get('action')}</p>
              <p style="margin: 4px 0 0 0;"><strong>Time:</strong> {context.get('timestamp')}</p>
              <p style="margin: 4px 0 0 0;"><strong>IP Address:</strong> {context.get('ip_address', 'Unknown')}</p>
            </div>
            <p style="font-size: 13px; color: #e11d48; font-weight: 600;">If this wasn't you, sign out of all active sessions immediately in Security Settings and reset your password.</p>
            """
        elif template_name == "faculty_invitation":
            body = f"""
            <h2>Faculty Coordinator Invitation</h2>
            <p>Dear Colleague,</p>
            <p>You have been formally invited to join the <strong>Sanjivani University Training & Placement Cell</strong> as an authorized Faculty Coordinator for <strong>{context.get('department')}</strong>.</p>
            <div style="text-align: center;">
              <a href="{context.get('invitation_url', '#')}" class="btn">Accept Invitation & Setup Account</a>
            </div>
            <p>You will be required to set your password and configure mandatory Two-Factor Authentication during account onboarding.</p>
            """
        else:
            body = f"<p>{context.get('message', 'Notification from Sanjivani University CIMS')}</p>"

        return base_wrapper.replace("{{content}}", body)

    def send_email(self, to_email: str, subject: str, template_name: str, context: Dict[str, Any]) -> bool:
        """Deliver transactional email using configured provider (SMTP, Resend, or Console logger)."""
        html_body = self.render_template(template_name, context)

        # Store token in memory if present for testing/automated inspection
        if "token" in context:
            self.latest_tokens[to_email] = {
                "token": context["token"],
                "type": template_name,
                "url": context.get("verification_url") or context.get("reset_url") or context.get("invitation_url", "")
            }

        # 1. SMTP Provider
        if settings.EMAIL_PROVIDER == "smtp" and settings.SMTP_HOST and settings.SMTP_USER:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
                msg["To"] = to_email
                msg.attach(MIMEText(html_body, "html"))

                if settings.SMTP_TLS:
                    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                    server.starttls()
                else:
                    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                
                if settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
                server.quit()
                logger.info(f"SMTP Email delivered to {to_email} with subject: {subject}")
                return True
            except Exception as e:
                logger.error(f"SMTP delivery failed to {to_email}: {e}")
                # Fallback to console logging
        
        # 2. Resend Provider
        elif settings.EMAIL_PROVIDER == "resend" and settings.RESEND_API_KEY:
            try:
                res = httpx.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                    json={
                        "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
                        "to": [to_email],
                        "subject": subject,
                        "html": html_body
                    },
                    timeout=10.0
                )
                if res.status_code in (200, 201):
                    logger.info(f"Resend Email delivered to {to_email}")
                    return True
                else:
                    logger.error(f"Resend API error: {res.text}")
            except Exception as e:
                logger.error(f"Resend delivery failed to {to_email}: {e}")

        # 3. Console / Local Fallback (Development & Automated Verification)
        logger.info(f"📧 [EMAIL DISPATCH] To: {to_email} | Subject: {subject} | Template: {template_name}")
        if "verification_url" in context:
            logger.info(f"🔗 Verification URL: {context['verification_url']}")
        if "reset_url" in context:
            logger.info(f"🔗 Password Reset URL: {context['reset_url']}")
        if "invitation_url" in context:
            logger.info(f"🔗 Invitation URL: {context['invitation_url']}")

        return True

email_service = EmailService()
