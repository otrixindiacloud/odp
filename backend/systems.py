from fastapi import APIRouter, HTTPException
from sqlmodel import Session
from backend.database import get_db_session
from backend.models import System

router = APIRouter()

@router.post('/systems')
def add_system(system: System):
    session = get_db_session()

    # Validation
    if not system.systemCategory or not system.systemName or not system.hostname or not system.port:
        raise HTTPException(status_code=400, detail="Missing required fields")

    new_system = System(
        systemCategory=system.systemCategory,
        systemName=system.systemName,
        hostname=system.hostname,
        port=system.port,
        sid=system.sid,
        schema=system.schema,
        username=system.username,
        password=system.password,
        url=system.url,
        connector=system.connector
    )

    try:
        session.add(new_system)
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add system: {str(e)}")

    return {"message": "System added successfully"}

@router.get('/systems')
def get_systems():
    session = get_db_session()
    systems = session.query(System).all()
    return [
        {
            "id": system.id,
            "systemCategory": system.systemCategory,
            "systemName": system.systemName,
            "hostname": system.hostname,
            "port": system.port,
            "sid": system.sid,
            "schema": system.schema,
            "username": system.username,
            "password": system.password,
            "url": system.url,
            "connector": system.connector
        }
        for system in systems
    ]

@router.put('/systems')
def update_system(system: System):
    session = get_db_session()
    try:
        existing_system = session.query(System).filter(System.id == system.id).first()
        if not existing_system:
            raise HTTPException(status_code=404, detail="System not found")

        existing_system.systemCategory = system.systemCategory
        existing_system.systemName = system.systemName
        existing_system.hostname = system.hostname
        existing_system.port = system.port
        existing_system.sid = system.sid
        existing_system.schema = system.schema
        existing_system.username = system.username
        existing_system.password = system.password
        existing_system.url = system.url
        existing_system.connector = system.connector

        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update system: {str(e)}")

    return {"message": "System updated successfully"}
