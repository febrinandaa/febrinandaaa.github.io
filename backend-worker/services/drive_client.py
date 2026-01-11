"""Google Drive service for downloading files."""
import json
import io
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2 import service_account

from config import Config
from errors import DriveError


def get_drive_service():
    """Initialize Google Drive service."""
    try:
        credentials_info = json.loads(Config.GOOGLE_SERVICE_ACCOUNT_KEY)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=['https://www.googleapis.com/auth/drive.readonly']
        )
        return build('drive', 'v3', credentials=credentials)
    except Exception as e:
        raise DriveError(f"Failed to initialize Drive service: {str(e)}")


def download_file(file_id: str) -> bytes:
    """
    Download a file from Google Drive.
    
    Args:
        file_id: The Google Drive file ID
        
    Returns:
        File contents as bytes
        
    Raises:
        DriveError: If download fails
    """
    try:
        service = get_drive_service()
        request = service.files().get_media(fileId=file_id)
        
        file_buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(file_buffer, request)
        
        done = False
        while not done:
            status, done = downloader.next_chunk()
            
        file_buffer.seek(0)
        return file_buffer.read()
        
    except Exception as e:
        raise DriveError(
            f"Failed to download file {file_id}: {str(e)}",
            details={"file_id": file_id}
        )


def get_file_metadata(file_id: str) -> dict:
    """Get file metadata from Drive."""
    try:
        service = get_drive_service()
        file = service.files().get(
            fileId=file_id,
            fields='id,name,mimeType,size'
        ).execute()
        return file
    except Exception as e:
        raise DriveError(f"Failed to get file metadata: {str(e)}")
