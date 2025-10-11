import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from database import get_session as get_db_session_generator

# This scheme will look for an "Authorization" header with a "Bearer" token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Load the secret key from environment variables
JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("SUPABASE_JWT_SECRET environment variable not set.")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """
    Decodes and validates the Supabase JWT.
    Returns the user's UUID (the 'sub' claim) if valid.
    Raises HTTPException for any validation errors.
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            # You can add audience validation for extra security if needed
            audience="authenticated", 
        )
        # The 'sub' claim in a Supabase JWT is the user's UUID.
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user identifier not found.",
            )
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_db_session():
    '''Yields a database session.'''
    yield from get_db_session_generator()
