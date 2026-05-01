import { useMemo } from 'react'
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, ReferenceArea } from 'recharts'

export default function WaterLevelChart({ data = [] }) {
  const { peak, peakIdx, dangerVal, maxVal } = useMemo(() => {
    let peak = 0, peakIdx = 0, dv = 4
    data.forEach((d, i) => {
      const v = d.level || 0
      if (v > peak) { peak = v; peakIdx = i }
      if (d.danger) dv = d.danger
    })
    return { peak, peakIdx, dangerVal: dv, maxVal: Math.max(peak * 1.2, dv * 1.3) }
  }, [data])

  const current = data.length > 0 ? data[data.length - 1] : null

  if (data.length === 0) return null

  return (
    <div style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Water Level</h3>
          <p className="text-[9px] text-slate-600">River discharge — m³/s</p>
        </div>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-cyan-400 rounded-full"></span><span className="text-slate-500">Level</span></span>
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-red-400 rounded-full"></span><span className="text-slate-500">Danger</span></span>
        </div>
      </div>

      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="dangerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 8 }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fill: '#475569', fontSize: 8 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '8px', fontSize: '10px', color: '#e2e8f0' }}
              formatter={(val, name) => {
                const labels = { level: 'Discharge', upper: 'Upper CI', lower: 'Lower CI', danger: 'Danger' }
                return [`${Number(val).toFixed(2)}`, labels[name] || name]
              }}
            />
            <ReferenceArea y1={dangerVal} y2={maxVal} fill="#ef4444" fillOpacity={0.06} />
            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#waterGrad)" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(15,23,42,0.9)" />
            <Line type="monotone" dataKey="level" stroke="#06b6d4" strokeWidth={3} dot={false} />
            <ReferenceLine y={dangerVal} stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3"
              label={{ value: 'DANGER', fill: '#ef4444', fontSize: 9, position: 'right' }} />
            {peak > 0 && (
              <ReferenceDot x={data[peakIdx]?.time} y={peak} r={4} fill="#ef4444" stroke="#0f172a" strokeWidth={2}
                label={{ value: `Peak: ${peak.toFixed(1)}`, fill: '#fca5a5', fontSize: 9, position: 'top' }} />
            )}
            {current && (
              <ReferenceDot x={current.time} y={current.level || 0} r={5} fill="#ffffff" stroke="#06b6d4" strokeWidth={2} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
