import { useState, useEffect, useCallback } from 'react'
import { getRiskScore, getWeatherHistory, getSensorLevels } from '../services/api'

// ─── Hook ──────────────────────────────────────────────────
export default function useFloodData(lat = 28.6139, lng = 77.209, refreshInterval = 30000) {
    const [riskScore, setRiskScore] = useState({ score: 62, level: 'MEDIUM' })
    const [rainfallData, setRainfallData] = useState([])
    const [waterLevelData, setWaterLevelData] = useState([])
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        try {
            // Fetch risk score from backend
            const riskRes = await getRiskScore(lat, lng)
            if (riskRes.data) setRiskScore(riskRes.data)
        } catch {
            setRiskScore({
                score: Math.floor(40 + Math.random() * 40),
                level: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
            })
        }

        try {
            // Fetch real weather history for rainfall chart (past 72h)
            const weatherRes = await getWeatherHistory(lat, lng, 72)
            if (weatherRes.data && weatherRes.data.data) {
                const hourly = weatherRes.data.data
                const chartData = hourly.map(h => ({
                    time: h.time ? new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    fullTime: h.time,
                    rainfall: h.precipitation || 0,
                }))
                setRainfallData(chartData)
            }
        } catch {
            // Fallback: generate mock rainfall
            const data = []
            const now = Date.now()
            for (let i = 72; i >= 0; i--) {
                const time = new Date(now - i * 3600000)
                data.push({
                    time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fullTime: time.toISOString(),
                    rainfall: Math.max(0, 15 + Math.sin(i / 6) * 20 + (Math.random() - 0.3) * 12),
                })
            }
            setRainfallData(data)
        }

        try {
            // Fetch real river discharge for water level chart
            const hydroRes = await getSensorLevels(lat, lng)
            if (hydroRes.data && hydroRes.data.daily) {
                const chartData = hydroRes.data.daily.map(d => ({
                    time: d.date,
                    fullTime: d.date,
                    level: d.discharge != null ? parseFloat(d.discharge.toFixed(2)) : 0,
                    upper: d.discharge != null ? parseFloat((d.discharge * 1.15).toFixed(2)) : 0,
                    lower: d.discharge != null ? parseFloat((d.discharge * 0.85).toFixed(2)) : 0,
                    danger: hydroRes.data.danger_threshold || 100,
                    isLive: !d.is_forecast,
                    isForecast: d.is_forecast,
                }))
                setWaterLevelData(chartData)
            }
        } catch {
            // Fallback: generate mock water levels
            const data = []
            const now = Date.now()
            for (let i = 0; i < 24; i++) {
                const time = new Date(now + i * 3600000)
                const predicted = 2.5 + Math.sin(i / 4) * 1.2 + Math.random() * 0.3
                data.push({
                    time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fullTime: time.toISOString(),
                    level: parseFloat(predicted.toFixed(2)),
                    upper: parseFloat((predicted + 0.3).toFixed(2)),
                    lower: parseFloat((predicted - 0.3).toFixed(2)),
                    danger: 4.0,
                })
            }
            setWaterLevelData(data)
        }

        setLoading(false)
    }, [lat, lng])

    useEffect(() => {
        Promise.resolve().then(fetchData)
        // Generate initial alerts (will be replaced by alert engine in Step 8)
        queueMicrotask(() => setAlerts(_generateAlerts()))
        
        const interval = setInterval(fetchData, refreshInterval)
        
        // ─── WebSocket Integration ───
        const alertWS = new WebSocket('ws://localhost:8000/ws/alerts')
        const sensorWS = new WebSocket('ws://localhost:8000/ws/sensors')

        alertWS.onmessage = (event) => {
            const newAlert = JSON.parse(event.data)
            setAlerts(prev => [newAlert, ...prev.slice(0, 19)])
        }

        sensorWS.onmessage = (event) => {
            const update = JSON.parse(event.data)
            setWaterLevelData(prev => {
                const time = new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const newPoint = {
                    time,
                    fullTime: update.timestamp,
                    level: update.water_level,
                    upper: parseFloat((update.water_level + 0.3).toFixed(2)),
                    lower: parseFloat((update.water_level - 0.3).toFixed(2)),
                    danger: 4.0,
                    isLive: true
                }
                return [...prev.slice(-23), newPoint]
            })
        }

        return () => {
            clearInterval(interval)
            alertWS.close()
            sensorWS.close()
        }
    }, [fetchData, refreshInterval])

    return { riskScore, rainfallData, waterLevelData, alerts, loading, refetch: fetchData }
}

// Temporary alert generator (replaced by real alert engine in Step 8)
function _generateAlerts() {
    const severities = ['low', 'medium', 'high', 'critical']
    const messages = [
        'Water level rising at Sensor #12 — upstream tributary',
        'Heavy rainfall detected in Zone A — 45mm/hr',
        'Flood risk elevated near Riverside Park area',
        'Evacuation route A3 temporarily blocked',
        'Sensor #7 reporting abnormal readings',
        'CNN model predicts 78% flood probability in sector B',
        'Soil moisture at saturation point — Zone C',
        'River gauge exceeded warning threshold',
    ]
    return messages.map((msg, i) => ({
        id: i + 1,
        severity: severities[i % severities.length],
        message: msg,
        timestamp: new Date(Date.now() - i * 600000).toISOString(),
        lat: 28.6 + Math.random() * 0.1,
        lng: 77.2 + Math.random() * 0.1,
    }))
}
