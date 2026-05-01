import { TileLayer } from 'react-leaflet'

export default function SatelliteOverlay() {
    return (
        <TileLayer
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            opacity={0.7}
        />
    )
}
