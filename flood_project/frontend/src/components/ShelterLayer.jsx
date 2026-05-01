import { useMemo } from 'react'
import { Marker, Tooltip, CircleMarker, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { useShelter } from '../context/ShelterContext'

function shelterIcon(type) {
  const cfgs = {
    hospital:   { emoji: '🏥', color: '#ef4444' },
    school:     { emoji: '🏫', color: '#f59e0b' },
    government: { emoji: '🏛', color: '#06b6d4' },
    community:  { emoji: '🏠', color: '#22c55e' },
  }
  const cfg = cfgs[type] || cfgs.community
  return L.divIcon({
    className: 'shelter-marker-icon',
    html: `<div style="
      width:32px;height:32px;border-radius:8px;
      display:flex;align-items:center;justify-content:center;
      background:${cfg.color}18;backdrop-filter:blur(8px);
      border:1.5px solid ${cfg.color}50;
      box-shadow:0 0 16px ${cfg.color}30,0 2px 8px rgba(0,0,0,0.3);
      font-size:16px;
    ">${cfg.emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

const TYPE_LABEL = { hospital: 'Hospital', school: 'School / College', government: 'Government Facility', community: 'Community Shelter' }
const TYPE_COLOR = { hospital: '#ef4444', school: '#f59e0b', government: '#06b6d4', community: '#22c55e' }
const RES_LABEL = { beds: '🛏 Beds', food: '🍽 Food', medical: '💊 Medical', food_water: '🥤 Food & Water', charging: '🔌 Charging' }

function timeSince(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ${m % 60}m ago`
}

export default function ShelterLayer() {
  const { shelters, selectedShelter, setSelectedShelter, shelterRoute, userLocation } = useShelter()

  const routeCoords = useMemo(() => {
    if (!shelterRoute?.routes?.length) return null
    return shelterRoute.routes[0].coordinates || null
  }, [shelterRoute])

  const altRouteCoords = useMemo(() => {
    if (!shelterRoute?.routes || shelterRoute.routes.length < 2) return null
    return shelterRoute.routes[1].coordinates || null
  }, [shelterRoute])

  return (
    <>
      {userLocation && (
        <>
          <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={8}
            pathOptions={{ color: '#3b82f6', weight: 2, fillColor: '#3b82f6', fillOpacity: 0.5 }}>
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>📍 Your Location</div>
            </Tooltip>
          </CircleMarker>
          <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={20}
            pathOptions={{ color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.08, dashArray: '4,4' }} />
        </>
      )}

      {routeCoords && (
        <Polyline positions={routeCoords}
          pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.85, dashArray: '8,6', lineCap: 'round' }} />
      )}
      {altRouteCoords && (
        <Polyline positions={altRouteCoords}
          pathOptions={{ color: '#ef4444', weight: 3, opacity: 0.45, dashArray: '6,8', lineCap: 'round' }} />
      )}

      {shelters.map((s) => {
        const sel = selectedShelter?.public_id === s.public_id
        const c = TYPE_COLOR[s.type] || '#94a3b8'
        return (
          <Marker key={s.public_id} position={[s.lat, s.lng]} icon={shelterIcon(s.type)}
            eventHandlers={{ click: () => setSelectedShelter(sel ? null : s) }}>
            <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
              <div style={{ minWidth: 180, fontFamily: 'Inter,sans-serif' }}>
                <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  background: `${c}20`, color: c, border: `1px solid ${c}40`, textTransform: 'uppercase',
                  letterSpacing: '0.5px', marginBottom: 6 }}>
                  {TYPE_LABEL[s.type] || 'Shelter'}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#f1f5f9' }}>
                  {s.name || 'Community Shelter'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  👥 Capacity: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{s.capacity}</span>
                </div>
                {s.resources?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                    {s.resources.map(r => (
                      <span key={r} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3,
                        background: 'rgba(255,255,255,0.08)', color: '#cbd5e1',
                        border: '1px solid rgba(255,255,255,0.06)' }}>
                        {RES_LABEL[r] || r}
                      </span>
                    ))}
                  </div>
                )}
                {!s.is_persistent && (
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>🕐 Updated: {timeSince(s.updated_at)}</div>
                )}
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 10, color: '#3b82f6', fontWeight: 600 }}>
                  {sel ? '✓ Selected — routing…' : 'Click to navigate →'}
                </div>
              </div>
            </Tooltip>
          </Marker>
        )
      })}
    </>
  )
}
