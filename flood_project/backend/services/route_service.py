"""
Route Service — uses OSRM public API for real road routing + flood overlap scoring.
Replaces the old mock Dijkstra graph.
"""

import httpx
import logging
from typing import List, Tuple
from shapely.geometry import LineString, shape
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

OSRM_URL = "https://router.project-osrm.org/route/v1/driving"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    reraise=True,
)
async def compute_routes(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float,
    flood_zones_geojson: dict = None,
) -> list:
    """
    Fetch 3 alternative routes from OSRM and score each for flood risk.
    Returns ranked list of routes with GeoJSON geometry and scores.
    """
    url = f"{OSRM_URL}/{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "alternatives": "true",
        "steps": "true",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        if data.get("code") != "Ok":
            logger.warning(f"OSRM returned: {data.get('code')}")
            return _fallback_route(origin_lat, origin_lng, dest_lat, dest_lng)

        routes = data.get("routes", [])
        scored_routes = []

        for i, route in enumerate(routes):
            geom = route.get("geometry", {})
            distance_m = route.get("distance", 0)
            duration_s = route.get("duration", 0)

            # Score the route against flood zones
            risk_score = 0.0
            river_crossings = 0
            if flood_zones_geojson and geom.get("coordinates"):
                risk_score, river_crossings = _score_flood_overlap(geom, flood_zones_geojson)

            # Compute composite score: lower = safer
            length_ratio = min(distance_m / 10000, 1.0)  # normalize to 10km
            composite = (0.5 * risk_score) + (0.3 * length_ratio) + (0.2 * min(river_crossings / 3, 1.0))

            labels = ["Route A (Safest)", "Route B", "Route C"]
            scored_routes.append({
                "id": f"route_{i}",
                "label": labels[i] if i < 3 else f"Route {i+1}",
                "geometry": geom,
                "distance_km": round(distance_m / 1000, 2),
                "duration_min": round(duration_s / 60, 1),
                "risk_score": round(composite * 100, 1),
                "flood_overlap": round(risk_score * 100, 1),
                "river_crossings": river_crossings,
                "coordinates": _geojson_to_leaflet(geom),
            })

        # Sort by composite score (lowest = safest)
        scored_routes.sort(key=lambda r: r["risk_score"])
        if scored_routes:
            scored_routes[0]["label"] = "Route A (Safest)"

        return scored_routes

    except Exception as e:
        logger.error(f"OSRM routing failed: {e}")
        return _fallback_route(origin_lat, origin_lng, dest_lat, dest_lng)


def _score_flood_overlap(route_geojson: dict, flood_zones_geojson: dict) -> Tuple[float, int]:
    """Score what % of a route intersects with flood zone polygons."""
    try:
        coords = route_geojson.get("coordinates", [])
        if len(coords) < 2:
            return 0.0, 0

        route_line = LineString(coords)
        flood_overlap = 0.0
        river_crossings = 0

        for feature in flood_zones_geojson.get("features", []):
            geom = feature.get("geometry")
            if not geom:
                continue
            try:
                zone_shape = shape(geom)
                if route_line.intersects(zone_shape):
                    intersection = route_line.intersection(zone_shape)
                    flood_overlap += intersection.length / route_line.length
                    river_crossings += 1
            except Exception:
                continue

        return min(flood_overlap, 1.0), river_crossings

    except Exception as e:
        logger.warning(f"Flood overlap scoring failed: {e}")
        return 0.0, 0


def _geojson_to_leaflet(geom: dict) -> list:
    """Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng] format."""
    coords = geom.get("coordinates", [])
    return [[c[1], c[0]] for c in coords]


def _fallback_route(olat, olng, dlat, dlng) -> list:
    """Return a simple straight-line route if OSRM fails."""
    return [{
        "id": "route_fallback",
        "label": "Direct Route (Fallback)",
        "geometry": {"type": "LineString", "coordinates": [[olng, olat], [dlng, dlat]]},
        "distance_km": 0,
        "duration_min": 0,
        "risk_score": 50,
        "flood_overlap": 0,
        "river_crossings": 0,
        "coordinates": [[olat, olng], [dlat, dlng]],
    }]
