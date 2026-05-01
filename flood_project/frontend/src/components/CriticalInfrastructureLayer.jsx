import { useState, useEffect } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useRegion } from '../context/RegionContext'
import { getInfrastructure } from '../services/api'

function getIconHtml(type, isInFloodZone) {
  const emojis = {
    hospital: '🏥', school: '🏫', power: '⚡',
    shelter: '🏠', police: '🚔', fire_station: '🚒',
  }
  const colors = {
    hospital: '#ef4444', school: '#22c55e', power: '#eab308',
    shelter: '#3b82f6', police: '#6366f1', fire_station: '#f97316',
  }
  const emoji = emojis[type] || '📍'
  const bgColor = colors[type] || '#64748b'

  return `
    <div style="
      position: relative;
      width: 28px; height: 28px; border-radius: 6px;
      background: ${bgColor};
      border: 2px solid rgba(255,255,255,0.9);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      z-index: ${isInFloodZone ? 10 : 1};
    ">
      ${emoji}
      ${isInFloodZone ? `<div style="
        position: absolute; inset: -6px; border-radius: 8px;
        border: 2px solid #ef4444; background: rgba(239, 68, 68, 0.2);
        animation: pulse 1.5s infinite; pointer-events: none;
      "></div>` : ''}
    </div>
  `
}

export default function CriticalInfrastructureLayer() {
  const { region } = useRegion()
  const [facilities, setFacilities] = useState([])

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const res = await getInfrastructure(region.lat, region.lng)
        if (!cancelled && res.data) {
          setFacilities(res.data)
        }
      } catch (err) {
        console.warn('Infrastructure fetch failed:', err)
        setFacilities([])
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [region.lat, region.lng])

  if (!facilities.length) return null

  return (
    <>
      {facilities.map((infra, idx) => {
        const icon = L.divIcon({
          className: '',
          html: getIconHtml(infra.type, false),
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })

        return (
          <Marker key={infra.osm_id || idx} position={[infra.lat, infra.lng]} icon={icon}>
            <Popup className="dark-popup">
              <div style={{ fontFamily: 'Inter,sans-serif', color: '#f1f5f9', minWidth: '200px', background: '#1e293b', padding: '4px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getEmoji(infra.type)} {infra.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Type</span>
                  <span style={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '11px', textTransform: 'capitalize' }}>{infra.type.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Coords</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}>{infra.lat.toFixed(4)}, {infra.lng.toFixed(4)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Source</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', background: '#3b82f620', color: '#60a5fa', border: '1px solid #3b82f650' }}>OpenStreetMap</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

function getEmoji(type) {
  const map = { hospital: '🏥', school: '🏫', power: '⚡', shelter: '🏠', police: '🚔', fire_station: '🚒' }
  return map[type] || '📍'
}
