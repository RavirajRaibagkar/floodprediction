import { useState, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

const tabs = [
    { id: 'classifier', label: 'CNN Flood Detector', icon: '🔍' },
    { id: 'segmentation', label: 'Flood Segmentation', icon: '🎨' },
    { id: 'lstm', label: 'LSTM Forecast', icon: '📈' },
]

function generateForecastData() {
    const data = []
    for (let i = 0; i < 48; i++) {
        const val = 2.5 + Math.sin(i / 8) * 1.5 + (Math.random() - 0.5) * 0.5
        data.push({
            hour: `+${i}h`,
            predicted: parseFloat(val.toFixed(2)),
            upper: parseFloat((val + 0.4 + Math.random() * 0.3).toFixed(2)),
            lower: parseFloat((val - 0.4 - Math.random() * 0.3).toFixed(2)),
        })
    }
    return data
}

export default function AIModels() {
    const [activeTab, setActiveTab] = useState('classifier')
    const [classifierResult, setClassifierResult] = useState(null)
    const [segmentationResult, setSegmentationResult] = useState(null)
    const [lstmData] = useState(generateForecastData)
    const [uploading, setUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const fileInputRef = useRef(null)

    const handleImageUpload = (e, type) => {
        const file = e.target.files?.[0]
        if (!file) return

        setPreviewUrl(URL.createObjectURL(file))
        setUploading(true)

        // Simulate API call
        setTimeout(() => {
            if (type === 'classifier') {
                setClassifierResult({
                    flood_probability: parseFloat((Math.random() * 0.6 + 0.3).toFixed(3)),
                    confidence: parseFloat((Math.random() * 0.2 + 0.8).toFixed(3)),
                    bbox: [45, 32, 180, 195],
                })
            } else {
                setSegmentationResult({
                    flood_percentage: parseFloat((Math.random() * 40 + 10).toFixed(1)),
                    mask_generated: true,
                })
            }
            setUploading(false)
        }, 2000)
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold gradient-text">AI Model Visualization</h1>
                <p className="text-sm text-slate-500 mt-1">Deep learning flood analysis & forecasting models</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-blue-400 border border-blue-500/20 shadow-lg'
                                : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="glass-card p-6">
                {activeTab === 'classifier' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">🔍</div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-200">CNN Flood Classifier</h2>
                                <p className="text-xs text-slate-500">Upload a satellite image → get flood probability + bounding box</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Upload area */}
                            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-blue-500/30 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                                    onChange={(e) => handleImageUpload(e, 'classifier')} />
                                {previewUrl && activeTab === 'classifier' ? (
                                    <div className="relative">
                                        <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                                        {classifierResult?.bbox && (
                                            <div className="absolute border-2 border-red-500 rounded"
                                                style={{
                                                    left: `${classifierResult.bbox[0]}px`, top: `${classifierResult.bbox[1]}px`,
                                                    width: `${classifierResult.bbox[2]}px`, height: `${classifierResult.bbox[3]}px`,
                                                    boxShadow: '0 0 10px rgba(239,68,68,0.5)'
                                                }} />
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-4xl mb-3">🛰️</div>
                                        <p className="text-sm text-slate-400">Click to upload satellite image</p>
                                        <p className="text-xs text-slate-600 mt-1">PNG, JPG, TIF — 224×224 recommended</p>
                                    </>
                                )}
                            </div>

                            {/* Results */}
                            <div className="space-y-4">
                                {uploading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4">
                                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                        <p className="text-sm text-slate-400">Running CNN inference...</p>
                                    </div>
                                ) : classifierResult ? (
                                    <>
                                        <ResultCard label="Flood Probability"
                                            value={`${(classifierResult.flood_probability * 100).toFixed(1)}%`}
                                            color={classifierResult.flood_probability > 0.5 ? '#ef4444' : '#22c55e'} />
                                        <ResultCard label="Model Confidence"
                                            value={`${(classifierResult.confidence * 100).toFixed(1)}%`}
                                            color="#3b82f6" />
                                        <ResultCard label="Bounding Box"
                                            value={`[${classifierResult.bbox.join(', ')}]`}
                                            color="#8b5cf6" />
                                        <div className="text-[10px] text-slate-600 mt-4">
                                            Model: CNN 3-layer (Conv2D+MaxPool) → Dense(128) → Sigmoid
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                                        Upload an image to see results
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'segmentation' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl">🎨</div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-200">CNN Flood Segmentation (U-Net)</h2>
                                <p className="text-xs text-slate-500">Pixel-level flood mask overlaid on original image</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-purple-500/30 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                                    onChange={(e) => handleImageUpload(e, 'segmentation')} />
                                {previewUrl && activeTab === 'segmentation' ? (
                                    <div className="relative">
                                        <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                                        {segmentationResult?.mask_generated && (
                                            <div className="absolute inset-0 bg-blue-500/20 rounded-lg"
                                                style={{ mixBlendMode: 'overlay' }}>
                                                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] text-blue-300">
                                                    Flood Mask Overlay
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-4xl mb-3">🎨</div>
                                        <p className="text-sm text-slate-400">Click to upload satellite image</p>
                                        <p className="text-xs text-slate-600 mt-1">256×256 recommended for U-Net</p>
                                    </>
                                )}
                            </div>

                            <div className="space-y-4">
                                {uploading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4">
                                        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                                        <p className="text-sm text-slate-400">Running U-Net segmentation...</p>
                                    </div>
                                ) : segmentationResult ? (
                                    <>
                                        <ResultCard label="Flood Coverage" value={`${segmentationResult.flood_percentage}%`} color="#8b5cf6" />
                                        <ResultCard label="Mask Generated" value="Yes ✓" color="#22c55e" />
                                        <ResultCard label="Output Size" value="256 × 256 px" color="#06b6d4" />
                                        <div className="text-[10px] text-slate-600 mt-4">
                                            Model: U-Net (4-level encoder/decoder) — Dice + BCE Loss
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                                        Upload an image to see flood mask
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'lstm' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl">📈</div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-200">LSTM Flood Forecaster</h2>
                                <p className="text-xs text-slate-500">48-hour water level prediction with confidence intervals</p>
                            </div>
                        </div>

                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={lstmData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="lstmGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false}
                                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} interval={5} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false}
                                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                                    <Tooltip contentStyle={{
                                        background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(6,182,212,0.2)',
                                        borderRadius: '12px', fontSize: '12px', color: '#e2e8f0'
                                    }} />
                                    <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ciGradient)" />
                                    <Area type="monotone" dataKey="lower" stroke="none" fill="#0a0e1a" />
                                    <Area type="monotone" dataKey="predicted" stroke="#06b6d4" fill="url(#lstmGradient)"
                                        strokeWidth={2.5} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <ResultCard label="Peak Predicted" value="3.8 m" color="#ef4444" />
                            <ResultCard label="Mean Level" value="2.6 m" color="#06b6d4" />
                            <ResultCard label="Model" value="LSTM(128,64)" color="#8b5cf6" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function ResultCard({ label, value, color }) {
    return (
        <div className="glass-card p-4 flex items-center justify-between" style={{ borderColor: `${color}20` }}>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</span>
            <span className="text-lg font-bold font-mono" style={{ color }}>{value}</span>
        </div>
    )
}
