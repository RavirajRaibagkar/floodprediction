import { useMemo } from 'react'
import { Polyline } from 'react-leaflet'
import { useRegion } from '../context/RegionContext'
import * as turf from '@turf/turf'

// Generate flow paths around the current region center
function generateFlowPaths(lat, lng) {
  const paths = []
  
  for (let dlat = -0.04; dlat <= 0.04; dlat += 0.015) {
    for (let dlng = -0.05; dlng <= 0.05; dlng += 0.015) {
      const startLat = lat + dlat
      const startLng = lng + dlng
      
      let currentPt = turf.point([startLng, startLat])
      let pathCoords = [[startLat, startLng]]
      
      for (let i = 0; i < 4; i++) {
        // Flow generally towards center-east (simulating river flow)
        const riverPt = turf.point([lng + 0.03, currentPt.geometry.coordinates[1] - 0.005])
        let brg = turf.bearing(currentPt, riverPt)
        brg += (Math.random() - 0.5) * 45
        
        const nextPt = turf.destination(currentPt, 0.5, brg)
        pathCoords.push([nextPt.geometry.coordinates[1], nextPt.geometry.coordinates[0]])
        currentPt = nextPt
      }
      
      paths.push(pathCoords)
    }
  }
  return paths
}

export default function FlowDirectionLayer() {
  const { region } = useRegion()
  const paths = useMemo(() => generateFlowPaths(region.lat, region.lng), [region.lat, region.lng])

  return (
    <>
      {paths.map((path, idx) => (
        <Polyline 
          key={idx} 
          positions={path} 
          color="#38bdf8" 
          weight={2} 
          opacity={0.4}
          dashArray="4, 12"
          className="flow-arrow-animated"
        />
      ))}
    </>
  )
}
