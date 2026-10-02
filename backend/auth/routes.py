from fastapi import APIRouter, Depends
from .service import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the currently authenticated user's information.
    Requires a valid Supabase access token in the Authorization header.
    """
    return current_user
