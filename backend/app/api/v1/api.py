from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    auth, students, faculty, companies, internships,
    applications, interviews, evaluations, feedback,
    reports, notifications, audit_logs, system_settings, files
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Security"])
api_router.include_router(students.router, prefix="/students", tags=["Student Management"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["Faculty Management"])
api_router.include_router(companies.router, prefix="/companies", tags=["Company Management"])
api_router.include_router(internships.router, prefix="/internships", tags=["Internship Discovery & Management"])
api_router.include_router(applications.router, prefix="/applications", tags=["Application Lifecycle"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["Interview Management"])
api_router.include_router(evaluations.router, prefix="/evaluations", tags=["Evaluation System"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback System"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Institutional Analytics"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notification Center"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Logging"])
api_router.include_router(system_settings.router, prefix="/settings", tags=["System Configuration"])
api_router.include_router(files.router, prefix="/files", tags=["Secure File Storage"])
