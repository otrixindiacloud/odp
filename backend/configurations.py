from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from backend.database import get_db_session
from backend.models import Space

router = APIRouter()

@router.get('/spaces/list')
def get_spaces():
    session = get_db_session()
    spaces = session.query(Space).all()
    return spaces

@router.get('/space-detail/{id}')
def get_space_detail(id: int):
    session = get_db_session()
    space = session.query(Space).filter(Space.id == id).first()

    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    return space

@router.post('/add-space')
def add_space(space: Space):
    session = get_db_session()
    session.add(space)
    session.commit()
    return {"message": "Space added successfully."}

@router.delete('/delete-space/{id}')
def delete_space(id: int):
    session = get_db_session()
    space = session.query(Space).filter(Space.id == id).first()

    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    session.delete(space)
    session.commit()
    return {"message": "Space deleted successfully."}
