import { useEffect, useState } from 'react'

export default function AlertsPanel({ alerts = [] }) {
    const severityConfig = {
        low: { color: '#22c55e', label: 'LOW', icon: 'ℹ️' },
        medium: { color: '#f59e0b', label: 'MED', icon: '⚠️' },
        high: { color: '#ef4444', label: 'HIGH', icon: '🔴' },
        critical: { color: '#dc2626', label: 'CRIT', icon: '🚨' },
    }

    const [nowMs, setNowMs] = useState(() => Date.now())
    useEffect(() => {
        const t = setInterval(() => setNowMs(Date.now()), 60_000)
        return () => clearInterval(t)
    }, [])

    const formatTime = (ts) => {
        const d = new Date(ts)
        const diff = Math.floor((nowMs - d.getTime()) / 60000)
        if (diff < 1) return 'Just now'
        if (diff < 60) return `${diff}m ago`
        return `${Math.floor(diff / 60)}h ago`
    }

    return (
        <div className="glass-card p-6 flex flex-col" style={{ maxHeight: '400px' }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Live Alerts
                </h3>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
                    <span className="text-[10px] font-medium text-red-400">{alerts.length} Active</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {alerts.map((alert) => {
                    const config = severityConfig[alert.severity] || severityConfig.low
                    return (
                        <div key={alert.id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200 group">
                            <span className="text-sm mt-0.5">{config.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
                                        style={{
                                            color: config.color,
                                            background: `${config.color}15`,
                                            border: `1px solid ${config.color}30`
                                        }}>
                                        {config.label}
                                    </span>
                                    <span className="text-[10px] text-slate-600">{formatTime(alert.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {alerts.length === 0 && (
                    <div className="text-center py-8 text-slate-600 text-sm">
                        No active alerts
                    </div>
                )}
            </div>
        </div>
    )
}
