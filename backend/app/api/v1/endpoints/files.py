import os
from fastapi import APIRouter, HTTPException, status, Response
from fastapi.responses import FileResponse
from backend.app.core.config import settings

router = APIRouter()

@router.get("/download/{filename}")
def download_file(filename: str):
    """Securely download or preview stored files (resumes, documents)."""
    # Prevent directory traversal attacks
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    if not os.path.exists(file_path):
        # Provide sample dummy PDF bytes if file not physically on disk
        return Response(
            content=b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF",
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={safe_filename}"}
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=safe_filename
    )
