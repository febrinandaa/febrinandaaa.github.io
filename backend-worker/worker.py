"""Main worker logic: Download from Drive -> Upload to Facebook."""
import requests
from datetime import datetime
import pytz

from config import Config
from errors import DriveError, FacebookError, TimeoutError, WorkerError
from services.drive_client import download_file
from services.fb_client import post_photo


def get_current_time_wib():
    """Get current time in WIB timezone."""
    tz = pytz.timezone(Config.TIMEZONE)
    return datetime.now(tz)


def claim_job() -> dict:
    """
    Request a job from Vercel API.
    
    Returns:
        Job details including page_id, file_id, caption, access_token
        Or None if no job available
    """
    url = f"{Config.VERCEL_API_URL}/api/job/claim"
    headers = {
        "Authorization": f"Bearer {Config.API_SECRET}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, headers=headers, timeout=10)
        
        if response.status_code == 503:
            # System disabled (Kill Switch)
            return {"status": "disabled", "message": "System is disabled"}
        
        if response.status_code == 409:
            # Lock already exists
            return {"status": "locked", "message": "Job already in progress"}
        
        if response.status_code == 204:
            # No job needed (outside hours or no content)
            return {"status": "skip", "message": "No job needed"}
        
        if response.status_code != 200:
            return {"status": "error", "message": f"API error: {response.status_code}"}
        
        data = response.json()
        data["status"] = "ready"
        return data
        
    except requests.exceptions.Timeout:
        return {"status": "error", "message": "Vercel API timeout"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def report_result(job_id: str, success: bool, result: dict):
    """Report job result back to Vercel API."""
    url = f"{Config.VERCEL_API_URL}/api/job/complete"
    headers = {
        "Authorization": f"Bearer {Config.API_SECRET}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "job_id": job_id,
        "success": success,
        "result": result,
        "completed_at": get_current_time_wib().isoformat()
    }
    
    try:
        requests.post(url, headers=headers, json=payload, timeout=10)
    except Exception as e:
        print(f"Failed to report result: {e}")


def execute_job(job: dict) -> dict:
    """
    Execute a posting job.
    
    Args:
        job: Job details from claim_job()
        
    Returns:
        Result of the job execution
    """
    file_id = job.get("file_id")
    page_id = job.get("page_id")
    caption = job.get("caption", "")
    access_token = job.get("access_token")
    
    result = {
        "page_id": page_id,
        "file_id": file_id,
        "error_type": None,
        "error_message": None,
        "post_id": None
    }
    
    try:
        # Step 1: Download from Drive
        print(f"Downloading file {file_id}...")
        image_data = download_file(file_id)
        print(f"Downloaded {len(image_data)} bytes")
        
        # Step 2: Upload to Facebook
        print(f"Posting to page {page_id}...")
        fb_result = post_photo(page_id, access_token, image_data, caption)
        print(f"Posted successfully: {fb_result.get('post_id')}")
        
        result["post_id"] = fb_result.get("post_id")
        result["success"] = True
        
    except DriveError as e:
        result["error_type"] = e.error_type
        result["error_message"] = e.message
        result["success"] = False
        print(f"Drive error: {e.message}")
        
    except FacebookError as e:
        result["error_type"] = e.error_type
        result["error_message"] = e.message
        result["success"] = False
        print(f"Facebook error: {e.message}")
        
    except Exception as e:
        result["error_type"] = "ERR_UNKNOWN"
        result["error_message"] = str(e)
        result["success"] = False
        print(f"Unknown error: {e}")
    
    return result
