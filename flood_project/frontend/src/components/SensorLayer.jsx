import { useState, useEffect } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useRegion } from '../context/RegionContext'
import { getSensors } from '../services/api'

function createSensorIcon(status) {
  const colors = {
    active: '#3b82f6',
    warning: '#eab308',
    critical: '#ef4444',
    normal: '#3b82f6'
  }
  const color = colors[status] || colors.active
  
  return L.divIcon({
    className: '',
    html: `
      <div class="live-indicator" style="
        width: 16px; height: 16px; border-radius: 50%;
        background: ${color}; border: 2px solid rgba(255,255,255,0.8);
        box-shadow: 0 0 15px ${color};
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export default function SensorLayer({ sensors }) {
  const { region } = useRegion()
  const [realSensors, setRealSensors] = useState([])

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const res = await getSensors(region.lat, region.lng)
        if (!cancelled && res.data) {
          setRealSensors(res.data)
        }
      } catch (err) {
        console.warn('Sensors fetch failed:', err)
        setRealSensors([])
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [region.lat, region.lng])

  const data = realSensors.length > 0 ? realSensors : (sensors?.length ? sensors : [])

  return (
    <>
      {data.map(sensor => (
        <Marker key={sensor.id} position={[sensor.lat, sensor.lng]}
                icon={createSensorIcon(sensor.status)}>
          <Popup className="sensor-popup">
            <div className="bg-[#1e293b] p-3 rounded-xl border border-white/10 text-slate-200 min-w-[200px] font-sans shadow-2xl">
              <div className="font-bold text-sm mb-3 border-b border-white/10 pb-2">{sensor.name}</div>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-bold text-cyan-400 capitalize">{sensor.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: sensor.status === 'active' ? '#22c55e' : '#eab308' }}>
                    {sensor.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Position:</span>
                  <span className="text-slate-400 font-mono text-[10px]">{sensor.lat.toFixed(4)}, {sensor.lng.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
