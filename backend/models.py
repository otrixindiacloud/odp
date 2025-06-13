from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: int = Field(primary_key=True)
    email: str = Field(unique=True, nullable=False)
    password: str = Field(nullable=False)

class Object(SQLModel, table=True):
    __tablename__ = "objects"
    id: int = Field(primary_key=True)
    objectCategory: str = Field(nullable=False)
    objectName: str = Field(nullable=False)
    connector: str = Field(nullable=False)
    systemId: int = Field(nullable=False)
    dataLayer: str = Field(nullable=True)
    data_path: str = Field(nullable=True)  # New field for file location

class System(SQLModel, table=True):
    __tablename__ = "systems"
    id: int = Field(primary_key=True)
    systemCategory: str = Field(nullable=False)
    systemName: str = Field(nullable=False)
    hostname: str = Field(nullable=False)
    port: int = Field(nullable=False)
    sid: str = Field(nullable=True)
    db_schema: str = Field(nullable=True)  # Renamed from 'schema'
    username: str = Field(nullable=False)
    password: str = Field(nullable=False)
    url: str = Field(nullable=True)
    connector: str = Field(nullable=True)

class ObjectAttribute(SQLModel, table=True):
    __tablename__ = "object_attributes"
    id: int = Field(default=None, primary_key=True)
    object_id: int = Field(foreign_key="objects.id")
    attribute_name: str
    attribute_value: str

class ObjectRelation(SQLModel, table=True):
    __tablename__ = "object_relations"
    id: int = Field(default=None, primary_key=True)
    object_id: int = Field(foreign_key="objects.id")  # Source object
    related_object_id: int  # Target object
    source_attribute_id: int = Field(default=None, foreign_key="object_attributes.id")
    target_attribute_id: int = Field(default=None, foreign_key="object_attributes.id")
    relation_type: str = Field(default=None)
    status: str = Field(default="active")

class Space(SQLModel, table=True):
    __tablename__ = "spaces"
    id: int = Field(default=None, primary_key=True)
    name: str
    owner: str

class TransformationStep(SQLModel, table=True):
    __tablename__ = "transformation_steps"  # Correct table name
    id: int = Field(default=None, primary_key=True)
    object_id: int = Field(foreign_key="objects.id")  # Correct foreign key reference
    step_name: str
    step_description: str
    step_order: int
    status: str = Field(default="Open")
    step_command: str = Field(default=None)

# Add a placeholder for the publish-to-silver logic (to be implemented in transformations.py)


