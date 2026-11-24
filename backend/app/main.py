# Owner: Member 01
# TODO: implement
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.api.v1.endpoints.customers import router as customers_router
from app.api.v1.endpoints.suppliers import router as suppliers_router

app = FastAPI(title="CloudDB Sentinel API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(customers_router, prefix="/api/v1")
app.include_router(suppliers_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok"}