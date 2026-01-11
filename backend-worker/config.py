import os

class Config:
    # Vercel Admin Panel URL
    VERCEL_API_URL = os.getenv('VERCEL_API_URL', 'https://your-app.vercel.app')
    API_SECRET = os.getenv('API_SECRET', 'your-secret-key')
    
    # Google Drive
    GOOGLE_SERVICE_ACCOUNT_KEY = os.getenv('GOOGLE_SERVICE_ACCOUNT_KEY', '{}')
    
    # Facebook
    FB_API_VERSION = 'v19.0'
    FB_GRAPH_URL = f'https://graph.facebook.com/{FB_API_VERSION}'
    
    # Timezone
    TIMEZONE = 'Asia/Jakarta'
