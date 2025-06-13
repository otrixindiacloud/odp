from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from backend.database import get_db_session
from backend.models import Configuration

router = APIRouter()

@router.get('/list')
def get_configurations():
    session = get_db_session()
    configurations = session.query(Configuration).all()
    return configurations

@router.get('/configuration-detail/{id}')
def get_configuration_detail(id: int):
    session = get_db_session()
    configuration = session.query(Configuration).filter(Configuration.id == id).first()

    if not configuration:
        raise HTTPException(status_code=404, detail="Configuration not found")

    return configuration

@router.post('/add-configuration')
def add_configuration(configuration: Configuration):
    session = get_db_session()
    session.add(configuration)
    session.commit()
    return {"message": "Configuration added successfully."}

@router.put('/update-configuration/{id}')
def update_configuration(id: int, updated_configuration: Configuration):
    session = get_db_session()
    existing_configuration = session.query(Configuration).filter(Configuration.id == id).first()

    if not existing_configuration:
        raise HTTPException(status_code=404, detail="Configuration not found")

    existing_configuration.name = updated_configuration.name
    existing_configuration.value = updated_configuration.value

    session.commit()
    return existing_configuration

@router.delete('/delete-configuration/{id}')
def delete_configuration(id: int):
    session = get_db_session()
    configuration = session.query(Configuration).filter(Configuration.id == id).first()

    if not configuration:
        raise HTTPException(status_code=404, detail="Configuration not found")

    session.delete(configuration)
    session.commit()
    return {"message": "Configuration deleted successfully."}
