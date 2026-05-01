import { useState, useEffect } from 'react'

const SEVERITY_COLORS = {
  critical: { dot: '🔴', text: 'text-red-400' },
  high:     { dot: '🟠', text: 'text-orange-400' },
  medium:   { dot: '🟡', text: 'text-yellow-400' },
  low:      { dot: '🟢', text: 'text-green-400' },
  info:     { dot: '⚪', text: 'text-slate-400' },
}

export default function BottomDataStream({ liveAlerts = [], className = '' }) {
  const [events, setEvents] = useState([
    { id: 4, time: '12:36 PM', msg: 'Evacuation route A3 recalculated', severity: 'low' },
    { id: 3, time: '12:35 PM', msg: 'CNN & LSTM fusion: flood probability elevated to 67%', severity: 'high' },
    { id: 2, time: '12:34 PM', msg: 'Sensor WS_12 water level increased to 3.8m', severity: 'medium' },
    { id: 1, time: '12:32 PM', msg: 'Abnormal rainfall spike in grid sector 4B', severity: 'critical' },
  ])

  useEffect(() => {
    if (liveAlerts.length > 0) {
      const latest = liveAlerts[0]
      if (latest?.message) {
        const time = latest.timestamp
          ? new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const newEvent = { id: latest.id || Date.now(), time, msg: latest.message, severity: latest.severity || 'info' }
        queueMicrotask(() => {
          setEvents(prev => {
            if (prev[0]?.id === newEvent.id) return prev
            return [newEvent, ...prev].slice(0, 15)
          })
        })
      }
    }
  }, [liveAlerts])

  useEffect(() => {
    const msgs = [
      { msg: 'River bank overflow detected by Satellite T3', severity: 'critical' },
      { msg: 'Traffic density increased by 15% on Evac-Route 2', severity: 'low' },
      { msg: 'Sensor WS_8 reporting normal stabilization', severity: 'low' },
      { msg: 'Rainfall forecast reduced for upcoming 2 hours', severity: 'medium' },
      { msg: 'Heavy rainfall detected in Zone 11', severity: 'high' },
    ]
    const interval = setInterval(() => {
      const now = new Date()
      const timeFmt = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const randEvent = msgs[Math.floor(Math.random() * msgs.length)]
      setEvents(prev => [{ id: Date.now(), time: timeFmt, ...randEvent }, ...prev].slice(0, 15))
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`bottom-ticker h-9 bg-[#0a0e1a] border-t border-white/5 flex items-center px-3 shrink-0 font-mono text-[10px] overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 whitespace-nowrap px-2 border-r border-white/10 h-full text-slate-500 mr-3 tracking-widest uppercase">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></span>
        Live Feed
      </div>
      
      <div className="flex gap-8 overflow-x-hidden animate-slide relative flex-1">
        {events.map((ev) => {
          const sev = SEVERITY_COLORS[ev.severity] || SEVERITY_COLORS.info
          return (
            <div key={ev.id} className="flex items-center gap-1.5 whitespace-nowrap min-w-max">
              <span className="text-[9px]">{sev.dot}</span>
              <span className="text-slate-600">{ev.time}</span>
              <span className="text-slate-700">—</span>
              <span className={sev.text}>{ev.msg}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
