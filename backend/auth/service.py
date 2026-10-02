from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the Supabase JWT access token and returns the authenticated user info.
    """
    token = credentials.credentials
    try:
        # get_user validates the JWT on the Supabase server side and returns the user object
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Extract desired user information
        user_info = {
            "id": user.id,
            "email": user.email,
            "name": user.user_metadata.get("full_name") or user.user_metadata.get("name"),
            "avatar_url": user.user_metadata.get("avatar_url")
        }
        
        return user_info
        
    except Exception as e:
        # Do not expose internal auth errors directly unless necessary for debugging
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
