"""Custom exception classes for error classification."""

class WorkerError(Exception):
    """Base exception for worker errors."""
    error_type = "ERR_UNKNOWN"
    
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class DriveError(WorkerError):
    """Google Drive API errors."""
    error_type = "ERR_DRIVE"


class FacebookError(WorkerError):
    """Facebook Graph API errors."""
    error_type = "ERR_FB"


class TimeoutError(WorkerError):
    """Execution timeout errors."""
    error_type = "ERR_TIMEOUT"


class ConfigError(WorkerError):
    """Configuration/credential errors."""
    error_type = "ERR_CONFIG"
