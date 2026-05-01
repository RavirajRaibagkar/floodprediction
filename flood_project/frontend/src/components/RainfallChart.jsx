import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts'

export default function RainfallChart({ data = [] }) {
  const { peak, peakIdx, dangerThreshold } = useMemo(() => {
    let peak = 0, peakIdx = 0
    data.forEach((d, i) => { if ((d.rainfall || 0) > peak) { peak = d.rainfall; peakIdx = i } })
    return { peak, peakIdx, dangerThreshold: Math.max(peak * 0.7, 20) }
  }, [data])

  const current = data.length > 0 ? data[data.length - 1] : null

  if (data.length === 0) return null

  return (
    <div style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Rainfall Trend</h3>
          <p className="text-[9px] text-slate-600">Last 72h — mm/hr</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
          <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse"></div>
          <span className="text-[9px] font-medium text-blue-400">LIVE</span>
        </div>
      </div>

      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="rainfallGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 8 }} tickLine={false} axisLine={false} interval={17} />
            <YAxis tick={{ fill: '#475569', fontSize: 8 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', fontSize: '10px', color: '#e2e8f0' }}
              formatter={(val) => [`${Number(val).toFixed(1)} mm/hr`, 'Rainfall']}
            />
            <Area type="monotone" dataKey="rainfall" stroke="#3b82f6" strokeWidth={3} fill="url(#rainfallGrad)" dot={false} />
            <ReferenceLine y={dangerThreshold} stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3"
              label={{ value: 'DANGER', fill: '#ef4444', fontSize: 9, position: 'right' }} />
            {peak > 0 && (
              <ReferenceDot x={data[peakIdx]?.time} y={peak} r={4} fill="#ef4444" stroke="#0f172a" strokeWidth={2}
                label={{ value: `Peak: ${peak.toFixed(1)}`, fill: '#fca5a5', fontSize: 9, position: 'top' }} />
            )}
            {current && (
              <ReferenceDot x={current.time} y={current.rainfall || 0} r={5} fill="#ffffff" stroke="#3b82f6" strokeWidth={2} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
