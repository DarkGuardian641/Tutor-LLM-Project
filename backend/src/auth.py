"""
Google OAuth Authentication Module
Handles Google OAuth 2.0 login flow for TutorLLM
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import httpx
import sys
import os
from urllib.parse import urlencode
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add the parent directory (backend/) to sys.path to ensure src imports work
current_dir = os.path.dirname(os.path.abspath(__file__)) # this is backend/src
backend_dir = os.path.dirname(current_dir) # this is backend/
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

load_dotenv()

router = APIRouter(prefix="/auth", tags=["authentication"])

# OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your_super_secret_jwt_key_change_this_in_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Google OAuth URLs
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


from passlib.context import CryptContext
from pydantic import BaseModel
from src.database import get_user_by_email, create_user

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

@router.get("/google/login")
async def google_login():
    """Redirect user to Google OAuth consent screen"""
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
async def google_callback(code: str = None, error: str = None):
    """Handle Google OAuth callback"""
    if error:
        return RedirectResponse(url=f"{FRONTEND_URL}?error={error}")
    
    if not code:
        return RedirectResponse(url=f"{FRONTEND_URL}?error=no_code")
    
    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": GOOGLE_REDIRECT_URI
                }
            )
            
            if token_response.status_code != 200:
                return RedirectResponse(url=f"{FRONTEND_URL}?error=token_exchange_failed")
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info
            userinfo_response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if userinfo_response.status_code != 200:
                return RedirectResponse(url=f"{FRONTEND_URL}?error=userinfo_failed")
            
            user_info = userinfo_response.json()
            
            # Create our own JWT token with user info
            jwt_token = create_access_token({
                "sub": user_info.get("id"),
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "picture": user_info.get("picture")
            })
            
            # Redirect to frontend with token
            # Redirect to frontend with token
            return RedirectResponse(
                url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}&name={user_info.get('name', '')}&email={user_info.get('email', '')}&picture={user_info.get('picture', '')}"
            )
            
    except Exception as e:
        print(f"OAuth Error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}?error=oauth_failed")


@router.post("/signup")
async def signup(request: SignupRequest):
    """Register a new user"""
    # Check if user already exists
    if get_user_by_email(request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = get_password_hash(request.password)
    
    # Create user
    if create_user(request.name, request.email, password_hash):
        # Return success with a token immediately or just redirect to login
        # Let's generate a token so they are logged in immediately after signup
        token = create_access_token({
            "sub": request.email,
            "email": request.email,
            "name": request.name
        })
        return {
            "token": token,
            "user": {
                "email": request.email,
                "name": request.name
            }
        }
    else:
        raise HTTPException(status_code=500, detail="Could not create user")

@router.post("/login")
async def login(request: LoginRequest):
    """Login a user and return a JWT token"""
    user = get_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found. Please create an account.")
    
    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Create token
    token = create_access_token({
        "sub": user["email"],
        "email": user["email"],
        "name": user["name"]
    })
    
    return {
        "token": token,
        "user": {
            "email": user["email"],
            "name": user["name"]
        }
    }

@router.get("/verify")
async def verify_token(token: str):
    """Verify a JWT token and return user info"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return {
            "valid": True,
            "user": {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name"),
                "picture": payload.get("picture")
            }
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
