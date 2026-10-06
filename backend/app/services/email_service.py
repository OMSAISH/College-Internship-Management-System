import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("email_service")

class EmailService:
    @staticmethod
    def render_template(template_name: str, context: Dict[str, Any]) -> str:
        """Render a clean, responsive HTML email template."""
        app_name = "College Internship Management System"
        primary_color = "#1e3a8a"
        
        base_wrapper = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }}
            .header {{ background-color: {primary_color}; padding: 24px; text-align: center; color: #ffffff; }}
            .header h1 {{ margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.025em; }}
            .content {{ padding: 32px 24px; line-height: 1.6; font-size: 15px; }}
            .btn {{ display: inline-block; padding: 12px 24px; background-color: {primary_color}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 20px 0; }}
            .footer {{ background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{app_name}</h1>
            </div>
            <div class="content">
              {{content}}
            </div>
            <div class="footer">
              <p>This is an automated notification from {app_name}. Please do not reply directly to this email.</p>
              <p>© 2026 University Placement Cell. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        """

        if template_name == "welcome":
            body = f"""
            <h2>Welcome to CIMS, {context.get('name')}!</h2>
            <p>Your institutional account has been successfully created with the role: <strong>{context.get('role')}</strong>.</p>
            <p>You can now sign in to discover top industry internships, track application status, and schedule interviews.</p>
            <div style="text-align: center;">
              <a href="{context.get('login_url', '#')}" class="btn">Access Your Portal</a>
            </div>
            """
        elif template_name == "application_status":
            body = f"""
            <h2>Application Status Update</h2>
            <p>Dear {context.get('student_name')},</p>
            <p>The status of your application for <strong>{context.get('internship_title')}</strong> at <strong>{context.get('company_name')}</strong> has changed to:</p>
            <div style="background: #f8fafc; border-left: 4px solid {primary_color}; padding: 16px; margin: 16px 0;">
              <strong style="font-size: 18px; color: {primary_color};">{context.get('status')}</strong>
              {f"<p style='margin: 8px 0 0 0; color: #475569;'>Notes: {context.get('comment')}</p>" if context.get('comment') else ''}
            </div>
            <p>Please log in to your student dashboard to review details and next steps.</p>
            """
        elif template_name == "interview_invitation":
            body = f"""
            <h2>Interview Invitation</h2>
            <p>Dear {context.get('student_name')},</p>
            <p>You have been invited for an interview for <strong>{context.get('internship_title')}</strong> at <strong>{context.get('company_name')}</strong>.</p>
            <ul>
              <li><strong>Round:</strong> {context.get('round_name')}</li>
              <li><strong>Date & Time:</strong> {context.get('scheduled_at')}</li>
              <li><strong>Interviewer:</strong> {context.get('interviewer_name')}</li>
              <li><strong>Meeting / Venue:</strong> {context.get('location')}</li>
            </ul>
            <p>Please ensure you are prepared and present 10 minutes prior to the scheduled time.</p>
            """
        else:
            body = f"<p>{context.get('message', 'Notification from CIMS')}</p>"

        return base_wrapper.replace("{{content}}", body)

    @classmethod
    def send_email(cls, to_email: str, subject: str, template_name: str, context: Dict[str, Any]) -> bool:
        """Simulate and log transactional email delivery."""
        html_body = cls.render_template(template_name, context)
        logger.info(f"EMAIL SENT TO: {to_email} | SUBJECT: {subject} | TEMPLATE: {template_name}")
        return True

email_service = EmailService()
