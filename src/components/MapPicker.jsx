import '../lib/leafletConfig'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'

const JAPAN_CENTER = [36.2048, 138.2529]

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/**
 * 地図をクリックして緯度経度を選択するコンポーネント
 * @param {{ lat, lng, onPick }} props
 */
export default function MapPicker({ lat, lng, onPick }) {
  const center = lat && lng ? [lat, lng] : JAPAN_CENTER
  const zoom = lat && lng ? 13 : 5

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: 280 }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} key={`${lat}-${lng}`}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler onPick={onPick} />
        {lat && lng && <Marker position={[lat, lng]} />}
      </MapContainer>
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-1.5 text-xs text-gray-500 flex items-center justify-between">
        <span>地図をクリックして場所を設定</span>
        {lat && lng && (
          <span className="font-mono text-gray-600">
            {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </span>
        )}
      </div>
    </div>
  )
}
