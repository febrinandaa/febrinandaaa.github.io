"""Facebook Graph API service for posting photos."""
import requests
from config import Config
from errors import FacebookError


def post_photo(page_id: str, access_token: str, image_data: bytes, caption: str) -> dict:
    """
    Post a photo to a Facebook Page.
    
    Args:
        page_id: Facebook Page ID
        access_token: Page Access Token
        image_data: Image file as bytes
        caption: Post caption
        
    Returns:
        Facebook API response with post_id
        
    Raises:
        FacebookError: If posting fails
    """
    url = f"{Config.FB_GRAPH_URL}/{page_id}/photos"
    
    try:
        files = {
            'source': ('image.jpg', image_data, 'image/jpeg')
        }
        data = {
            'message': caption,
            'access_token': access_token
        }
        
        response = requests.post(url, files=files, data=data, timeout=30)
        result = response.json()
        
        if 'error' in result:
            error_msg = result['error'].get('message', 'Unknown error')
            error_code = result['error'].get('code', 0)
            raise FacebookError(
                f"Facebook API error: {error_msg}",
                details={
                    "page_id": page_id,
                    "error_code": error_code,
                    "error_message": error_msg
                }
            )
        
        return {
            "success": True,
            "post_id": result.get('post_id') or result.get('id'),
            "page_id": page_id
        }
        
    except requests.exceptions.Timeout:
        raise FacebookError(
            "Facebook API timeout",
            details={"page_id": page_id}
        )
    except requests.exceptions.RequestException as e:
        raise FacebookError(
            f"Network error posting to Facebook: {str(e)}",
            details={"page_id": page_id}
        )


def verify_token(access_token: str) -> dict:
    """Verify if a Facebook access token is valid."""
    url = f"{Config.FB_GRAPH_URL}/debug_token"
    params = {
        'input_token': access_token,
        'access_token': access_token
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        result = response.json()
        
        if 'error' in result:
            return {"valid": False, "error": result['error'].get('message')}
        
        data = result.get('data', {})
        return {
            "valid": data.get('is_valid', False),
            "expires_at": data.get('expires_at'),
            "scopes": data.get('scopes', [])
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}
