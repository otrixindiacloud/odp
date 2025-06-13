from fastapi import APIRouter, HTTPException, UploadFile, Depends
from sqlmodel import Session
from backend.database import get_db_session
from backend.models import Object, ObjectAttribute, ObjectRelation, TransformationStep
import os
from datetime import datetime
from fastapi import Query
import pandas as pd

router = APIRouter()

@router.get('/list')
def get_objects():
    session = get_db_session()
    objects = session.query(Object).all()
    return objects

@router.get('/object-detail/{id}')
def get_object_detail(id: int):
    session = get_db_session()
    object = session.query(Object).filter(Object.id == id).first()

    if not object:
        raise HTTPException(status_code=404, detail="Object not found")

    return object

@router.post('/upload-file')
def upload_file(file: UploadFile):
    session = get_db_session()

    # Save the uploaded file under delta-lake/bronze/upload/today_date/file (as parquet)
    today_date = datetime.now().strftime('%Y-%m-%d')
    upload_dir = f"delta-lake/bronze/upload/{today_date}"
    os.makedirs(upload_dir, exist_ok=True)
    file_location = f"{upload_dir}/{file.filename}"

    # Save the uploaded file temporarily
    with open(file_location, "wb") as f:
        f.write(file.file.read())

    # Read the CSV file into a DataFrame
    df = pd.read_csv(file_location, header=0)
    headers = list(df.columns)

    # Save as parquet
    parquet_location = file_location.rsplit('.', 1)[0] + '.parquet'
    df.to_parquet(parquet_location, index=False)

    # Remove the original CSV file to keep only parquet
    os.remove(file_location)

    # Insert a new object record
    new_object = Object(
        objectName=file.filename,  # Use the file name as the object name
        objectCategory="Uploaded File",  # Default category
        connector="CSV",  # Default connector
        systemId=0,  # Default system ID
        dataLayer="Bronze",  # Default data layer
        data_path=parquet_location  # Store the parquet file path
    )
    session.add(new_object)
    session.commit()

    # Populate the object attributes table
    for header in headers:
        attribute = ObjectAttribute(
            object_id=new_object.id,  # Use the newly created object ID
            attribute_name=header,
            attribute_value=""  # Default value, can be updated later
        )
        session.add(attribute)

    session.commit()

    return {
        "message": "File uploaded and object/attributes populated successfully.",
        "objectId": new_object.id,
        "filePath": file_location
    }

@router.get('/object-attributes/{object_id}')
def get_object_attributes(object_id: int):
    session = get_db_session()
    attributes = session.query(ObjectAttribute).filter(ObjectAttribute.object_id == object_id).all()

    # Return an empty list if no attributes are found
    return attributes if attributes else []

@router.get('/object-relations/all')
def get_all_object_relations():
    session = get_db_session()
    try:
        relations = session.query(ObjectRelation).all()
        if not relations:
            return []
        return [
            {
                'id': r.id,
                'object_id': r.object_id,
                'related_object_id': r.related_object_id,
                'source_attribute_id': r.source_attribute_id,
                'target_attribute_id': r.target_attribute_id,
                'relation_type': r.relation_type,
                'status': r.status
            }
            for r in relations
        ]
    except Exception:
        return []

@router.get('/object-relations/{object_id}')
def get_object_relations(object_id: int):
    session = get_db_session()
    relations = session.query(ObjectRelation).filter(ObjectRelation.object_id == object_id).all()

    # Return an empty list if no relations are found
    return relations if relations else []

@router.post('/object-relations/add')
def add_object_relation(relation: ObjectRelation):
    session = get_db_session()
    # Remove id if present to avoid conflicts
    relation.id = None
    session.add(relation)
    session.commit()
    session.refresh(relation)
    return {
        "message": "Object relation added successfully.",
        "relationId": relation.id
    }

@router.put('/object-detail/{id}')
def update_object_detail(id: int, updated_object: Object):
    session = get_db_session()
    existing_object = session.query(Object).filter(Object.id == id).first()

    if not existing_object:
        raise HTTPException(status_code=404, detail="Object not found")

    existing_object.objectName = updated_object.objectName
    existing_object.objectCategory = updated_object.objectCategory
    existing_object.connector = updated_object.connector
    existing_object.systemId = updated_object.systemId
    existing_object.dataLayer = updated_object.dataLayer

    session.commit()
    return existing_object

@router.post('/preview-file')
def preview_file(file: UploadFile):
    # Save the uploaded file temporarily
    temp_file_location = f"temp_{file.filename}"
    with open(temp_file_location, "wb") as f:
        f.write(file.file.read())

    # Read the file and extract preview data
    preview_data = []
    suggestions = []
    try:
        with open(temp_file_location, "r") as f:
            reader = csv.reader(f)
            headers = next(reader)  # Extract column names
            preview_data.append(headers)

            for row in reader:
                preview_data.append(row)
                # Example suggestion logic: Check for empty cells
                if any(cell.strip() == "" for cell in row):
                    suggestions.append("Some rows have empty cells. Consider cleaning the data.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
    finally:
        os.remove(temp_file_location)  # Clean up temporary file

    return {"previewData": preview_data[:10], "suggestions": suggestions}  # Limit preview to first 10 rows

@router.get('/preview-data/{object_id}')
def get_preview_data(
    object_id: int,
    offset: int = Query(0, ge=0, description="Row offset for pagination"),
    limit: int = Query(15, ge=1, le=500, description="Number of rows to return (max 500)")
):
    session = get_db_session()
    object = session.query(Object).filter(Object.id == object_id).first()

    if not object:
        raise HTTPException(status_code=404, detail="Object not found")

    # Fetch the file associated with the object
    file_location = object.data_path  # Use the stored data_path

    preview_data = []
    total_rows = 0
    try:
        with open(file_location, "r") as f:
            reader = csv.reader(f)
            headers = next(reader)  # Extract column names
            preview_data.append(headers)

            # Skip rows up to the offset
            for _ in range(offset):
                next(reader, None)

            # Fetch the next 'limit' rows for preview
            for _ in range(limit):
                row = next(reader, None)
                if row:
                    preview_data.append(row)
                else:
                    break

            # Count total rows (excluding header)
            f.seek(0)
            total_rows = sum(1 for _ in reader) - 1
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

    return {
        "previewData": preview_data,
        "offset": offset,
        "limit": limit,
        "totalRows": total_rows
    }

@router.post('/transformations')
def create_transformation_step(transformation_step: TransformationStep):
    session = get_db_session()

    # Add the new transformation step
    session.add(transformation_step)
    session.commit()

    return {"message": "Transformation step created successfully.", "stepId": transformation_step.id}

@router.get('/transformations/{object_id}')
def get_transformation_steps(object_id: int):
    session = get_db_session()
    steps = session.query(TransformationStep).filter(TransformationStep.object_id == object_id).order_by(TransformationStep.step_order).all()

    # Return an empty list if no steps are found
    return steps if steps else []

@router.post('/transformations/first-row-to-header/{object_id}')
def add_first_row_to_header(object_id: int):
    session = get_db_session()

    # Create a new transformation step
    transformation_step = TransformationStep(
        object_id=object_id,
        step_name="First Row Promote to Header",
        step_description="Skip the first row and use it as headers",
        step_order=session.query(TransformationStep).filter(TransformationStep.object_id == object_id).count() + 1
    )
    session.add(transformation_step)
    session.commit()

    return {"message": "Transformation step added successfully.", "stepId": transformation_step.id}
