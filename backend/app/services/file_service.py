import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException, status
from backend.app.core.config import settings

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

class FileService:
    @staticmethod
    def save_resume_file(file: UploadFile) -> tuple[str, str, int]:
        """Validate and save PDF resume to local storage securely."""
        # 1. Validate file extension
        filename = file.filename or "resume.pdf"
        ext = filename.split(".")[-1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only PDF files are accepted."
            )
        
        # 2. Generate secure unique filename
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        
        # 3. Read and check file size (Max 5MB)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        file_size = 0
        
        try:
            with open(file_path, "wb") as buffer:
                while chunk := file.file.read(1024 * 64):
                    file_size += len(chunk)
                    if file_size > max_bytes:
                        buffer.close()
                        if os.path.exists(file_path):
                            os.remove(file_path)
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB."
                        )
                    buffer.write(chunk)
        except HTTPException:
            raise
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )
        
        relative_url = f"/api/v1/files/download/{unique_name}"
        return relative_url, filename, file_size

file_service = FileService()
