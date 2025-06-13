from sqlmodel import create_engine, SQLModel, Session
import os
from backend.models import ObjectAttribute, ObjectRelation

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///dna.db').replace('sqlite:///', '')
engine = create_engine(f'sqlite:///{DATABASE_URL}')

# Create a session factory
SessionLocal = Session(bind=engine)

def get_db_session():
    return SessionLocal

def init_db():
    """Initializes the database schema."""
    SQLModel.metadata.create_all(engine)

# Automatically initialize the database schema on application start
init_db()
