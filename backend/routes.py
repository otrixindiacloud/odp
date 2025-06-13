from fastapi import APIRouter, HTTPException, Depends, Cookie, UploadFile
from sqlmodel import Session
from backend.database import get_db_session
from backend.models import Object, System, User, Space
import bcrypt
import sqlite3
from fastapi.responses import JSONResponse
import uuid
from backend.objects import router as objects_router
from backend.users import router as users_router
from backend.systems import router as systems_router
from backend.configurations import router as configurations_router
from backend.transformations import router as transformations_router

router = APIRouter()

# Include routers from modularized files
router.include_router(users_router, prefix="/users")
router.include_router(configurations_router, prefix="/configurations")
router.include_router(systems_router, prefix="/systems")
router.include_router(objects_router, prefix="/objects")
router.include_router(transformations_router, prefix="/transformations")

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
    print(f"Session created: {session_id} for email: {db_user.email}\nCurrent sessions: {sessions}")

    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(key="session_id", value=session_id, httponly=True, samesite="None")
    return response

@router.get('/validate-session')
def validate_session(session_id: str = Cookie(None)):
    print(f"Received session_id: {session_id}\nCurrent sessions: {sessions}")  # Log the session ID and all sessions
    if session_id in sessions:
        print(f"Session valid for email: {sessions[session_id]}")  # Log valid session
        return {"email": sessions[session_id]}
    print("Invalid session")  # Log invalid session
    raise HTTPException(status_code=401, detail="Invalid session")

@router.get('/user-details')
def get_user_details():
    conn = get_db_session()
    user = conn.execute('SELECT * FROM users LIMIT 1').fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user['id'], "email": user['email']}

@router.get('/configuration')
def get_configuration():
    return [{"id": 1, "title": "Configuration Item 1", "details": "Details about configuration item 1."},
            {"id": 2, "title": "Configuration Item 2", "details": "Details about configuration item 2."}]

@router.get('/object-lake')
def get_object_lake():
    return [{"id": 1, "title": "Object Lake Item 1", "details": "Details about object lake item 1."},
            {"id": 2, "title": "Object Lake Item 2", "details": "Details about object lake item 2."}]

@router.get('/transformation')
def get_transformation():
    return [{"id": 1, "title": "Transformation Item 1", "details": "Details about transformation item 1."},
            {"id": 2, "title": "Transformation Item 2", "details": "Details about transformation item 2."}]

@router.get('/data-flows')
def get_data_flows():
    return [{"id": 1, "title": "Data Flow Item 1", "details": "Details about data flow item 1."},
            {"id": 2, "title": "Data Flow Item 2", "details": "Details about data flow item 2."}]

@router.get('/reports')
def get_reports():
    return [{"id": 1, "title": "Report Item 1", "details": "Details about report item 1."},
            {"id": 2, "title": "Report Item 2", "details": "Details about report item 2."}]

@router.get('/administration')
def get_administration():
    return [{"id": 1, "title": "Administration Item 1", "details": "Details about administration item 1."},
            {"id": 2, "title": "Administration Item 2", "details": "Details about administration item 2."}]

@router.post('/systems')
def add_system(system: System):
    from backend.systems import add_system as add_system_logic
    return add_system_logic(system)

@router.get('/systems')
def get_systems():
    from backend.systems import get_systems as get_systems_logic
    return get_systems_logic()

@router.put('/systems')
def update_system(system: System):
    from backend.systems import update_system as update_system_logic
    return update_system_logic(system)

@router.get('/spaces')
def get_spaces():
    session = get_db_session()
    spaces = session.query(Space).all()
    return spaces

@router.get('/user-spaces')
def get_user_spaces(user_id: int):
    session = get_db_session()
    spaces = session.query(Space).filter(Space.owner == user_id).all()
    return spaces
