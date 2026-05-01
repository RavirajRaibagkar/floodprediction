export default function FloodRiskCard({ score = 0, level = 'LOW', details = {} }) {
    const config = {
        LOW: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', emoji: '✅' },
        MEDIUM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', emoji: '⚠️' },
        HIGH: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', emoji: '🔴' },
        CRITICAL: { color: '#991b1b', bg: 'rgba(153,27,27,0.15)', border: 'rgba(153,27,27,0.4)', emoji: '🚨' },
    }
    const c = config[level] || config.LOW

    return (
        <div className="glass-card p-6 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20"
                style={{ background: c.color }} />

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Flood Risk Score
                </h3>
                <span className="text-2xl">{c.emoji}</span>
            </div>

            {/* Score circle */}
            <div className="flex items-center gap-6">
                <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke={c.color} strokeWidth="8"
                            strokeDasharray={`${score * 2.64} 264`} strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 1s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold" style={{ color: c.color }}>{score}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">/ 100</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider inline-block"
                        style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                        {level} Risk
                    </div>
                    {details.rainfall_normalized !== undefined && (
                        <div className="space-y-1.5 mt-3">
                            <Bar label="Rainfall" value={details.rainfall_normalized} color="#3b82f6" />
                            <Bar label="River Level" value={details.river_level_normalized} color="#06b6d4" />
                            <Bar label="Elevation" value={details.elevation_factor} color="#8b5cf6" />
                            <Bar label="CNN Prob" value={details.cnn_probability} color="#f43f5e" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function Bar({ label, value = 0, color }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-16 truncate">{label}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value * 100}%`, background: color }} />
            </div>
            <span className="text-[10px] font-mono text-slate-400">{(value * 100).toFixed(0)}%</span>
        </div>
    )
}
