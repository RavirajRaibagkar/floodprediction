import { useState } from 'react'
import MapView from '../components/MapView'

const layerDefaults = {
    floodZones: true,
    sensors: true,
    evacuation: true,
    satellite: false,
}

export default function LiveMap() {
    const [layers, setLayers] = useState(layerDefaults)

    const toggleLayer = (key) => {
        setLayers(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const layerConfig = [
        { key: 'floodZones', label: 'Flood Zones', icon: '🌊', color: '#ef4444' },
        { key: 'sensors', label: 'Sensors', icon: '📡', color: '#22c55e' },
        { key: 'evacuation', label: 'Evacuation', icon: '🚨', color: '#f59e0b' },
        { key: 'satellite', label: 'Satellite', icon: '🛰️', color: '#8b5cf6' },
    ]

    return (
        <div className="h-screen relative">
            {/* Map */}
            <MapView layers={layers} />

            {/* Floating Control Panel */}
            <div className="absolute top-6 right-6 z-[1000]">
                <div className="glass-card p-4 w-56" style={{ background: 'rgba(10,14,26,0.92)' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        Map Layers
                    </h3>
                    <div className="space-y-2">
                        {layerConfig.map(layer => (
                            <button
                                key={layer.key}
                                onClick={() => toggleLayer(layer.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${layers[layer.key]
                                        ? 'bg-white/10 border border-white/15 text-slate-200'
                                        : 'bg-transparent border border-transparent text-slate-500 hover:bg-white/5'
                                    }`}
                            >
                                <span className="text-sm">{layer.icon}</span>
                                <span className="flex-1 text-left">{layer.label}</span>
                                <div className={`w-7 h-4 rounded-full transition-all duration-200 flex items-center ${layers[layer.key] ? 'justify-end' : 'justify-start'
                                    }`} style={{
                                        background: layers[layer.key] ? `${layer.color}40` : 'rgba(255,255,255,0.1)',
                                        border: `1px solid ${layers[layer.key] ? `${layer.color}60` : 'rgba(255,255,255,0.1)'}`
                                    }}>
                                    <div className={`w-3 h-3 rounded-full mx-0.5 transition-all duration-200`}
                                        style={{ background: layers[layer.key] ? layer.color : '#475569' }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-8 left-6 z-[1000]">
                <div className="glass-card p-3" style={{ background: 'rgba(10,14,26,0.9)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Risk Legend</p>
                    <div className="flex items-center gap-4">
                        <LegendItem color="#22c55e" label="Low (0–33)" />
                        <LegendItem color="#f59e0b" label="Medium (34–66)" />
                        <LegendItem color="#ef4444" label="High (67–100)" />
                    </div>
                </div>
            </div>

            {/* Header Overlay */}
            <div className="absolute top-6 left-6 z-[1000]">
                <div className="glass-card px-5 py-3" style={{ background: 'rgba(10,14,26,0.9)' }}>
                    <h1 className="text-lg font-bold gradient-text">Live Flood Map</h1>
                    <p className="text-[10px] text-slate-500">Real-time geospatial monitoring</p>
                </div>
            </div>
        </div>
    )
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: color, opacity: 0.7 }} />
            <span className="text-[10px] text-slate-400">{label}</span>
        </div>
    )
}
