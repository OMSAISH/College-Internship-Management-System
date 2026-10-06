from backend.app.core.database import Base
from backend.app.models.user import User, UserRole
from backend.app.models.student import StudentProfile, PlacementStatus
from backend.app.models.faculty import FacultyProfile
from backend.app.models.company import Company, CompanyContact, CompanyRating
from backend.app.models.internship import Internship, WorkMode, InternshipStatus
from backend.app.models.application import Application, ApplicationStatus, ApplicationStatusHistory, ApplicationDocument
from backend.app.models.interview import Interview, InterviewStatus, InterviewResult
from backend.app.models.evaluation import Evaluation, HiringRecommendation
from backend.app.models.feedback import Feedback, FeedbackTargetType, FeedbackStatus
from backend.app.models.notification import Notification, NotificationCategory
from backend.app.models.audit_log import AuditLog
from backend.app.models.system_setting import SystemSetting
from backend.app.models.bookmark import Bookmark

__all__ = [
    "Base",
    "User",
    "UserRole",
    "StudentProfile",
    "PlacementStatus",
    "FacultyProfile",
    "Company",
    "CompanyContact",
    "CompanyRating",
    "Internship",
    "WorkMode",
    "InternshipStatus",
    "Application",
    "ApplicationStatus",
    "ApplicationStatusHistory",
    "ApplicationDocument",
    "Interview",
    "InterviewStatus",
    "InterviewResult",
    "Evaluation",
    "HiringRecommendation",
    "Feedback",
    "FeedbackTargetType",
    "FeedbackStatus",
    "Notification",
    "NotificationCategory",
    "AuditLog",
    "SystemSetting",
    "Bookmark",
]
