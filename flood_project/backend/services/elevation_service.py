"""
Elevation Service — fetches real elevation data from Open-Meteo Elevation API.
Free, no API key needed.
"""

import httpx
import time
import logging
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"

# ─── Cache ──────────────────────────────────────────────────
_cache = {}
CACHE_TTL = 86400 * 7  # 7 days — elevation doesn't change

def _cache_key(lat: float, lng: float) -> str:
    return f"elev_{round(lat, 3)}_{round(lng, 3)}"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    reraise=True,
)
async def get_elevation(lat: float, lng: float) -> float:
    """
    Get elevation in meters for a given coordinate.
    Uses Open-Meteo Elevation API (free, global).
    """
    key = _cache_key(lat, lng)
    entry = _cache.get(key)
    if entry and (time.time() - entry["fetched_at"]) < CACHE_TTL:
        return entry["data"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(ELEVATION_URL, params={
                "latitude": lat,
                "longitude": lng,
            })
            resp.raise_for_status()
            data = resp.json()

        elevations = data.get("elevation", [0])
        elevation = elevations[0] if elevations else 0

        _cache[key] = {"data": elevation, "fetched_at": time.time()}
        logger.info(f"Elevation for ({lat}, {lng}): {elevation}m")
        return elevation

    except Exception as e:
        logger.error(f"Elevation fetch failed for ({lat}, {lng}): {e}")
        if entry:
            return entry["data"]
        return 0  # Safe default
