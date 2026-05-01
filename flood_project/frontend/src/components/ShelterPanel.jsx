import { useShelter } from '../context/ShelterContext'

export default function ShelterPanel() {
  const { summary, nearestSafe, selectedShelter, setSelectedShelter, shelterRoute, routeLoading, shelters } = useShelter()

  const nearest = nearestSafe?.shelter
  const dist = nearestSafe?.distance_km

  const safestRoute = shelterRoute?.routes?.[0]
  const riskyRoute = shelterRoute?.routes?.[1]

  // Intelligence: compare help signals vs shelter availability
  const shelterDensity = summary.total
  const hasPriorityZone = shelterDensity < 3

  return (
    <div className="space-y-2.5">
      {/* ═══ RECOMMENDED DESTINATION ═══ */}
      <div className="panel p-3 rounded-lg">
        <h3 className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2">🏠 Recommended Destination</h3>
        {nearest ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-200">{nearest.name || 'Community Shelter'}</span>
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                style={{
                  color: nearest.type === 'hospital' ? '#ef4444' : nearest.type === 'school' ? '#f59e0b' : '#22c55e',
                  background: `${nearest.type === 'hospital' ? '#ef4444' : nearest.type === 'school' ? '#f59e0b' : '#22c55e'}20`,
                  border: `1px solid ${nearest.type === 'hospital' ? '#ef4444' : nearest.type === 'school' ? '#f59e0b' : '#22c55e'}40`,
                }}>
                {nearest.type}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
              <div className="text-slate-500">Dist: <span className="text-cyan-300">{dist} km</span></div>
              <div className="text-slate-500">Cap: <span className="text-slate-200">{nearest.capacity}</span></div>
              <div className="text-slate-500 text-right">
                {nearest.resources?.length > 0 ? nearest.resources.map(r => r === 'beds' ? '🛏' : r === 'food' ? '🍽' : r === 'medical' ? '💊' : r === 'food_water' ? '🥤' : '🔌').join(' ') : '—'}
              </div>
            </div>

            {/* Route safety */}
            {selectedShelter?.public_id === nearest.public_id && safestRoute && (
              <div className="space-y-1 mt-1">
                <div className="flex items-center justify-between p-1.5 rounded-md bg-green-500/8 border border-green-500/15">
                  <span className="text-[9px] text-green-300 font-medium">{safestRoute.label}</span>
                  <span className="text-[9px] font-mono text-green-400">{safestRoute.distance_km} km • {safestRoute.duration_min} min ✅</span>
                </div>
                {riskyRoute && (
                  <div className="flex items-center justify-between p-1.5 rounded-md bg-red-500/5 border border-red-500/10 opacity-60">
                    <span className="text-[9px] text-red-300 font-medium">{riskyRoute.label}</span>
                    <span className="text-[9px] font-mono text-red-400">{riskyRoute.distance_km} km • {riskyRoute.duration_min} min ❌</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedShelter(nearest)}
              disabled={routeLoading}
              className={`w-full mt-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                selectedShelter?.public_id === nearest.public_id
                  ? 'bg-green-500/15 border border-green-500/30 text-green-300'
                  : 'bg-blue-500/10 border border-blue-500/25 text-blue-300 hover:bg-blue-500/20'
              }`}>
              {routeLoading ? '⏳ Computing route…' : selectedShelter?.public_id === nearest.public_id ? '✓ Navigating' : '🗺 Navigate'}
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 py-2">No shelters available nearby</div>
        )}
      </div>

      {/* ═══ COMMUNITY SUPPORT STATS ═══ */}
      <div className="panel p-3 rounded-lg">
        <h3 className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2">🟢 Shelter Availability</h3>
        <div className="space-y-1 text-[11px] text-slate-300">
          <div className="flex items-center justify-between">
            <span>🏥 Hospitals</span>
            <span className="font-mono text-red-300">{summary.hospitals}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>🏫 Schools</span>
            <span className="font-mono text-amber-300">{summary.schools}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>🏛 Government</span>
            <span className="font-mono text-cyan-300">{summary.government}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>🏠 Community</span>
            <span className="font-mono text-green-300">{summary.community}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-white/5">
            <span className="font-medium text-slate-200">Total Capacity</span>
            <span className="font-mono text-blue-300">~{summary.estimated_capacity}</span>
          </div>
        </div>
      </div>

      {/* ═══ INTELLIGENCE LAYER ═══ */}
      <div className="panel p-3 rounded-lg">
        <h3 className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2">🧠 Shelter Intelligence</h3>
        {hasPriorityZone ? (
          <div className="p-2 rounded-md bg-red-500/8 border border-red-500/15">
            <div className="text-[10px] font-bold text-red-300 mb-1">⚠ HIGH PRIORITY ZONE</div>
            <div className="text-[9px] text-red-200/70">Few or no shelters available in this area. More community support is needed.</div>
          </div>
        ) : (
          <div className="p-2 rounded-md bg-green-500/8 border border-green-500/15">
            <div className="text-[10px] font-bold text-green-300 mb-1">✓ SUPPORT AVAILABLE</div>
            <div className="text-[9px] text-green-200/70">{summary.total} shelters nearby with ~{summary.estimated_capacity} total capacity.</div>
          </div>
        )}
      </div>
    </div>
  )
}
