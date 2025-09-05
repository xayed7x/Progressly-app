# progressly-api/dependencies.py
import os
import httpx
from typing import Annotated
import traceback 

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from sqlmodel import Session

from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions, RequestState

from database import get_session

# --- Security Scheme Definition ---
# This is what enables the "Authorize" button in the API docs.
bearer_scheme = HTTPBearer()

# --- Clerk and Database Dependencies ---
clerk = Clerk(bearer_auth=os.environ.get("CLERK_SECRET_KEY"))

def get_session_details(req: Request) -> RequestState:
    try:
        headers = [(k, v) for k, v in req.headers.items()]
        url = str(req.url)
        content = b""
        httpx_request = httpx.Request(method=req.method, url=url, headers=headers, content=content)
        
        request_state = clerk.authenticate_request(httpx_request, AuthenticateRequestOptions())
        
        # REMOVE THE DEBUGGING BLOCK
        # print("\n" + "="*50)
        # print("!!! INSPECTING CLERK REQUEST STATE !!!")
        # print(vars(request_state))
        # print("="*50 + "\n")
        
        if not request_state.is_signed_in:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return request_state
    except Exception as e:
        # You can also clean this up if you wish
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

# --- Annotated Dependencies for Cleaner Routes ---
# We can now import these directly into our path operation functions.
DBSession = Annotated[Session, Depends(get_session)]
ClerkSession = Annotated[RequestState, Depends(get_session_details)]