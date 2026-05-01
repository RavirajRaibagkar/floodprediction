import { useState, useEffect } from 'react'
import { GeoJSON } from 'react-leaflet'
import { useRegion } from '../context/RegionContext'
import { getFloodZones } from '../services/api'
import * as turf from '@turf/turf'

function getColor(score) {
  if (score >= 80) return '#ef4444'
  if (score >= 60) return '#f97316'
  if (score >= 30) return '#eab308'
  return '#22c55e'
}

function getStatusText(score) {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH RISK'
  if (score >= 30) return 'MODERATE'
  return 'SAFE'
}

export default function FloodLayer() {
  const { region } = useRegion()
  const [realZones, setRealZones] = useState(null)
  const timeOffset = 0

  // Fetch real water body GeoJSON from backend
  useEffect(() => {
    let cancelled = false
    async function fetchZones() {
      try {
        const res = await getFloodZones(region.lat, region.lng)
        if (!cancelled && res.data) {
          // Add risk scores to features based on waterway type
          const features = (res.data.features || []).map((f, i) => ({
            ...f,
            properties: {
              ...f.properties,
              risk_score: f.properties.risk_score || _estimateRisk(f, timeOffset, i),
              zone_name: f.properties.name || f.properties.zone_name || `Water Body ${i + 1}`,
              confidence: Math.max(60, 95 - timeOffset),
            }
          }))
          setRealZones({ type: 'FeatureCollection', features })
        }
      } catch (err) {
        console.warn('Flood zones fetch failed, using generated zones', err)
        setRealZones(null)
      }
    }
    fetchZones()
    return () => { cancelled = true }
  }, [region.lat, region.lng])

  // Use backend data if available, otherwise fall back to generated zones
  const data = realZones && realZones.features?.length > 0
    ? realZones
    : _getDynamicZones(region.lat, region.lng, timeOffset)

  const style = (feature) => ({
    fillColor: getColor(feature.properties.risk_score),
    weight: 2,
    opacity: 0.8,
    color: getColor(feature.properties.risk_score),
    fillOpacity: 0.35,
    dashArray: '4, 4',
    className: 'flood-polygon-animated'
  })

  const onEachFeature = (feature, layer) => {
    const { risk_score, zone_name } = feature.properties
    
    layer.bindPopup(`
      <div style="font-family:Inter,sans-serif; color:#f1f5f9; min-width:180px; background:#1e293b; padding:4px; border-radius:8px;">
        <div style="font-weight:700; font-size:13px; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
          ${zone_name}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Risk</span>
          <span style="font-family:monospace; font-weight:bold; color:#38bdf8;">${typeof risk_score === 'number' ? risk_score.toFixed(1) : risk_score}%</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Time</span>
          <span style="font-family:monospace; font-weight:bold; color:#a855f7;">${timeOffset === 0 ? 'LIVE' : `+${timeOffset} hrs`}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:4px; border-top:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:11px; color:#94a3b8; text-transform:uppercase;">Status</span>
          <span style="
            font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px; text-transform:uppercase;
            background:${getColor(risk_score)}20; color:${getColor(risk_score)}; border:1px solid ${getColor(risk_score)}50;
          ">${getStatusText(risk_score)}</span>
        </div>
      </div>
    `, { className: 'dark-popup' })
  }

  return <GeoJSON key={`flood-${region.lat}-${region.lng}`} data={data} style={style} onEachFeature={onEachFeature} />
}

function _estimateRisk(feature, timeOffset, index) {
  const type = feature.properties?.waterway || feature.properties?.natural
  let base = 40
  if (type === 'river') base = 70
  else if (type === 'stream') base = 50
  else if (type === 'canal') base = 45
  else if (type === 'water') base = 55
  return Math.min(100, base + timeOffset * 2 + (index % 4) * 5)
}

function _getDynamicZones(lat, lng, timeOffset) {
  const multiplier = 1 + (timeOffset * 0.05)
  const centroids = [
    { coordinates: [lng + 0.01, lat + 0.02], baseRisk: 70, name: 'River Floodplain' },
    { coordinates: [lng - 0.01, lat - 0.01], baseRisk: 50, name: 'Central Basin' },
    { coordinates: [lng + 0.03, lat - 0.02], baseRisk: 35, name: 'South Ridge' },
    { coordinates: [lng - 0.02, lat + 0.01], baseRisk: 55 + timeOffset * 2, name: 'Eastern Outflow' },
  ]
  
  const features = centroids.map(centroid => {
    try {
      const risk = Math.min(100, centroid.baseRisk * multiplier)
      const radiusMiles = 0.5 + (risk / 100) * 1.5
      const pt = turf.point(centroid.coordinates)
      const buffered = turf.buffer(pt, radiusMiles, { units: 'miles', steps: 8 })
      const coords = buffered.geometry.coordinates[0].map(coord => [
        coord[0] + (Math.random() - 0.5) * 0.005,
        coord[1] + (Math.random() - 0.5) * 0.005
      ])
      coords[coords.length - 1] = coords[0]
      const line = turf.lineString(coords)
      const smoothedLine = turf.bezierSpline(line, { resolution: 150, sharpness: 0.8 })

      return {
        type: 'Feature',
        properties: { risk_score: risk, zone_name: centroid.name, confidence: Math.max(60, 95 - timeOffset) },
        geometry: { type: 'Polygon', coordinates: [smoothedLine.geometry.coordinates] }
      }
    } catch {
      const pt = turf.point(centroid.coordinates)
      const circ = turf.circle(pt, 0.5 + (centroid.baseRisk / 100 * 1.5), { units: 'miles' })
      return { type: 'Feature', properties: { risk_score: centroid.baseRisk, zone_name: centroid.name, confidence: 90 }, geometry: circ.geometry }
    }
  })
  return { type: 'FeatureCollection', features: features.filter(f => f && f.geometry) }
}
