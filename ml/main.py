"""
CricIQ — FastAPI ML Inference Service
======================================
Internal microservice for ML inference.
Endpoints:
  POST /ml/predict     → match winner probability + SHAP factors
  POST /ml/scout       → player scouting scores
  POST /ml/auction/price → bid range prediction
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from predict import router as predict_router
from scout import router as scout_router
from auction import router as auction_router

app = FastAPI(
    title="CricIQ ML Service",
    description="Internal ML inference API for CricIQ",
    version="1.0.0",
)

# CORS — allow Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(predict_router, prefix="/ml")
app.include_router(scout_router, prefix="/ml")
app.include_router(auction_router, prefix="/ml")


@app.get("/")
async def root():
    return {"service": "CricIQ ML", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
