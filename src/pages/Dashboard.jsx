import { Target, TreePine, Package, FileCheck, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShootingRecords, useHuntingRecords, useAmmoInventory, useLicenses } from '../store/useStore'

function daysBetween(date1, date2) {
  return Math.ceil((new Date(date1) - new Date(date2)) / (1000 * 60 * 60 * 24))
}

function StatCard({ icon: Icon, label, value, color, to }) {
  return (
    <Link to={to} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { records: shooting } = useShootingRecords()
  const { records: hunting } = useHuntingRecords()
  const { items: ammo } = useAmmoInventory()
  const { records: licenses } = useLicenses()

  const today = new Date().toISOString().split('T')[0]
  const expiringLicenses = licenses.filter(l => {
    const days = daysBetween(l.expiryDate, today)
    return days > 0 && days <= 90
  })
  const expiredLicenses = licenses.filter(l => daysBetween(l.expiryDate, today) <= 0)

  const recentShooting = [...shooting].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
  const recentHunting = [...hunting].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

  const lowAmmo = ammo.filter(i => i.quantity <= i.minQuantity)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Target} label="射撃記録" value={shooting.length} color="bg-blue-500" to="/shooting" />
        <StatCard icon={TreePine} label="狩猟記録" value={hunting.length} color="bg-green-600" to="/hunting" />
        <StatCard icon={Package} label="弾薬種類" value={ammo.length} color="bg-amber-500" to="/ammo" />
        <StatCard icon={FileCheck} label="免許・許可証" value={licenses.length} color="bg-purple-500" to="/licenses" />
      </div>

      {/* Alerts */}
      {(expiringLicenses.length > 0 || expiredLicenses.length > 0 || lowAmmo.length > 0) && (
        <div className="mb-6 space-y-2">
          {expiredLicenses.map(l => (
            <div key={l.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
              <AlertTriangle size={16} className="shrink-0" />
              <span><strong>{l.name}</strong> が期限切れです</span>
            </div>
          ))}
          {expiringLicenses.map(l => {
            const days = daysBetween(l.expiryDate, today)
            return (
              <div key={l.id} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0" />
                <span><strong>{l.name}</strong> の期限まで残り{days}日（{l.expiryDate}）</span>
              </div>
            )
          })}
          {lowAmmo.map(i => (
            <div key={i.id} className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-800">
              <AlertTriangle size={16} className="shrink-0" />
              <span><strong>{i.name}</strong> の在庫が少なくなっています（残り{i.quantity}発）</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent shooting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Target size={16} className="text-blue-500" /> 最近の射撃記録
            </h2>
            <Link to="/shooting" className="text-xs text-blue-500 hover:underline">すべて見る</Link>
          </div>
          {recentShooting.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">記録がありません</p>
          ) : (
            <div className="space-y-2">
              {recentShooting.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{r.location || '場所未記入'}</div>
                    <div className="text-xs text-gray-400">{r.date} · {r.firearm || '銃未記入'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">{r.score ?? '-'}<span className="text-xs font-normal text-gray-400"> 点</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent hunting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <TreePine size={16} className="text-green-600" /> 最近の狩猟記録
            </h2>
            <Link to="/hunting" className="text-xs text-green-600 hover:underline">すべて見る</Link>
          </div>
          {recentHunting.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">記録がありません</p>
          ) : (
            <div className="space-y-2">
              {recentHunting.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{r.location || '場所未記入'}</div>
                    <div className="text-xs text-gray-400">{r.date} · {r.game || '獲物未記入'}</div>
                  </div>
                  <div className="text-sm font-bold text-green-600">{r.count ?? 0}<span className="text-xs font-normal text-gray-400"> 頭</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
