import { useState, useEffect, lazy, Suspense } from 'react'
import { Plus, Trash2, Pencil, MapPin, Map, List } from 'lucide-react'
import { useHuntingGrounds } from '../store/useStore'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'

const MapPicker = lazy(() => import('../components/MapPicker'))
const GroundsMap = lazy(() => import('../components/GroundsMap'))

const TERRAINS = ['山林', '農地', '河川・湿地', '海岸', '雑種地', 'その他']

const EMPTY = { name: '', prefecture: '', address: '', areaHa: '', terrain: '', notes: '', latitude: null, longitude: null }

function GroundForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">猟場名 *</span>
        <input type="text" required placeholder="例: 奥山猟区" value={form.name} onChange={e => set('name', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">都道府県</span>
          <input type="text" placeholder="北海道" value={form.prefecture} onChange={e => set('prefecture', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">地形</span>
          <select value={form.terrain} onChange={e => set('terrain', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
            <option value="">選択</option>
            {TERRAINS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block col-span-2">
          <span className="text-xs text-gray-500 font-medium">住所・場所の詳細</span>
          <input type="text" placeholder="〇〇郡〇〇町 ××山系" value={form.address} onChange={e => set('address', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">面積 (ha)</span>
          <input type="number" min="0" step="0.1" placeholder="50.0" value={form.areaHa} onChange={e => set('areaHa', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">メモ</span>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          placeholder="アクセス方法・注意点など"
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
      </label>

      {/* 地図で場所を設定 */}
      <div>
        <span className="text-xs text-gray-500 font-medium">地図で場所を設定（クリックでピン）</span>
        <div className="mt-1">
          <Suspense fallback={<div className="h-52 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-400">地図を読み込み中...</div>}>
            <MapPicker
              lat={form.latitude}
              lng={form.longitude}
              onPick={(lat, lng) => { set('latitude', lat); set('longitude', lng) }}
            />
          </Suspense>
        </div>
        {form.latitude && form.longitude && (
          <button type="button" onClick={() => { set('latitude', null); set('longitude', null) }}
            className="mt-1 text-xs text-red-400 hover:text-red-600">
            × 位置情報をクリア
          </button>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit" className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">保存</button>
      </div>
    </form>
  )
}

function GroundDetailModal({ ground, onClose }) {
  const [records, setRecords] = useState([])
  const [catches, setCatches] = useState({}) // recordId -> catches[]
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: recs } = await supabase
        .from('hunting_records')
        .select('*')
        .eq('ground_id', ground.id)
        .order('date', { ascending: false })

      const rows = recs || []
      setRecords(rows)

      // Load catches for each record
      if (rows.length > 0) {
        const ids = rows.map(r => r.id)
        const { data: catchData } = await supabase
          .from('hunting_catches')
          .select('*')
          .in('hunting_record_id', ids)
          .order('catch_time')
        const grouped = {}
        ;(catchData || []).forEach(c => {
          if (!grouped[c.hunting_record_id]) grouped[c.hunting_record_id] = []
          grouped[c.hunting_record_id].push(c)
        })
        setCatches(grouped)
      }
      setLoading(false)
    }
    load()
  }, [ground.id])

  const totalGame = records.reduce((s, r) => s + Number(r.count || 0), 0)
  const totalRounds = records.reduce((s, r) => s + Number(r.rounds_fired || 0), 0)
  const gameCounts = records.reduce((acc, r) => {
    if (r.game) acc[r.game] = (acc[r.game] || 0) + Number(r.count || 0)
    return acc
  }, {})

  return (
    <Modal title={`猟場詳細: ${ground.name}`} onClose={onClose}>
      {/* 猟場情報 */}
      <div className="bg-green-50 rounded-lg p-3 mb-4 text-sm">
        <div className="grid grid-cols-2 gap-1 text-gray-600 text-xs">
          {ground.prefecture && <div><span className="text-gray-400">都道府県:</span> {ground.prefecture}</div>}
          {ground.terrain && <div><span className="text-gray-400">地形:</span> {ground.terrain}</div>}
          {ground.address && <div className="col-span-2"><span className="text-gray-400">場所:</span> {ground.address}</div>}
          {ground.areaHa && <div><span className="text-gray-400">面積:</span> {ground.areaHa} ha</div>}
          {ground.latitude && <div className="col-span-2 font-mono text-gray-400">{Number(ground.latitude).toFixed(5)}, {Number(ground.longitude).toFixed(5)}</div>}
        </div>
        {ground.notes && <div className="mt-2 text-xs text-gray-500 border-t border-green-200 pt-2">{ground.notes}</div>}
      </div>

      {/* 集計 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-gray-800">{records.length}</div>
          <div className="text-xs text-gray-500">出猟回数</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-600">{totalGame}</div>
          <div className="text-xs text-gray-500">総獲物数</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-amber-600">{totalRounds}</div>
          <div className="text-xs text-gray-500">総発射弾数</div>
        </div>
      </div>

      {Object.keys(gameCounts).length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {Object.entries(gameCounts).map(([g, c]) => (
            <span key={g} className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">{g}: {c}頭</span>
          ))}
        </div>
      )}

      {/* 猟行記録一覧 */}
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">猟行記録</h3>
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-4">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">この猟場での記録はありません</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {records.map(r => {
            const rc = catches[r.id] || []
            const duration = r.departure_time && r.return_time
              ? `${r.departure_time} → ${r.return_time}`
              : r.departure_time ? `出発 ${r.departure_time}` : null
            return (
              <div key={r.id} className="border border-gray-100 rounded-lg p-3 text-sm bg-gray-50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-gray-800">{r.date}</span>
                  <div className="flex gap-1.5">
                    {r.game && r.count > 0 && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">{r.game} {r.count}頭</span>
                    )}
                    {r.rounds_fired > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">{r.rounds_fired}発</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-gray-400 flex-wrap mb-1">
                  {duration && <span>⏱ {duration}</span>}
                  {(r.temperature_min != null || r.temperature_max != null) && (
                    <span>🌡 {r.temperature_min != null && r.temperature_max != null
                      ? `${r.temperature_min}〜${r.temperature_max}°C`
                      : r.temperature_min != null ? `最低 ${r.temperature_min}°C`
                      : `最高 ${r.temperature_max}°C`}
                    </span>
                  )}
                  {r.weather && <span>{r.weather}</span>}
                  {r.method && <span>{r.method}</span>}
                  {r.ammo_name && <span>装弾: {r.ammo_name}</span>}
                </div>
                {/* 個別捕獲 */}
                {rc.length > 0 && (
                  <div className="mt-2 border-t border-gray-200 pt-2 space-y-1">
                    {rc.map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-xs text-gray-600">
                        {c.catch_time && <span className="font-mono text-gray-400">{c.catch_time}</span>}
                        <span className="font-medium">{c.game} {c.count}頭</span>
                        {c.notes && <span className="text-gray-400">— {c.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {r.notes && <div className="mt-1.5 text-xs text-gray-500 bg-white rounded px-2 py-1">{r.notes}</div>}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

export default function HuntingGrounds() {
  const { records: grounds, add, update, remove } = useHuntingGrounds()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [view, setView] = useState('card') // 'card' | 'map'
  const [stats, setStats] = useState({})

  useEffect(() => {
    if (grounds.length === 0) return
    async function fetchStats() {
      const { data: recs } = await supabase
        .from('hunting_records')
        .select('id, ground_id, count, rounds_fired')
        .in('ground_id', grounds.map(g => g.id))
      const rows = recs || []
      const recordIds = rows.map(r => r.id)

      // 目撃数を猟行記録IDごとに集計
      let sightingByRecord = {}
      if (recordIds.length > 0) {
        const { data: sightings } = await supabase
          .from('hunting_sightings')
          .select('hunting_record_id, count')
          .in('hunting_record_id', recordIds)
        ;(sightings || []).forEach(s => {
          sightingByRecord[s.hunting_record_id] =
            (sightingByRecord[s.hunting_record_id] || 0) + Number(s.count || 0)
        })
      }

      const agg = {}
      rows.forEach(r => {
        if (!r.ground_id) return
        if (!agg[r.ground_id]) agg[r.ground_id] = { visits: 0, totalGame: 0, totalRounds: 0, totalSightings: 0 }
        agg[r.ground_id].visits++
        agg[r.ground_id].totalGame      += Number(r.count || 0)
        agg[r.ground_id].totalRounds    += Number(r.rounds_fired || 0)
        agg[r.ground_id].totalSightings += sightingByRecord[r.id] || 0
      })
      setStats(agg)
    }
    fetchStats()
  }, [grounds])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MapPin className="text-green-600" size={24} /> 猟場管理
        </h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView('card')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 ${view === 'card' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <List size={13} /> カード
            </button>
            <button onClick={() => setView('map')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 ${view === 'map' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Map size={13} /> 地図
            </button>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">
            <Plus size={15} /> 猟場を追加
          </button>
        </div>
      </div>

      {/* 全体集計 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-800">{grounds.length}</div>
          <div className="text-xs text-gray-500">登録猟場数</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{Object.values(stats).reduce((s, v) => s + v.totalGame, 0)}</div>
          <div className="text-xs text-gray-500">総獲物数</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-amber-600">{Object.values(stats).reduce((s, v) => s + v.totalRounds, 0)}</div>
          <div className="text-xs text-gray-500">総発射弾数</div>
        </div>
      </div>

      {/* 地図ビュー */}
      {view === 'map' && (
        <Suspense fallback={<div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center text-sm text-gray-400">地図を読み込み中...</div>}>
          <GroundsMap grounds={grounds} stats={stats} onSelect={setDetail} />
        </Suspense>
      )}

      {/* カードビュー */}
      {view === 'card' && (
        grounds.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            猟場が登録されていません。「猟場を追加」から登録してください。
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {grounds.map(g => {
              const s = stats[g.id] || { visits: 0, totalGame: 0, totalRounds: 0, totalSightings: 0 }
              const catchRate    = s.visits > 0 ? (s.totalGame / s.visits).toFixed(1) : '-'
              const contactRate  = s.visits > 0 ? ((s.totalGame + s.totalSightings) / s.visits).toFixed(1) : '-'
              return (
                <div key={g.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-green-600 shrink-0" />
                        <span className="font-semibold text-gray-800">{g.name}</span>
                        {g.latitude && (
                          <span className="text-xs text-gray-400 bg-green-50 px-1.5 py-0.5 rounded">📍 位置あり</span>
                        )}
                      </div>
                      <div className="mt-1 flex gap-2 text-xs text-gray-400 flex-wrap">
                        {g.prefecture && <span>{g.prefecture}</span>}
                        {g.terrain && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{g.terrain}</span>}
                        {g.areaHa && <span>{g.areaHa} ha</span>}
                      </div>
                      {g.address && <div className="text-xs text-gray-400 mt-0.5">{g.address}</div>}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => setEditing(g)} className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50"><Pencil size={14} /></button>
                      <button onClick={() => remove(g.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {/* 基本統計 */}
                  <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-3 mb-2">
                    {[
                      ['出猟', `${s.visits}回`,    'text-gray-700'],
                      ['獲物', `${s.totalGame}頭`, 'text-green-600'],
                      ['目撃', `${s.totalSightings}頭`, 'text-yellow-600'],
                    ].map(([l, v, c]) => (
                      <div key={l} className="text-center">
                        <div className={`text-sm font-bold ${c}`}>{v}</div>
                        <div className="text-[10px] text-gray-400">{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* 効率指標（パッと見で分かるように強調） */}
                  <div className="grid grid-cols-2 gap-2 bg-green-50 rounded-lg p-2">
                    <div className="text-center">
                      <div className="text-base font-bold text-green-700">{catchRate}<span className="text-[10px] font-normal text-gray-500 ml-0.5">頭/回</span></div>
                      <div className="text-[10px] text-gray-500">猟果率</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-amber-600">{contactRate}<span className="text-[10px] font-normal text-gray-500 ml-0.5">件/回</span></div>
                      <div className="text-[10px] text-gray-500">遭遇率（獲物+目撃）</div>
                    </div>
                  </div>
                  <button onClick={() => setDetail(g)}
                    className="mt-2 w-full text-xs text-green-600 hover:text-green-700 font-medium py-1.5 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                    詳細・猟行履歴
                  </button>
                </div>
              )
            })}
          </div>
        )
      )}

      {showAdd && (
        <Modal title="猟場を追加" onClose={() => setShowAdd(false)}>
          <GroundForm onSave={d => { add(d); setShowAdd(false) }} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="猟場を編集" onClose={() => setEditing(null)}>
          <GroundForm initial={editing} onSave={d => { update(editing.id, d); setEditing(null) }} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {detail && <GroundDetailModal ground={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
