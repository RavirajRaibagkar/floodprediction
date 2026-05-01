import { useMemo } from 'react'
import { CircleMarker, GeoJSON, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import * as turf from '@turf/turf'

function iconForStatus(status) {
  const cfg = {
    help: { emoji: '🔴', color: '#ef4444' },
    stranded: { emoji: '🟡', color: '#eab308' },
    safe: { emoji: '🟢', color: '#22c55e' },
  }[status] || { emoji: '⚪', color: '#94a3b8' }

  return L.divIcon({
    className: 'emergency-signal-icon',
    html: `<div style="
      width: 26px; height: 26px; border-radius: 999px;
      display:flex; align-items:center; justify-content:center;
      background: rgba(15,23,42,0.85);
      border: 1px solid ${cfg.color}55;
      box-shadow: 0 0 14px ${cfg.color}33;
      font-size: 14px;
    ">${cfg.emoji}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

function labelForStatus(status) {
  return status === 'help' ? 'Need Help'
    : status === 'stranded' ? 'Waiting / Stranded'
    : status === 'safe' ? 'Safe'
    : 'Unknown'
}

export default function EmergencySignalsLayer({ signals = [] }) {
  const helpClusters = useMemo(() => {
    const help = signals.filter(s => s.status === 'help' && typeof s.lat === 'number' && typeof s.lng === 'number')
    if (help.length < 3) return []

    const pts = turf.featureCollection(help.map(s => turf.point([s.lng, s.lat], { public_id: s.public_id })))
    const clustered = turf.clustersDbscan(pts, 0.6, { units: 'kilometers' }) // ~600m

    const byCluster = new Map()
    for (const f of clustered.features) {
      const cid = f.properties?.cluster
      if (cid === undefined || cid === null) continue
      const arr = byCluster.get(cid) || []
      arr.push(f)
      byCluster.set(cid, arr)
    }

    const clusters = []
    for (const [cid, features] of byCluster.entries()) {
      if (features.length < 3) continue
      const fc = turf.featureCollection(features)
      const center = turf.center(fc)
      clusters.push({
        id: `help-${cid}`,
        count: features.length,
        lat: center.geometry.coordinates[1],
        lng: center.geometry.coordinates[0],
        hull: turf.convex(fc) || null,
      })
    }
    return clusters
  }, [signals])

  const priorityZones = useMemo(() => {
    const zones = helpClusters
      .filter(c => c.count >= 3)
      .map(c => {
        if (c.hull) return c.hull
        return turf.circle([c.lng, c.lat], 0.4, { units: 'kilometers', steps: 24 })
      })
    return zones.length ? turf.featureCollection(zones) : null
  }, [helpClusters])

  return (
    <>
      {priorityZones && (
        <GeoJSON
          key="priority-zones"
          data={priorityZones}
          style={() => ({
            color: '#ef4444',
            weight: 2,
            opacity: 0.9,
            fillColor: '#ef4444',
            fillOpacity: 0.12,
            dashArray: '6, 6',
          })}
        />
      )}

      {helpClusters.map(c => (
        <CircleMarker
          key={c.id}
          center={[c.lat, c.lng]}
          radius={18}
          pathOptions={{ color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.08 }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
            {`High Priority Zone • ${c.count} need help`}
          </Tooltip>
        </CircleMarker>
      ))}

      {signals.map(s => (
        <Marker
          key={`${s.public_id}-${s.updated_at}`}
          position={[s.lat, s.lng]}
          icon={iconForStatus(s.status)}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{`${labelForStatus(s.status)}`}</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>{`Anonymous ID: ${s.public_id}`}</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>{`Last updated: ${new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</div>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}

