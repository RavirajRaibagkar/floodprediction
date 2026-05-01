import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getEmergencySignalsSummary, listEmergencySignals } from '../services/api'

function safeParseBbox(b) {
  if (!b) return null
  const { _southWest, _northEast } = b
  if (!_southWest || !_northEast) return null
  const south = _southWest.lat
  const west = _southWest.lng
  const north = _northEast.lat
  const east = _northEast.lng
  return `${south},${west},${north},${east}`
}

export default function useEmergencySignals({ getMapBounds, pollMs = 5000 } = {}) {
  const [signals, setSignals] = useState([])
  const [summary, setSummary] = useState({ help: 0, stranded: 0, safe: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const lastBboxRef = useRef(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const bounds = getMapBounds?.()
      const bbox = safeParseBbox(bounds)
      lastBboxRef.current = bbox
      const [listRes, sumRes] = await Promise.all([
        listEmergencySignals(bbox ? { bbox } : {}),
        getEmergencySignalsSummary(),
      ])
      setSignals(listRes.data || [])
      setSummary(sumRes.data || { help: 0, stranded: 0, safe: 0, total: 0 })
    } catch (e) {
      // Keep last known state; fail silently for resilience during emergencies.
      console.warn('Emergency signals refresh failed:', e)
    } finally {
      setLoading(false)
    }
  }, [getMapBounds])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, pollMs)
    return () => clearInterval(t)
  }, [pollMs, refresh])

  const counts = useMemo(() => ({
    help: summary.help || 0,
    stranded: summary.stranded || 0,
    safe: summary.safe || 0,
    total: summary.total || 0,
  }), [summary])

  return { signals, counts, loading, refresh, lastBbox: lastBboxRef.current }
}

