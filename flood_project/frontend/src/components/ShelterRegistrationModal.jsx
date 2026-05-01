import { useState, useCallback, useEffect } from 'react'
import { useShelter } from '../context/ShelterContext'

const SHELTER_TYPES = [
  { id: 'school', label: 'School / College', icon: '🏫', desc: 'Educational institution with open spaces', color: '#f59e0b' },
  { id: 'hospital', label: 'Government Hospital', icon: '🏥', desc: 'Public healthcare facility with medical resources', color: '#ef4444' },
  { id: 'hospital_private', label: 'Private Hospital', icon: '🏥', desc: 'Private healthcare facility', color: '#3b82f6' },
  { id: 'community', label: 'Community Support', icon: '🏠', desc: 'Offer temporary shelter or assistance', color: '#22c55e' },
]

const INSTITUTIONAL_RESOURCES = [
  { id: 'beds', label: 'Beds / Sleeping Space', icon: '🛏' },
  { id: 'food', label: 'Food & Water', icon: '🍽' },
  { id: 'medical', label: 'Medical Supplies', icon: '💊' },
]

const COMMUNITY_RESOURCES = [
  { id: 'food_water', label: 'Food & Water', icon: '🥤' },
  { id: 'charging', label: 'Device Charging', icon: '🔌' },
]

const COMMUNITY_CAPACITIES = ['1-2', '3-5', '5+']

export default function ShelterRegistrationModal({ open, onClose }) {
  const { registerShelter, removeShelter, hasActiveShelter } = useShelter()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [resources, setResources] = useState([])
  const [location, setLocation] = useState(null)
  const [geoError, setGeoError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Auto-detect location
  useEffect(() => {
    if (!open) return
    setGeoError(null)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setGeoError('Unable to detect location: ' + err.message),
        { enableHighAccuracy: true, timeout: 12000 }
      )
    } else {
      setGeoError('Geolocation not supported by this browser')
    }
  }, [open])

  const reset = useCallback(() => {
    setStep(1)
    setSelectedType(null)
    setName('')
    setCapacity('')
    setResources([])
    setSuccess(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const toggleResource = (id) => {
    setResources(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  const isInstitutional = selectedType && selectedType !== 'community'
  const effectiveType = selectedType === 'hospital_private' ? 'hospital' : selectedType

  const canSubmit = location && capacity && (isInstitutional ? name.trim() : true)

  const handleSubmit = async () => {
    if (!canSubmit || !location) return
    setSubmitting(true)
    try {
      await registerShelter({
        type: effectiveType,
        name: isInstitutional ? name.trim() : null,
        lat: location.lat,
        lng: location.lng,
        capacity,
        resources,
      })
      setSuccess(true)
      setTimeout(handleClose, 1800)
    } catch (e) {
      console.error('Shelter registration failed:', e)
      setGeoError('Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async () => {
    setSubmitting(true)
    try {
      await removeShelter()
      handleClose()
    } catch (e) {
      console.error('Remove shelter failed:', e)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1224] shadow-2xl overflow-hidden shelter-modal-enter" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[12px] font-extrabold text-slate-100 tracking-wide flex items-center gap-2">
              🏠 {step === 1 ? 'Offer Shelter' : selectedType === 'community' ? 'Community Support' : 'Register Institution'}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              {step === 1 ? 'Choose how you want to help' : 'Anonymous • No personal data required'}
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-200 text-sm transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>
          {success ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <div className="text-lg font-bold text-green-300 mb-2">Shelter Registered!</div>
              <div className="text-[11px] text-slate-400">Your shelter is now visible to people who need help.</div>
            </div>
          ) : step === 1 ? (
            /* ═══ STEP 1: Choose Type ═══ */
            <div className="space-y-2.5">
              <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-3">Select Shelter Type</div>
              {SHELTER_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => { setSelectedType(type.id); setStep(2) }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group hover:scale-[1.01]"
                  style={{
                    borderColor: `${type.color}25`,
                    background: `${type.color}08`,
                  }}
                >
                  <div className="text-2xl w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${type.color}15`, border: `1px solid ${type.color}30` }}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold text-slate-200 group-hover:text-white">{type.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{type.desc}</div>
                  </div>
                  <span className="text-slate-500 group-hover:text-slate-300 transition-colors text-sm">→</span>
                </button>
              ))}

              {hasActiveShelter && (
                <div className="mt-4 pt-3 border-t border-white/5">
                  <button onClick={handleRemove} disabled={submitting}
                    className="w-full text-center text-[10px] font-bold px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/8 text-red-300 hover:bg-red-500/15 transition-colors">
                    {submitting ? 'Removing…' : 'Remove My Active Shelter'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ═══ STEP 2: Fill Details ═══ */
            <div className="space-y-4">
              <button onClick={() => { setStep(1); setResources([]) }}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 mb-2 transition-colors">
                ← Back to type selection
              </button>

              {/* Name (institutional only) */}
              {isInstitutional && (
                <div>
                  <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1.5">Organization Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. City General Hospital"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                  />
                </div>
              )}

              {/* Capacity */}
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1.5">
                  Capacity {isInstitutional ? '(number of people)' : ''}
                </label>
                {isInstitutional ? (
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 50"
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                  />
                ) : (
                  <div className="flex gap-2">
                    {COMMUNITY_CAPACITIES.map(cap => (
                      <button
                        key={cap}
                        onClick={() => setCapacity(cap)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-[12px] font-bold transition-all ${
                          capacity === cap
                            ? 'bg-green-500/15 border-green-500/40 text-green-300'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {cap} {cap === '5+' ? 'people' : 'people'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Resources */}
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1.5">
                  Available Resources {!isInstitutional && '(optional)'}
                </label>
                <div className="space-y-1.5">
                  {(isInstitutional ? INSTITUTIONAL_RESOURCES : COMMUNITY_RESOURCES).map(res => (
                    <button
                      key={res.id}
                      onClick={() => toggleResource(res.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${
                        resources.includes(res.id)
                          ? 'bg-blue-500/12 border-blue-500/30 text-blue-200'
                          : 'bg-white/3 border-white/8 text-slate-400 hover:border-white/15'
                      }`}
                    >
                      <span className="text-base">{res.icon}</span>
                      <span className="text-[11px] font-medium">{res.label}</span>
                      {resources.includes(res.id) && <span className="ml-auto text-blue-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1.5">Location</label>
                {location ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/8 border border-green-500/20">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-[11px] text-green-300 font-mono">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                    <span className="text-[9px] text-green-400/60 ml-auto">Auto-detected</span>
                  </div>
                ) : geoError ? (
                  <div className="p-2.5 rounded-lg bg-red-500/8 border border-red-500/20 text-[10px] text-red-300">
                    {geoError}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    Detecting your location…
                  </div>
                )}
              </div>

              {/* Privacy notice */}
              <div className="p-2.5 rounded-lg bg-white/3 border border-white/5 text-[9px] text-slate-500 leading-relaxed">
                🔒 Your shelter is registered anonymously. No personal information is stored or shared.
                {selectedType === 'community' && ' Community shelters auto-expire after 45 minutes if not refreshed.'}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className={`w-full py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all ${
                  canSubmit && !submitting
                    ? 'bg-gradient-to-r from-green-500/80 to-emerald-500/80 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/20'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Registering…' : '🏠 Register Shelter'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
