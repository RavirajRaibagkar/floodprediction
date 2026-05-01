import { useState, useEffect } from 'react'
import { Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useRegion } from '../context/RegionContext'
import { getEvacuationRoute } from '../services/api'

const shelterIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:6px;
    background:linear-gradient(135deg,#22c55e, #15803d);
    border:2px solid rgba(255,255,255,0.8);
    box-shadow:0 0 15px rgba(34,197,94,0.6);
    display:flex;align-items:center;justify-content:center;
    font-size:14px;color:white;
  ">🏥</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export default function EvacuationRoutes({ routes, selectedRouteId }) {
  const { region } = useRegion()
  const [realRoutes, setRealRoutes] = useState([])

  // Fetch real routes from OSRM when region changes
  useEffect(() => {
    let cancelled = false
    async function fetchRoutes() {
      try {
        // Route from region center to a point ~5km south-west (simulated shelter)
        const destLat = region.lat - 0.03
        const destLng = region.lng - 0.04
        const res = await getEvacuationRoute(region.lat, region.lng, destLat, destLng)
        if (!cancelled && res.data && res.data.routes) {
          const routeColors = ['#22c55e', '#eab308', '#ef4444']
          const routeStatusLabels = ['Safe', 'Moderate Risk', 'CRITICAL AVOID']
          const mapped = res.data.routes.map((r, i) => ({
            id: r.id || `route_${i}`,
            name: r.label || `Route ${i + 1}`,
            color: routeColors[i] || '#64748b',
            status: routeStatusLabels[i] || 'Unknown',
            distance: `${r.distance_km} km`,
            time: `${r.duration_min} min`,
            floodRisk: `${r.risk_score}`,
            destination: 'Nearest Shelter',
            path: r.coordinates || [],
          }))
          setRealRoutes(mapped)
        }
      } catch (err) {
        console.warn('Route fetch failed:', err)
        setRealRoutes([])
      }
    }
    fetchRoutes()
    return () => { cancelled = true }
  }, [region.lat, region.lng])

  const data = realRoutes.length > 0 ? realRoutes : (routes?.length ? routes : [])

  if (!data.length) return null

  return (
    <>
      {data.map((route, idx) => {
        const isSafest = idx === 0
        const isSelected = selectedRouteId === route.id || (!selectedRouteId && isSafest)
        
        if (!route.path || route.path.length < 2) return null

        return (
          <div key={route.id}>
            {/* Glow for selected route */}
            {isSelected && (
              <Polyline 
                positions={route.path} 
                pathOptions={{
                  color: route.color,
                  weight: isSafest ? 12 : 8,
                  opacity: 0.3,
                  lineCap: 'round',
                  lineJoin: 'round',
                  className: 'route-glow-effect'
                }}
              />
            )}

            {/* Main Line */}
            <Polyline 
              positions={route.path} 
              pathOptions={{
                color: route.color, 
                weight: isSafest ? 6 : 4,
                opacity: isSelected ? 1 : 0.4,
                dashArray: idx === 2 ? '5, 10' : (isSafest ? '10, 10' : ''),
                lineCap: 'round', 
                lineJoin: 'round',
                className: isSafest ? 'route-path-animated' : ''
              }} 
            >
              <Popup className="route-popup">
                <div className="bg-[#1e293b] p-3 rounded-xl border border-white/10 text-slate-200 min-w-[220px] font-sans shadow-2xl">
                  <div className="font-bold text-sm mb-2 pb-2 border-b border-white/10 flex items-center justify-between">
                    {route.name} {isSafest && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 ml-2">SAFEST</span>}
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: route.color, boxShadow: `0 0 8px ${route.color}` }}></div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0f172a] p-2 rounded border border-white/5">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Distance</p>
                        <p className="font-bold font-mono text-cyan-400">{route.distance}</p>
                      </div>
                      <div className="bg-[#0f172a] p-2 rounded border border-white/5">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Est. Time</p>
                        <p className="font-bold font-mono text-cyan-400">{route.time}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Flood Risk:</span>
                        <span className="font-bold border px-1.5 rounded text-[10px] uppercase font-mono" style={{ borderColor: `${route.color}50`, color: route.color, background: `${route.color}15` }}>
                          {route.floodRisk}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="text-slate-100 font-bold">{route.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Polyline>

            {/* Shelter Icon at destination */}
            {(isSafest || isSelected) && route.path.length > 0 && (
              <Marker position={route.path[route.path.length - 1]} icon={shelterIcon}>
                <Popup>
                  <div className="font-bold text-slate-800 font-sans">🏥 Safe Destination: {route.destination}</div>
                </Popup>
              </Marker>
            )}
          </div>
        )
      })}
    </>
  )
}
