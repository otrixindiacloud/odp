from fastapi import APIRouter

router = APIRouter()

@router.get("/modeling/health")
def modeling_health():
    return {"status": "ok", "message": "Modeling API is up."}

# Add your modeling endpoints here (model creation, listing, etc.)
