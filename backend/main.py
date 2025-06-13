from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import router
from backend.database import init_db

app = FastAPI()

# Simplified CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_request_headers(request: Request, call_next):
    print("Request headers:", request.headers)
    response = await call_next(request)
    print("Response headers:", response.headers)
    return response

@app.get("/api/hello")
def read_root():
    return {"message": "Hello from FastAPI!"}


@app.options("/api/hello")
def options_hello():
    return {}

# Initialize the database
init_db()

# Include the router
app.include_router(router)

# Bind FastAPI to all interfaces for accessibility
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
