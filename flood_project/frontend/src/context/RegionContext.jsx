/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'

const RegionContext = createContext(null)

const DEFAULT_REGION = {
    lat: 28.6139,
    lng: 77.2090,
    regionName: "Delhi NCR",
    bbox: [28.40, 76.84, 28.88, 77.35], // [south, west, north, east]
    zoom: 11
}

export function RegionProvider({ children }) {
    const [region, setRegion] = useState(DEFAULT_REGION)

    const updateRegion = useCallback((newRegion) => {
        setRegion(prev => ({ ...prev, ...newRegion }))
    }, [])

    const locateMe = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords
                    updateRegion({
                        lat: latitude,
                        lng: longitude,
                        regionName: "Current Location",
                        bbox: [latitude - 0.15, longitude - 0.25, latitude + 0.15, longitude + 0.25],
                        zoom: 12,
                    })
                },
                (err) => {
                    console.warn("Geolocation failed:", err.message)
                }
            )
        }
    }, [updateRegion])

    return (
        <RegionContext.Provider value={{ region, updateRegion, locateMe }}>
            {children}
        </RegionContext.Provider>
    )
}

export function useRegion() {
    const ctx = useContext(RegionContext)
    if (!ctx) throw new Error("useRegion must be used within RegionProvider")
    return ctx
}

// Intentionally no default export to keep Fast Refresh happy.
