from fastapi import APIRouter, HTTPException, Request
from sqlmodel import Session, select
from pydantic import BaseModel
from backend.database import get_db_session
from backend.models import TransformationStep, Object
import pandas as pd
import os
import pyarrow as pa
import pyarrow.parquet as pq
from dotenv import load_dotenv

load_dotenv()

import openai
openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter()

@router.post('/steps/first-row-to-header/{object_id}')
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

@router.get('/steps/{object_id}')
def get_transformation_steps(object_id: int):
    session = get_db_session()
    steps = session.query(TransformationStep).filter(TransformationStep.object_id == object_id).order_by(TransformationStep.step_order).all()

    # Return an empty list if no steps are found
    return steps if steps else []

@router.delete('/steps/delete/{step_id}')
def remove_transformation_step(step_id: int):
    session = get_db_session()

    # Find the step to delete
    step = session.query(TransformationStep).filter(TransformationStep.id == step_id).first()

    if not step:
        raise HTTPException(status_code=404, detail="Transformation step not found")

    session.delete(step)
    session.commit()

    return {"message": "Transformation step removed successfully."}

@router.post('/steps/add-step/{object_id}')
def add_step(object_id: int, payload: TransformationStep):
    session = get_db_session()

    # Create a new transformation step with provided name and description
    transformation_step = TransformationStep(
        object_id=object_id,
        step_name=payload.step_name,
        step_description=payload.step_description,
        step_order=session.query(TransformationStep).filter(TransformationStep.object_id == object_id).count() + 1
    )
    session.add(transformation_step)
    session.commit()

    return {"message": "Transformation step added successfully.", "stepId": transformation_step.id}

def get_object_data_path(object_id: int):
    base_path = f"delta-lake/bronze/upload/{object_id}"
    parquet_path = base_path + ".parquet"
    csv_path = base_path + ".csv"
    if os.path.exists(parquet_path):
        return parquet_path
    elif os.path.exists(csv_path):
        return csv_path
    else:
        raise HTTPException(status_code=404, detail=f"Data file not found for object {object_id}.")

@router.post('/preview/steps/{step_id}')
def preview_step_by_step_id(step_id: int, payload: dict, request: Request):
    session = get_db_session()
    step = session.query(TransformationStep).filter(TransformationStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Transformation step not found")
    object_id = step.object_id
    step_description = step.step_description

    steps = session.query(TransformationStep).filter(TransformationStep.object_id == object_id and TransformationStep.id <= step.obejct_id)
    

    obj = session.query(Object).filter(Object.id == object_id).first()
    if not obj:
        step.status = "Failed"
        session.commit()
        raise HTTPException(status_code=404, detail="Object not found")
    file_path = obj.data_path
    if not file_path or not os.path.exists(file_path):
        step.status = "Failed"
        session.commit()
        raise HTTPException(status_code=404, detail=f"Data file not found: {file_path}")
    if not step_description:
        step.status = "Failed"
        session.commit()
        raise HTTPException(status_code=400, detail="Missing 'step_description' in step record.")
    try:
        if file_path.endswith(".parquet"):
            df = pd.read_parquet(file_path)
        else:
            df = pd.read_csv(file_path)
    except Exception as e:
        step.status = "Failed"
        session.commit()
        raise HTTPException(status_code=500, detail=f"Failed to load data: {e}")
    try:
        if step_description.strip() != "Show all rows":
            prompt = (
                f"You are a Python data scientist. "
                f"Given the following pandas DataFrame 'df', write a single line of pandas code to {step_description}. "
                f"The available columns in 'df' are: {list(df.columns)}. "
                f"If the user makes a typo or mistake in a column name, use the closest matching column name from the available columns. "
                f"Do not include any explanations, only the code. "
                f"Example: df = df[df['column'] == 'value']"
            )
            try:
                response = openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant for pandas data transformations."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=100,
                    temperature=0
                )
                code = response.choices[0].message.content.strip()
                step.step_command = code
                if not code.startswith("df ="):
                    step.status = "Failed"
                    session.commit()
                    raise Exception("Generated code is not valid for execution.")
                local_vars = {"df": df}
                exec(code, {}, local_vars)
                df = local_vars["df"]
            except Exception as e:
                step.status = "Failed"
                session.commit()
                raise HTTPException(status_code=500, detail=f"OpenAI or code execution error: {e}")
        step.status = "Success"
        session.commit()
    except Exception as e:
        step.status = "Failed"
        session.commit()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
    return {
        "columns": list(df.columns),
        "rows": df.head(100).values.tolist(),
        "message": "Step previewed successfully."
    }

@router.get('/steps/object/{object_id}')
def get_steps_for_object(object_id: int):
    session = get_db_session()
    steps = session.query(TransformationStep).filter(TransformationStep.object_id == object_id).order_by(TransformationStep.step_order).all()
    return [
        {
            'id': step.id,
            'step_name': step.step_name,
            'step_description': step.step_description,
            'step_order': step.step_order
        }
        for step in steps
    ]

@router.post("/publish-to-silver/{object_id}")
def publish_to_silver(object_id: int):
    # Fetch the object and steps
    session = get_db_session()
    obj = session.query(Object).filter(Object.id == object_id).first()
    if not obj:
        return {"status": "failed", "message": "Object not found."}
    steps = session.query(TransformationStep).filter(TransformationStep.object_id == object_id).order_by(TransformationStep.step_order, TransformationStep.id).all()
    if not steps:
        return {"status": "failed", "message": "No transformation steps found for this object."}
    input_path = obj.data_path or obj.objectName
    if not input_path or not os.path.exists(input_path):
        return {"status": "failed", "message": "Original file not found."}
    # Load the data (CSV or Parquet)
    try:
        if input_path.endswith('.parquet'):
            df = pd.read_parquet(input_path)
        else:
            df = pd.read_csv(input_path)
    except Exception as e:
        return {"status": "failed", "message": f"Failed to load data: {e}"}
    # Apply each step's command
    for step in steps:
        if step.step_command:
            try:
                local_vars = {"df": df, "pd": pd}
                exec(step.step_command, {}, local_vars)
                df = local_vars["df"]
            except Exception as e:
                return {"status": "failed", "message": f"Failed to apply step {step.id}: {e}"}
    # Write to silver layer as Parquet
    try:
        silver_dir = input_path.replace('/bronze/', '/silver/')
        silver_dir = os.path.dirname(silver_dir)
        os.makedirs(silver_dir, exist_ok=True)
        silver_path = os.path.join(silver_dir, os.path.splitext(os.path.basename(input_path))[0] + '.parquet')
        table = pa.Table.from_pandas(df)
        pq.write_table(table, silver_path)
        return {"status": "success", "message": f"Published to Silver Layer: {silver_path}"}
    except Exception as e:
        return {"status": "failed", "message": f"Failed to write to silver layer: {e}"}
