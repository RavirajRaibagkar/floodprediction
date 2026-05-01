import { GeoJSON } from 'react-leaflet'
import { useRegion } from '../context/RegionContext'

// Generate population zones around the current region center
function getPopulationZones(lat, lng) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { population: 2300, risk_prob: 72, zone_name: 'East Sector', id: 'Z14' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[lng+0.03, lat], [lng+0.05, lat], [lng+0.05, lat+0.02], [lng+0.03, lat+0.02], [lng+0.03, lat]]]
        }
      },
      {
        type: 'Feature',
        properties: { population: 8500, risk_prob: 85, zone_name: 'Central Plaza', id: 'Z4' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[lng-0.01, lat], [lng+0.01, lat], [lng+0.01, lat+0.02], [lng-0.01, lat+0.02], [lng-0.01, lat]]]
        }
      },
      {
        type: 'Feature',
        properties: { population: 1200, risk_prob: 15, zone_name: 'Northern Heights', id: 'Z22' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[lng-0.03, lat+0.04], [lng-0.01, lat+0.04], [lng-0.01, lat+0.06], [lng-0.03, lat+0.06], [lng-0.03, lat+0.04]]]
        }
      }
    ]
  }
}

function calculateExposureLevel(population, probability) {
  const score = population * probability / 100
  if (score > 3000) return 'HIGH'
  if (score > 1000) return 'MODERATE'
  return 'LOW'
}

function getStyle(feature) {
  const level = calculateExposureLevel(feature.properties.population, feature.properties.risk_prob)
  if (level === 'HIGH') {
    return { fillColor: '#a855f7', weight: 2, opacity: 0.8, color: '#a855f7', fillOpacity: 0.45, dashArray: '2, 6' }
  } else if (level === 'MODERATE') {
    return { fillColor: '#eab308', weight: 1.5, opacity: 0.6, color: '#eab308', fillOpacity: 0.25, dashArray: '2, 6' }
  }
  return { fillColor: 'transparent', weight: 1, opacity: 0.3, color: '#22c55e', fillOpacity: 0.05 }
}

export default function PopulationExposureLayer() {
  const { region } = useRegion()
  const data = getPopulationZones(region.lat, region.lng)

  const onEachFeature = (feature, layer) => {
    const { zone_name, population, risk_prob } = feature.properties
    const level = calculateExposureLevel(population, risk_prob)
    
    layer.bindPopup(`
      <div style="font-family:Inter,sans-serif; color:#f1f5f9; min-width:180px; background:#1e293b; padding:4px; border-radius:8px;">
        <div style="font-weight:700; font-size:13px; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
          ${zone_name}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:11px; color:#94a3b8; text-transform:uppercase;">Est. Population</span>
          <span style="font-family:monospace; font-weight:bold; color:#f8fafc;">${population.toLocaleString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:11px; color:#94a3b8; text-transform:uppercase;">Flood Prob</span>
          <span style="font-family:monospace; font-weight:bold; color:#ef4444;">${risk_prob}%</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:11px; color:#d8b4fe; text-transform:uppercase; font-weight:bold;">Exposure</span>
          <span style="
            font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px; text-transform:uppercase;
            background:${level === 'HIGH' ? '#a855f730' : level === 'MODERATE' ? '#eab30830' : '#22c55e30'}; 
            color:${level === 'HIGH' ? '#d8b4fe' : level === 'MODERATE' ? '#fde047' : '#86efac'}; 
            border:1px solid ${level === 'HIGH' ? '#a855f750' : level === 'MODERATE' ? '#eab30850' : '#22c55e50'};
          ">${level}</span>
        </div>
      </div>
    `, { className: 'dark-popup' })
  }

  return <GeoJSON key={`pop-${region.lat}-${region.lng}`} data={data} style={getStyle} onEachFeature={onEachFeature} />
}
