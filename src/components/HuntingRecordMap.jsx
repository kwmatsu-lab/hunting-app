import '../lib/leafletConfig'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'

// ── カスタムマーカーアイコン ──────────────────────────────────
const ICON_LOCATION = L.divIcon({
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
})

const ICON_CATCH = L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:#ef4444;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -20],
})

const ICON_SIGHT = L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:#f59e0b;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -20],
})

// 複数地点に自動フィット
function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13)
    } else {
      try {
        map.fitBounds(L.latLngBounds(points).pad(0.3))
      } catch (_) {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(points)])
  return null
}

/**
 * 出猟地点・捕獲地点・目撃地点を地図上に表示するコンポーネント
 * @param {{ latitude, longitude, catches, sightings }} props
 *   latitude / longitude : 出猟地点座標（null可）
 *   catches   : hunting_catches の配列（catch_lat, catch_lng フィールド付き）
 *   sightings : hunting_sightings の配列（sight_lat, sight_lng フィールド付き）
 */
export default function HuntingRecordMap({ latitude, longitude, catches = [], sightings = [] }) {
  const hasMain   = latitude  != null && longitude != null
  const catchPts  = catches.filter(c => c.catch_lat != null && c.catch_lng != null)
  const sightPts  = sightings.filter(s => s.sight_lat != null && s.sight_lng != null)

  if (!hasMain && catchPts.length === 0 && sightPts.length === 0) return null

  const allPoints = [
    ...(hasMain ? [[Number(latitude), Number(longitude)]] : []),
    ...catchPts.map(c => [Number(c.catch_lat), Number(c.catch_lng)]),
    ...sightPts.map(s => [Number(s.sight_lat), Number(s.sight_lng)]),
  ]
  const center = allPoints[0]

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <div style={{ height: 220 }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <FitBounds points={allPoints} />
          {hasMain && (
            <Marker position={[Number(latitude), Number(longitude)]} icon={ICON_LOCATION}>
              <Popup>
                <div className="text-xs font-semibold text-blue-700">📍 出猟地点</div>
              </Popup>
            </Marker>
          )}
          {catchPts.map((c, i) => (
            <Marker key={c.id || i} position={[Number(c.catch_lat), Number(c.catch_lng)]} icon={ICON_CATCH}>
              <Popup>
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-red-700">🎯 捕獲地点</div>
                  {c.catch_time && <div className="font-mono">{c.catch_time}</div>}
                  {c.game && <div>{c.game} {c.count}頭</div>}
                  {c.shooter?.display_name && <div className="text-purple-700">射手: {c.shooter.display_name}</div>}
                  {c.notes && <div className="text-gray-500">{c.notes}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
          {sightPts.map((s, i) => (
            <Marker key={s.id || `s${i}`} position={[Number(s.sight_lat), Number(s.sight_lng)]} icon={ICON_SIGHT}>
              <Popup>
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold text-amber-700">👁 目撃地点</div>
                  {s.sight_time && <div className="font-mono">{s.sight_time}</div>}
                  {s.game && <div>{s.game} {s.count}頭</div>}
                  {s.location && <div className="text-gray-500">{s.location}</div>}
                  {s.notes && <div className="text-gray-500">{s.notes}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-1.5 text-xs text-gray-500 flex gap-4 flex-wrap">
        {hasMain && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shrink-0"></span>
            出猟地点
          </span>
        )}
        {catchPts.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shrink-0"></span>
            捕獲地点 ({catchPts.length}件)
          </span>
        )}
        {sightPts.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shrink-0"></span>
            目撃地点 ({sightPts.length}件)
          </span>
        )}
      </div>
    </div>
  )
}
