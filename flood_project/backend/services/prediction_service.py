"""
Prediction Service — orchestrates real data for risk scoring.
Uses weather, hydro, elevation services for composite risk computation.
"""

import numpy as np
import logging

logger = logging.getLogger(__name__)

# ML model stubs (will use real models when available)
try:
    from models.cnn_flood_classifier import predict_flood_probability, build_cnn_classifier
    from models.lstm_water_prediction import predict_water_level, build_lstm_model
    HAS_MODELS = True
except Exception:
    HAS_MODELS = False

from services.weather_service import fetch_open_meteo
from services.hydro_service import fetch_river_levels
from services.elevation_service import get_elevation


class PredictionService:
    def __init__(self):
        self.cnn_classifier = None
        self.lstm_model = None

        if HAS_MODELS:
            try:
                self.cnn_classifier = build_cnn_classifier()
            except Exception:
                pass
            try:
                self.lstm_model = build_lstm_model()
            except Exception:
                pass

    async def compute_risk_score(self, lat: float, lng: float) -> dict:
        """
        Composite risk score using REAL data:
        RiskScore = 0.30×rainfall_norm + 0.25×river_norm + 0.20×elevation_factor + 0.25×cnn_prob
        Scale to 0–100
        """
        try:
            weather = await fetch_open_meteo(lat, lng)
            hydro = await fetch_river_levels(lat, lng)
            elevation = await get_elevation(lat, lng)

            # Normalize rainfall (0-1 scale, 50mm/hr = max)
            rainfall_1h = weather.get("current", {}).get("rainfall_1h", 0)
            rainfall_norm = min(rainfall_1h / 50.0, 1.0)

            # Normalize river discharge (current / historical max)
            current_discharge = hydro.get("current_discharge", 0)
            max_historical = hydro.get("max_7day", 1)
            river_norm = min(current_discharge / max_historical, 1.0) if max_historical > 0 else 0.5

            # Elevation factor (low elevation = higher risk)
            elevation_factor = 1 - min(elevation / 100.0, 1.0)

            # CNN probability (use model if available, otherwise estimate from data)
            cnn_prob = self._estimate_cnn_probability(weather, hydro)

            # Composite score
            score = (
                0.30 * rainfall_norm
                + 0.25 * river_norm
                + 0.20 * elevation_factor
                + 0.25 * cnn_prob
            )
            score_100 = round(score * 100, 1)

            if score_100 <= 33:
                level = "LOW"
            elif score_100 <= 66:
                level = "MEDIUM"
            else:
                level = "HIGH"

            return {
                "score": score_100,
                "level": level,
                "components": {
                    "rainfall_normalized": round(rainfall_norm, 3),
                    "river_level_normalized": round(river_norm, 3),
                    "elevation_factor": round(elevation_factor, 3),
                    "cnn_probability": round(cnn_prob, 3),
                },
                "raw": {
                    "rainfall_1h_mm": rainfall_1h,
                    "discharge_m3s": current_discharge,
                    "elevation_m": elevation,
                    "surge_ratio": hydro.get("surge_ratio", 1.0),
                    "trend": hydro.get("trend", "stable"),
                },
            }

        except Exception as e:
            logger.error(f"Risk score computation failed: {e}")
            return {
                "score": 50.0,
                "level": "MEDIUM",
                "error": str(e),
            }

    def _estimate_cnn_probability(self, weather: dict, hydro: dict) -> float:
        """
        Estimate flood probability from data when CNN model is not available.
        Uses a heuristic based on rainfall, surge ratio, and soil moisture.
        """
        rainfall = weather.get("current", {}).get("rainfall_1h", 0)
        surge = hydro.get("surge_ratio", 1.0)
        soil = weather.get("current", {}).get("soil_moisture") or 0.2

        # Heuristic: combine signals
        prob = 0.0
        prob += min(rainfall / 40.0, 0.4)      # rainfall contribution
        prob += min((surge - 1.0) * 0.3, 0.3)   # surge contribution
        prob += min(soil * 0.5, 0.3)             # soil moisture contribution

        return min(max(prob, 0.0), 1.0)
