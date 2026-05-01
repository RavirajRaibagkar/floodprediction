"""
Sensor API Routes — now with real river discharge data from hydro_service.
GET  /api/sensors              — list all sensors near location
GET  /api/sensors/{id}         — sensor history
GET  /api/sensors/levels       — real river discharge levels
POST /api/sensors/ingest       — ingest new reading
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import random

from services.hydro_service import fetch_river_levels

router = APIRouter()


# ─── Schemas ────────────────────────────────────────────────
class SensorReading(BaseModel):
    sensor_id: int
    water_level: float
    rainfall: float
    timestamp: Optional[str] = None


@router.get("/levels")
async def get_sensor_levels(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
):
    """Get real river discharge levels from Open-Meteo Flood API."""
    try:
        data = await fetch_river_levels(lat, lng)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Hydro API unavailable: {str(e)}")


@router.get("/")
async def list_sensors(
    lat: float = Query(None, description="Latitude"),
    lng: float = Query(None, description="Longitude"),
):
    """List sensors near a location. Returns virtual sensors if lat/lng provided."""
    if lat is not None and lng is not None:
        # Generate virtual sensors around the given location
        sensors = _generate_virtual_sensors(lat, lng)
        return sensors
    # Fallback
    return []


@router.get("/{sensor_id}")
async def get_sensor_history(sensor_id: int):
    """Get historical readings for a sensor."""
    # Generate history (will be replaced with DB queries in Step 7)
    history = []
    for i in range(48):
        ts = datetime.utcnow().timestamp() - i * 3600
        history.append({
            "timestamp": datetime.fromtimestamp(ts).isoformat(),
            "water_level": round(2.0 + random.random() * 2.5 + 0.5 * (i % 12) / 12, 2),
            "rainfall": round(max(0, 10 + random.gauss(0, 8)), 1),
        })

    return {
        "sensor_id": sensor_id,
        "readings": history,
        "count": len(history),
    }


@router.post("/ingest")
async def ingest_reading(reading: SensorReading):
    """Ingest a new sensor reading."""
    return {
        "status": "ingested",
        "sensor_id": reading.sensor_id,
        "water_level": reading.water_level,
        "rainfall": reading.rainfall,
        "timestamp": reading.timestamp or datetime.utcnow().isoformat(),
    }


def _generate_virtual_sensors(lat: float, lng: float):
    """Generate virtual sensors around a location based on common river offsets."""
    offsets = [
        (0.01, 0.01, "River Gauge North"),
        (-0.01, 0.02, "Bridge Sensor East"),
        (-0.02, -0.01, "Barrage Station South"),
        (0.02, -0.005, "Upstream Monitor"),
        (-0.005, 0.015, "Drainage Sensor"),
        (0.015, -0.02, "Downstream Gauge"),
    ]
    sensors = []
    for i, (dlat, dlng, name) in enumerate(offsets, start=1):
        sensors.append({
            "id": i,
            "name": name,
            "lat": round(lat + dlat, 6),
            "lng": round(lng + dlng, 6),
            "type": "water_level" if i % 3 != 0 else "rainfall",
            "status": "active",
        })
    return sensors
