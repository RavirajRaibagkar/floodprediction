"""
Prediction API Routes
POST /api/predict/image        — CNN classifier + segmentation
POST /api/predict/timeseries   — LSTM model
GET  /api/predict/risk-score   — composite risk score
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from services.prediction_service import PredictionService

router = APIRouter()
prediction_service = PredictionService()


@router.post("/image")
async def predict_image(file: UploadFile = File(...)):
    """Run CNN classifier + segmentation on uploaded satellite image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        if file.filename and not file.filename.lower().endswith(('.tif', '.tiff')):
            raise HTTPException(status_code=400, detail="File must be an image (PNG, JPG, TIF)")

    try:
        contents = await file.read()
        result = prediction_service.predict_image(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/timeseries")
async def predict_timeseries(file: UploadFile = File(...)):
    """Run LSTM forecast on uploaded CSV time-series data."""
    if file.filename and not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV format")

    try:
        contents = await file.read()
        result = prediction_service.predict_timeseries(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk-score")
async def get_risk_score(
    lat: float = Query(28.6139, description="Latitude"),
    lng: float = Query(77.2090, description="Longitude"),
):
    """Compute composite flood risk score using real weather, hydro, and elevation data."""
    try:
        return await prediction_service.compute_risk_score(lat, lng)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
