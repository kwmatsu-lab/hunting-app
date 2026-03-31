import '../lib/leafletConfig'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { MapPin } from 'lucide-react'

const JAPAN_CENTER = [36.2048, 138.2529]

function makeIcon(color) {
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,.4);
      transform:rotate(-45deg);
    "></div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

const ICON_NONE = makeIcon('#9ca3af')
const ICON_FEW  = makeIcon('#3b82f6')
const ICON_MANY = makeIcon('#16a34a')

/**
 * 全猟場を地図上にマーカー表示するコンポーネント
 * @param {{ grounds, stats, onSelect }} props
 *   grounds: 猟場リスト（lat/lng付き）
 *   stats: { [groundId]: { visits, totalGame, totalRounds } }
 *   onSelect: (ground) => void  — 詳細ボタンクリック
 */
export default function GroundsMap({ grounds, stats, onSelect }) {
  const located = grounds.filter(g => g.latitude && g.longitude)

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 480 }}>
      <MapContainer center={JAPAN_CENTER} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {located.map(g => {
          const s = stats[g.id] || { visits: 0, totalGame: 0, totalRounds: 0 }
          const icon = s.totalGame >= 10 ? ICON_MANY : s.visits > 0 ? ICON_FEW : ICON_NONE
          return (
            <Marker key={g.id} position={[g.latitude, g.longitude]} icon={icon}>
              <Popup minWidth={180}>
                <div className="text-sm font-semibold mb-1">{g.name}</div>
                {g.prefecture && <div className="text-xs text-gray-500 mb-2">{g.prefecture} {g.terrain ? `・${g.terrain}` : ''}</div>}
                <div className="grid grid-cols-3 gap-1 text-center mb-2">
                  <div>
                    <div className="font-bold text-gray-800">{s.visits}</div>
                    <div className="text-xs text-gray-400">出猟</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-600">{s.totalGame}</div>
                    <div className="text-xs text-gray-400">獲物</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-600">{s.totalRounds}</div>
                    <div className="text-xs text-gray-400">発射</div>
                  </div>
                </div>
                {onSelect && (
                  <button
                    onClick={() => onSelect(g)}
                    className="w-full text-xs text-green-700 border border-green-300 rounded px-2 py-1 hover:bg-green-50"
                  >
                    詳細を見る
                  </button>
                )}
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      {located.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 rounded-lg px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
            <MapPin size={14} /> 位置情報を登録すると地図に表示されます
          </div>
        </div>
      )}
    </div>
  )
}
