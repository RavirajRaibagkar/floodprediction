"""
Weather Service — fetches real weather data from Open-Meteo API.
Free, no API key needed. Global coverage.
"""

import httpx
import time
import logging
from datetime import datetime
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

# ─── Cache ──────────────────────────────────────────────────
_cache = {}  # key: "lat_lng", value: { "data": ..., "fetched_at": timestamp }
CACHE_TTL = 600  # 10 minutes

def _cache_key(lat: float, lng: float) -> str:
    """Bucket to ~1km precision to avoid redundant calls."""
    return f"{round(lat, 2)}_{round(lng, 2)}"


def _get_cached(lat: float, lng: float):
    key = _cache_key(lat, lng)
    entry = _cache.get(key)
    if entry and (time.time() - entry["fetched_at"]) < CACHE_TTL:
        return entry["data"]
    return None


def _set_cached(lat: float, lng: float, data: dict):
    key = _cache_key(lat, lng)
    _cache[key] = {"data": data, "fetched_at": time.time()}


# ─── Open-Meteo API ────────────────────────────────────────
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    reraise=True,
)
async def fetch_open_meteo(lat: float, lng: float) -> dict:
    """
    Fetch comprehensive weather data from Open-Meteo.
    Returns hourly and daily data for past 7 days + 3 day forecast.
    Cached for 10 minutes per ~1km grid cell.
    """
    cached = _get_cached(lat, lng)
    if cached:
        return cached

    params = {
        "latitude": lat,
        "longitude": lng,
        "hourly": ",".join([
            "precipitation", "rain",
            "soil_moisture_0_1cm", "temperature_2m",
            "precipitation_probability", "windspeed_10m"
        ]),
        "daily": ",".join([
            "precipitation_sum", "rain_sum"
        ]),
        "past_days": 7,
        "forecast_days": 3,
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        # Parse into a clean structure
        result = _parse_weather_response(data)
        _set_cached(lat, lng, result)
        logger.info(f"Fetched Open-Meteo weather for ({lat}, {lng})")
        return result

    except Exception as e:
        logger.error(f"Open-Meteo fetch failed for ({lat}, {lng}): {e}")
        # Return last cached value if available (any precision)
        cached = _get_cached(lat, lng)
        if cached:
            logger.warning("Returning stale cache after API failure")
            return cached
        raise


def _parse_weather_response(data: dict) -> dict:
    """Parse Open-Meteo response into a clean, frontend-friendly structure."""
    hourly = data.get("hourly", {})
    daily = data.get("daily", {})

    times = hourly.get("time", [])
    precipitation = hourly.get("precipitation", [])
    rain = hourly.get("rain", [])
    soil_moisture = hourly.get("soil_moisture_0_1cm", [])
    temperature = hourly.get("temperature_2m", [])
    precip_prob = hourly.get("precipitation_probability", [])
    windspeed = hourly.get("windspeed_10m", [])

    # Build hourly records
    hourly_records = []
    for i, t in enumerate(times):
        hourly_records.append({
            "time": t,
            "precipitation": precipitation[i] if i < len(precipitation) else 0,
            "rain": rain[i] if i < len(rain) else 0,
            "soil_moisture": soil_moisture[i] if i < len(soil_moisture) else None,
            "temperature": temperature[i] if i < len(temperature) else None,
            "precipitation_probability": precip_prob[i] if i < len(precip_prob) else None,
            "windspeed": windspeed[i] if i < len(windspeed) else None,
        })

    # Current snapshot (latest hour with data)
    now_idx = min(len(hourly_records) - 1, 7 * 24)  # 7 past days = index ~168
    current = hourly_records[now_idx] if hourly_records else {}

    # Rainfall over last 1h, 6h, 24h
    rainfall_1h = current.get("precipitation", 0)
    rainfall_6h = sum(h.get("precipitation", 0) for h in hourly_records[max(0, now_idx - 6):now_idx + 1])
    rainfall_24h = sum(h.get("precipitation", 0) for h in hourly_records[max(0, now_idx - 24):now_idx + 1])

    return {
        "lat": data.get("latitude"),
        "lng": data.get("longitude"),
        "timezone": data.get("timezone"),
        "current": {
            **current,
            "rainfall_1h": rainfall_1h,
            "rainfall_6h": round(rainfall_6h, 2),
            "rainfall_24h": round(rainfall_24h, 2),
        },
        "hourly": hourly_records,
        "daily": {
            "time": daily.get("time", []),
            "precipitation_sum": daily.get("precipitation_sum", []),
            "rain_sum": daily.get("rain_sum", []),
        },
        "fetched_at": datetime.utcnow().isoformat(),
    }
