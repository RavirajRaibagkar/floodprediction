"""
Weather API Routes — serves real Open-Meteo weather data.
"""

from fastapi import APIRouter, Query, HTTPException
from services.weather_service import fetch_open_meteo

router = APIRouter()


@router.get("/current")
async def get_current_weather(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
):
    """Get current weather snapshot for a location."""
    try:
        data = await fetch_open_meteo(lat, lng)
        return data["current"]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather API unavailable: {str(e)}")


@router.get("/history")
async def get_weather_history(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    hours: int = Query(48, description="Number of past hours to return"),
):
    """Get historical hourly weather data."""
    try:
        data = await fetch_open_meteo(lat, lng)
        hourly = data.get("hourly", [])
        # Past data starts at index 0, current ~= index 7*24
        now_idx = min(len(hourly) - 1, 7 * 24)
        start_idx = max(0, now_idx - hours)
        return {
            "lat": data["lat"],
            "lng": data["lng"],
            "hours_requested": hours,
            "data": hourly[start_idx:now_idx + 1],
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather API unavailable: {str(e)}")


@router.get("/forecast")
async def get_weather_forecast(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
):
    """Get next 72h hourly forecast — used as LSTM input."""
    try:
        data = await fetch_open_meteo(lat, lng)
        hourly = data.get("hourly", [])
        # Forecast data starts after past days
        now_idx = min(len(hourly) - 1, 7 * 24)
        forecast = hourly[now_idx:]
        return {
            "lat": data["lat"],
            "lng": data["lng"],
            "forecast_hours": len(forecast),
            "data": forecast,
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather API unavailable: {str(e)}")
