from fastapi import APIRouter, HTTPException, Cookie
from sqlmodel import Session
from backend.database import get_db_session
from backend.models import User, Space
import bcrypt
import uuid
from fastapi.responses import JSONResponse

router = APIRouter()

sessions = {}

@router.post('/register')
def register_user(user: User):
    session = get_db_session()
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

    new_user = User(
        email=user.email,
        password=hashed_password.decode('utf-8')
    )

    try:
        session.add(new_user)
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")

    return {"message": "User registered successfully"}

@router.post('/login')
def login_user(user: User):
    session = get_db_session()
    db_user = session.query(User).filter(User.email == user.email).first()

    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user.password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = str(uuid.uuid4())
    sessions[session_id] = db_user.email

    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(key="session_id", value=session_id, httponly=True, samesite="None")
    return response

@router.get('/validate-session')
def validate_session(session_id: str = Cookie(None)):
    if session_id in sessions:
        return {"email": sessions[session_id]}
    raise HTTPException(status_code=401, detail="Invalid session")

@router.post('/create-user')
def create_user(user: User):
    session = get_db_session()
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

    new_user = User(
        email=user.email,
        password=hashed_password.decode('utf-8')
    )

    try:
        session.add(new_user)
        session.commit()

        # Automatically create a space for the user
        space_name = f"space_{user.email.split('@')[0]}"
        new_space = Space(name=space_name, owner=new_user.id)
        session.add(new_space)
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")

    return {"message": "User and space created successfully."}

@router.get('/list')
def get_users():
    session = get_db_session()
    users = session.query(User).all()
    return users
