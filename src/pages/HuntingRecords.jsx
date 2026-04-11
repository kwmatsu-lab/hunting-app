import { useState, useEffect } from 'react'
import {
  Plus, Trash2, Pencil, TreePine, MapPin, Crosshair,
  AlertTriangle, ChevronDown, ChevronUp, Clock, Users2, Filter, User, Map, Eye
} from 'lucide-react'
import { useHuntingRecords, useHuntingGrounds, useAmmoInventory, useHuntingTeams, useFirearms } from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import MapPicker from '../components/MapPicker'
import HuntingRecordMap from '../components/HuntingRecordMap'

const GAME_OPTIONS = ['イノシシ', 'シカ', 'タヌキ', 'キジ', 'カモ', 'クマ', 'サル', 'その他']
const HUNT_TYPE_OPTIONS = ['単独忍び猟', '巻き狩り', '待ち猟', '流し猟', 'わな猟', '網猟', 'その他']
const WEATHER_OPTIONS = ['晴れ', '曇り', '雨', '雪', '霧']

// 猟法タイプに対応するバッジスタイル
const HUNT_TYPE_STYLE = {
  '単独忍び猟': 'bg-green-100 text-green-700',
  '巻き狩り':   'bg-purple-100 text-purple-700',
  '待ち猟':     'bg-blue-100 text-blue-700',
  '流し猟':     'bg-teal-100 text-teal-700',
  'わな猟':     'bg-amber-100 text-amber-700',
  '網猟':       'bg-cyan-100 text-cyan-700',
  'その他':     'bg-gray-100 text-gray-600',
}

const EMPTY_CATCH = () => ({
  _key: Date.now() + Math.random(),
  catchTime: '', game: '', count: 1, notes: '', shooterUserId: '',
  catchLat: null, catchLng: null, catchLocation: '',
})

const EMPTY_SIGHTING = () => ({
  _key: Date.now() + Math.random(),
  sightTime: '', game: '', count: 1, location: '', notes: '',
  sightLat: null, sightLng: null,
})

// ── 捕獲行 ────────────────────────────────────────────────
function CatchRow({ c, onChange, onRemove, teamMembers, isGroupHunt }) {
  const [showMap, setShowMap] = useState(false)
  const hasLocation = c.catchLat != null && c.catchLng != null
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 space-y-2">
        {/* 獲物選択 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5 flex-1">
            {GAME_OPTIONS.map(g => (
              <button key={g} type="button" onClick={() => onChange('game', g)}
                className={`px-2 py-1 text-xs rounded-full border transition-all ${
                  c.game === g
                    ? 'bg-green-100 text-green-700 border-transparent ring-1 ring-green-400'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 bg-white'
                }`}>
                {g}
              </button>
            ))}
          </div>
          <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-400 shrink-0 text-base leading-none ml-2">×</button>
        </div>
        {/* 頭数 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">頭数:</span>
          <button type="button" onClick={() => onChange('count', Math.max(1, Number(c.count) - 1))}
            className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm font-bold">−</button>
          <span className="text-sm font-bold text-stone-800 w-5 text-center">{c.count}</span>
          <button type="button" onClick={() => onChange('count', Number(c.count) + 1)}
            className="w-6 h-6 rounded-full border border-green-300 text-green-700 hover:bg-green-100 flex items-center justify-center text-sm font-bold">+</button>
        </div>
        {/* 任意：時刻・場所・射手・メモ */}
        <div className="flex items-center gap-2 flex-wrap">
          <input type="time" value={c.catchTime} onChange={e => onChange('catchTime', e.target.value)}
            placeholder="時刻"
            className="border border-gray-200 rounded-md bg-transparent text-xs font-mono w-20 px-1.5 py-1 focus:outline-none shrink-0" />
          <input type="text" placeholder="場所（任意）" value={c.catchLocation || ''} onChange={e => onChange('catchLocation', e.target.value)}
            className="border border-gray-200 rounded-md bg-transparent text-xs px-1.5 py-1 focus:outline-none flex-1 min-w-[80px]" />
          <button type="button" onClick={() => setShowMap(m => !m)}
            title="捕獲地点を地図で指定"
            className={`shrink-0 p-1 rounded transition-colors ${hasLocation ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-green-500'}`}>
            <MapPin size={13} />
          </button>

          {/* 巻き狩り時：射手選択 */}
          {isGroupHunt && teamMembers.length > 0 && (
            <select value={c.shooterUserId} onChange={e => onChange('shooterUserId', e.target.value)}
              className="border border-gray-200 rounded-md bg-transparent text-xs focus:outline-none text-purple-600 min-w-[80px] px-1.5 py-1">
              <option value="">射手?</option>
              {teamMembers.map(m => (
                <option key={m.userId} value={m.userId}>{m.displayName}</option>
              ))}
            </select>
          )}
        </div>
        {/* メモ */}
        <input type="text" placeholder="メモ（任意）" value={c.notes} onChange={e => onChange('notes', e.target.value)}
          className="w-full border border-gray-200 rounded-md bg-transparent text-xs px-1.5 py-1 focus:outline-none text-gray-500" />
      </div>
      {showMap && (
        <div className="border-t border-gray-100 p-2">
          <div className="text-xs text-gray-500 mb-1.5 font-medium">🎯 捕獲地点を指定</div>
          <MapPicker
            lat={c.catchLat} lng={c.catchLng}
            onPick={(lat, lng) => { onChange('catchLat', lat); onChange('catchLng', lng) }}
          />
          {hasLocation && (
            <button type="button" onClick={() => { onChange('catchLat', null); onChange('catchLng', null) }}
              className="mt-1.5 text-xs text-red-400 hover:text-red-600">
              地点をクリア
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── 目撃行 ────────────────────────────────────────────────
function SightingRow({ s, onChange, onRemove }) {
  const [showMap, setShowMap] = useState(false)
  const hasLocation = s.sightLat != null && s.sightLng != null
  return (
    <div className="bg-white border border-amber-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <input type="time" value={s.sightTime} onChange={e => onChange('sightTime', e.target.value)}
            className="border border-gray-200 rounded-md bg-transparent text-xs font-mono w-20 px-1.5 py-1 focus:outline-none shrink-0" />
          <input type="text" placeholder="場所" value={s.location} onChange={e => onChange('location', e.target.value)}
            className="border-0 bg-transparent text-xs flex-1 focus:outline-none text-gray-600 min-w-[60px]" />
          <input type="text" placeholder="メモ" value={s.notes} onChange={e => onChange('notes', e.target.value)}
            className="border-0 bg-transparent text-xs flex-1 focus:outline-none text-gray-400 min-w-[50px]" />
          <button type="button" onClick={() => setShowMap(m => !m)}
            title="目撃地点を地図で指定"
            className={`shrink-0 p-1 rounded transition-colors ${hasLocation ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400'}`}>
            <MapPin size={13} />
          </button>
          <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-400 shrink-0 text-base leading-none">×</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GAME_OPTIONS.map(g => (
            <button key={g} type="button" onClick={() => onChange('game', g)}
              className={`px-2 py-1 text-xs rounded-full border transition-all ${
                s.game === g
                  ? 'bg-amber-100 text-amber-700 border-transparent ring-1 ring-amber-400'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300 bg-white'
              }`}>
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">頭数:</span>
          <button type="button" onClick={() => onChange('count', Math.max(1, Number(s.count) - 1))}
            className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm font-bold">−</button>
          <span className="text-sm font-bold text-stone-800 w-5 text-center">{s.count}</span>
          <button type="button" onClick={() => onChange('count', Number(s.count) + 1)}
            className="w-6 h-6 rounded-full border border-amber-300 text-amber-700 hover:bg-amber-100 flex items-center justify-center text-sm font-bold">+</button>
        </div>
      </div>
      {showMap && (
        <div className="border-t border-amber-100 p-2">
          <div className="text-xs text-amber-700 mb-1.5 font-medium">👁 目撃地点を指定</div>
          <MapPicker
            lat={s.sightLat} lng={s.sightLng}
            onPick={(lat, lng) => { onChange('sightLat', lat); onChange('sightLng', lng) }}
          />
          {hasLocation && (
            <button type="button" onClick={() => { onChange('sightLat', null); onChange('sightLng', null) }}
              className="mt-1.5 text-xs text-red-400 hover:text-red-600">
              地点をクリア
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── 記録フォーム ───────────────────────────────────────────
function RecordForm({ initial, onSave, onCancel, grounds, ammoItems, teams, firearms }) {
  const [form, setForm] = useState(() => ({
    date: '', location: '', prefecture: '', game: '', count: '',
    method: '', isPestControl: false, weather: '', notes: '',
    groundId: '', roundsFired: '', ammoInventoryId: '',
    departureTime: '', returnTime: '', temperatureMin: '', temperatureMax: '',
    teamId: '', firearmId: '',
    catchTime: '', catchLocation: '', shooterUserId: '',
    latitude: null, longitude: null,
    ...initial,
    groundId: initial?.groundId || '',
    roundsFired: initial?.roundsFired ?? '',
    ammoInventoryId: initial?.ammoInventoryId || '',
    departureTime: initial?.departureTime || '',
    returnTime: initial?.returnTime || '',
    temperatureMin: initial?.temperatureMin ?? '',
    temperatureMax: initial?.temperatureMax ?? '',
    method: initial?.method || '',
    isPestControl: initial?.isPestControl || false,
    teamId: initial?.teamId || '',
    firearmId: initial?.firearmId || '',
    latitude: initial?.latitude ?? null,
    longitude: initial?.longitude ?? null,
  }))
  const [catches, setCatches] = useState([])
  const [sightings, setSightings] = useState([])
  const [loadingCatches, setLoadingCatches] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [deductAmmo, setDeductAmmo] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(!!(initial?.latitude))
  const [showHuntDetail, setShowHuntDetail] = useState(!!(initial?.prefecture || initial?.location || initial?.departureTime || initial?.returnTime || initial?.temperatureMin || initial?.temperatureMax || initial?.weather))
  const [showCatchDetail, setShowCatchDetail] = useState(!!(initial?.catchTime || initial?.catchLocation))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))


  // 既存記録の捕獲・目撃を読み込む
  useEffect(() => {
    if (!initial?.id) return
    setLoadingCatches(true)
    Promise.all([
      supabase.from('hunting_catches').select('*').eq('hunting_record_id', initial.id).order('catch_time'),
      supabase.from('hunting_sightings').select('*').eq('hunting_record_id', initial.id).order('sight_time'),
    ]).then(([{ data: cd }, { data: sd }]) => {
      setCatches((cd || []).map(c => ({
        _key: c.id,
        catchTime: c.catch_time || '',
        game: c.game || '',
        count: c.count || 1,
        notes: c.notes || '',
        shooterUserId: c.shooter_user_id || '',
        catchLat: c.catch_lat ?? null,
        catchLng: c.catch_lng ?? null,
        catchLocation: c.catch_location || '',
      })))
      setSightings((sd || []).map(s => ({
        _key: s.id,
        sightTime: s.sight_time || '',
        game: s.game || '',
        count: s.count || 1,
        location: s.location || '',
        notes: s.notes || '',
        sightLat: s.sight_lat ?? null,
        sightLng: s.sight_lng ?? null,
      })))
      setLoadingCatches(false)
    })
  }, [initial?.id])

  // チーム変更時にメンバーを取得
  useEffect(() => {
    if (!form.teamId) { setTeamMembers([]); return }
    supabase.rpc('get_team_members_by_team', { p_team_id: form.teamId })
      .then(({ data, error }) => {
        if (!error && data) {
          setTeamMembers(data.map(m => ({
            userId: m.user_id,
            displayName: m.display_name || '不明',
          })))
        } else {
          // フォールバック: 直接クエリ
          supabase.from('team_members')
            .select('user_id, profiles(display_name)')
            .eq('team_id', form.teamId)
            .then(({ data: d2 }) => {
              setTeamMembers((d2 || []).map(m => ({
                userId: m.user_id,
                displayName: m.profiles?.display_name || '不明',
              })))
            })
        }
      })
  }, [form.teamId])

  const selectedAmmo = ammoItems.find(a => a.id === form.ammoInventoryId)
  const roundsNum = Number(form.roundsFired) || 0
  const ammoShort = selectedAmmo && roundsNum > Number(selectedAmmo.quantity)

  function handleGroundChange(groundId) {
    set('groundId', groundId)
    if (groundId) {
      const g = grounds.find(g => g.id === groundId)
      if (g?.prefecture && !form.prefecture) set('prefecture', g.prefecture)
    }
  }

  function handleAmmoChange(id) {
    set('ammoInventoryId', id)
  }

  function updateCatch(key, field, val) {
    setCatches(prev => prev.map(c => c._key === key ? { ...c, [field]: val } : c))
  }

  function updateSighting(key, field, val) {
    setSightings(prev => prev.map(s => s._key === key ? { ...s, [field]: val } : s))
  }

  const catchTotal = catches.reduce((s, c) => s + Number(c.count || 0), 0)
  const effectiveCount = catches.length > 0 ? catchTotal : (Number(form.count) || 0)
  const effectiveGame = catches.length > 0 ? (catches[0]?.game || form.game) : form.game

  function handleSubmit(e) {
    e.preventDefault()
    const rawFirearmId = form.firearmId?.includes('__bar__')
      ? form.firearmId.split('__bar__')[0]
      : form.firearmId
    onSave({
      ...form,
      firearmId: rawFirearmId || null,
      game: effectiveGame,
      count: effectiveCount,
      ammoName: selectedAmmo?.name || null,
      _catches: catches,
      _sightings: sightings,
      _deductAmmo: deductAmmo && !!selectedAmmo && roundsNum > 0,
      _teamMembers: teamMembers,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 出猟情報 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
        <div className="text-xs font-semibold text-blue-800 flex items-center gap-1.5"><Clock size={13} /> 出猟情報</div>

        {/* サマリー: 日付・猟場（常に表示） */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">日付 *</span>
            <input type="date" required value={form.date} onChange={e => set('date', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">猟場</span>
            <select value={form.groundId} onChange={e => handleGroundChange(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">登録猟場から選択</option>
              {grounds.map(g => <option key={g.id} value={g.id}>{g.name}{g.prefecture ? ` (${g.prefecture})` : ''}</option>)}
            </select>
          </label>
        </div>

        {/* 詳細トグル */}
        <button type="button" onClick={() => setShowHuntDetail(v => !v)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-blue-100/60 hover:bg-blue-100 rounded-lg text-xs font-medium text-blue-700 transition-colors">
          <span className="flex items-center gap-1.5">
            {showHuntDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            詳細情報（場所・時刻・天候など）
          </span>
          <span className="text-blue-400 text-[10px]">任意</span>
        </button>

        {/* 詳細: 都道府県・場所・時刻・気温・天候・マップ */}
        {showHuntDetail && (
          <div className="space-y-3 border-t border-blue-200 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-gray-500 font-medium">都道府県</span>
                <input type="text" placeholder="北海道" value={form.prefecture} onChange={e => set('prefecture', e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 font-medium">場所（自由記入）</span>
                <input type="text" placeholder="〇〇山系" value={form.location} onChange={e => set('location', e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 font-medium">出発時刻</span>
                <input type="time" value={form.departureTime} onChange={e => set('departureTime', e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 font-medium">帰還時刻</span>
                <input type="time" value={form.returnTime} onChange={e => set('returnTime', e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 font-medium">気温 — 最低 (°C)</span>
                <input type="number" step="0.5" placeholder="-5" value={form.temperatureMin} onChange={e => set('temperatureMin', e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 font-medium">気温 — 最高 (°C)</span>
                <input type="number" step="0.5" placeholder="5" value={form.temperatureMax} onChange={e => set('temperatureMax', e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </label>
              <div className="block col-span-2">
                <span className="text-xs text-gray-500 font-medium">天候</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {WEATHER_OPTIONS.map(w => (
                    <button key={w} type="button" onClick={() => set('weather', form.weather === w ? '' : w)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        form.weather === w
                          ? 'bg-blue-100 text-blue-700 border-transparent ring-2 ring-offset-1 ring-blue-400'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                      }`}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 出猟地点マップ */}
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <button type="button"
                onClick={() => setShowMapPicker(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white/60 hover:bg-white text-xs font-medium text-gray-700 transition-colors">
                <span className="flex items-center gap-2">
                  <Map size={13} className="text-green-600" />
                  出猟地点を地図で指定
                  {form.latitude && form.longitude && (
                    <span className="text-[10px] font-mono text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                      {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
                    </span>
                  )}
                </span>
                {showMapPicker ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showMapPicker && (
                <div className="p-2">
                  <MapPicker
                    lat={form.latitude} lng={form.longitude}
                    onPick={(lat, lng) => { set('latitude', lat); set('longitude', lng) }}
                  />
                  {form.latitude && form.longitude && (
                    <button type="button"
                      onClick={() => { set('latitude', null); set('longitude', null) }}
                      className="mt-1.5 text-xs text-red-400 hover:text-red-600">
                      地点をクリア
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 狩猟種別タグ + チーム連携 */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
        <div className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5">
          <Filter size={13} /> 狩猟種別タグ
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium">狩猟種別 *</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {HUNT_TYPE_OPTIONS.map(t => (
              <button
                key={t} type="button"
                onClick={() => set('method', t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                  form.method === t
                    ? `${HUNT_TYPE_STYLE[t] || 'bg-gray-200 text-gray-700'} border-transparent ring-2 ring-offset-1 ring-indigo-400`
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 有害駆除タグ */}
        <div>
          <button type="button" onClick={() => set('isPestControl', !form.isPestControl)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              form.isPestControl
                ? 'bg-red-100 text-red-700 border-transparent ring-2 ring-offset-1 ring-red-400'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
            }`}>
            {form.isPestControl ? '有害駆除' : '有害駆除'}
          </button>
        </div>

        {/* チーム選択 */}
        <div className="space-y-2 border-t border-indigo-200 pt-3">
            <div className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
              <Users2 size={12} /> 猟隊連携
            </div>
            <label className="block">
              <span className="text-xs text-gray-500 font-medium">猟隊を選択</span>
              <select value={form.teamId} onChange={e => set('teamId', e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                <option value="">選択しない</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            {form.teamId && teamMembers.length > 0 && (
              <div className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-1.5">
                捕獲記録で各メンバーを射手として設定できます（{teamMembers.length}人参加中）
              </div>
            )}
          </div>

        {/* 使用銃器 */}
        <div className="border-t border-indigo-200 pt-3">
          <label className="block">
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <Crosshair size={11} /> 使用銃器
            </span>
            <select value={form.firearmId} onChange={e => set('firearmId', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">選択してください</option>
              {firearms.flatMap(f => [
                <option key={f.id} value={f.id}>{f.name}（{f.type}）</option>,
                ...(f.alternateBars || []).map((bar, i) => (
                  <option key={`${f.id}__bar__${i}`} value={`${f.id}__bar__${i}`}>
                    {f.name}（{bar.type || '替え銃身'}）
                  </option>
                ))
              ])}
            </select>
          </label>
        </div>
      </div>

      {/* 捕獲記録 */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-green-800 flex items-center gap-1.5">
            <TreePine size={13} /> 捕獲記録（時刻別）
          </span>
          {form.teamId && teamMembers.length > 0 && (
            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
              射手記録モード
            </span>
          )}
          {catches.length === 0 && (
            <span className="text-xs text-gray-400">サマリー入力</span>
          )}
          {catches.length > 0 && (
            <span className="text-xs text-green-600">{catches.length}件の詳細記録</span>
          )}
        </div>

        {loadingCatches ? (
          <p className="text-xs text-gray-400">読み込み中...</p>
        ) : (
          <>
            {catches.map(c => (
              <CatchRow
                key={c._key} c={c}
                onChange={(f, v) => updateCatch(c._key, f, v)}
                onRemove={() => setCatches(prev => prev.filter(x => x._key !== c._key))}
                teamMembers={teamMembers}
                isGroupHunt={!!form.teamId}
              />
            ))}

            {catches.length === 0 && (
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500 font-medium">獲物（サマリー）</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {GAME_OPTIONS.map(g => (
                      <button key={g} type="button" onClick={() => set('game', form.game === g ? '' : g)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          form.game === g
                            ? 'bg-green-100 text-green-700 border-transparent ring-2 ring-offset-1 ring-green-400'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                        }`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium">頭数</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button type="button" onClick={() => set('count', Math.max(0, (Number(form.count) || 0) - 1))}
                      className="w-9 h-9 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg font-bold transition-colors">−</button>
                    <span className="text-xl font-bold text-stone-800 w-8 text-center">{form.count || 0}</span>
                    <button type="button" onClick={() => set('count', (Number(form.count) || 0) + 1)}
                      className="w-9 h-9 rounded-full border border-green-300 text-green-700 hover:bg-green-100 flex items-center justify-center text-lg font-bold transition-colors">+</button>
                  </div>
                </div>
                {/* 射手（チーム時は常に表示） */}
                {form.teamId && teamMembers.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 font-medium">射手</span>
                    <select value={form.shooterUserId || ''} onChange={e => set('shooterUserId', e.target.value)}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-600">
                      <option value="">射手を選択</option>
                      {teamMembers.map(m => (
                        <option key={m.userId} value={m.userId}>{m.displayName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 詳細（時刻・場所）トグル */}
                <button type="button" onClick={() => setShowCatchDetail(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-1.5 bg-green-100/60 hover:bg-green-100 rounded-lg text-xs font-medium text-green-700 transition-colors">
                  <span className="flex items-center gap-1.5">
                    {showCatchDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    詳細情報（時刻・場所）
                  </span>
                  <span className="text-green-400 text-[10px]">任意</span>
                </button>
                {showCatchDetail && (
                  <div className="flex items-center gap-2 flex-wrap border-t border-green-200 pt-2">
                    <input type="time" value={form.catchTime || ''} onChange={e => set('catchTime', e.target.value)}
                      className="border border-gray-200 rounded-md bg-white text-xs font-mono w-20 px-1.5 py-1 focus:outline-none shrink-0" />
                    <input type="text" placeholder="捕獲場所（任意）" value={form.catchLocation || ''} onChange={e => set('catchLocation', e.target.value)}
                      className="border border-gray-200 rounded-md bg-white text-xs px-1.5 py-1 focus:outline-none flex-1 min-w-[100px]" />
                  </div>
                )}
              </div>
            )}
            {catches.length > 0 && (
              <div className="text-xs text-green-700 font-medium">合計: {catchTotal}頭</div>
            )}
            <button type="button" onClick={() => setCatches(prev => [...prev, EMPTY_CATCH()])}
              className="w-full py-1.5 text-xs text-green-700 border border-green-300 border-dashed rounded-lg hover:bg-green-100 transition-colors">
              + 捕獲を追加
            </button>
            {catches.length === 0 && (
              <div className="text-[10px] text-gray-400 text-center">
                複数の捕獲を個別に記録する場合は「捕獲を追加」を使用
              </div>
            )}
          </>
        )}
      </div>

      {/* 目撃記録 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <Eye size={13} /> 目撃記録（捕獲なし）
          </span>
          <span className="text-xs text-gray-400">{sightings.length > 0 ? `${sightings.length}件` : '任意'}</span>
        </div>
        {loadingCatches ? (
          <p className="text-xs text-gray-400">読み込み中...</p>
        ) : (
          <>
            {sightings.map(s => (
              <SightingRow
                key={s._key} s={s}
                onChange={(f, v) => updateSighting(s._key, f, v)}
                onRemove={() => setSightings(prev => prev.filter(x => x._key !== s._key))}
              />
            ))}
            <button type="button" onClick={() => setSightings(prev => [...prev, EMPTY_SIGHTING()])}
              className="w-full py-1.5 text-xs text-amber-700 border border-amber-300 border-dashed rounded-lg hover:bg-amber-100 transition-colors">
              + 目撃を追加
            </button>
            {sightings.length > 0 && (
              <div className="text-xs text-amber-700 font-medium">
                合計: {sightings.reduce((s, r) => s + Number(r.count || 0), 0)}頭目撃
              </div>
            )}
          </>
        )}
      </div>

      {/* 装弾連携 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5"><Crosshair size={13} /> 装弾・発射弾数</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block col-span-2">
            <span className="text-xs text-gray-500 font-medium">使用装弾（在庫から選択）</span>
            <select value={form.ammoInventoryId} onChange={e => handleAmmoChange(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">選択（任意）</option>
              {ammoItems.map(a => (
                <option key={a.id} value={a.id}>{a.name}{a.caliber ? ` [${a.caliber}]` : ''} — 在庫: {a.quantity}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">発射弾数</span>
            <input type="number" min="0" placeholder="0" value={form.roundsFired} onChange={e => set('roundsFired', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </label>
          {selectedAmmo && (
            <div className="flex items-end pb-1 text-sm">
              <div>
                <span className="text-gray-400 text-xs">現在:</span>
                <span className={`ml-1 font-bold ${ammoShort ? 'text-red-500' : 'text-gray-800'}`}>{selectedAmmo.quantity}発</span>
                {roundsNum > 0 && !ammoShort && (
                  <span className="text-xs text-green-600 ml-1">→ {Number(selectedAmmo.quantity) - roundsNum}発</span>
                )}
              </div>
            </div>
          )}
        </div>
        {ammoShort && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle size={13} /> 発射弾数が在庫を超えています
          </div>
        )}
        {selectedAmmo && roundsNum > 0 && !ammoShort && (
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={deductAmmo} onChange={e => setDeductAmmo(e.target.checked)} className="w-4 h-4 accent-amber-500" />
            保存時に在庫から <strong>{roundsNum}発</strong> を差し引く
          </label>
        )}
      </div>

      <label className="block">
        <span className="text-xs text-gray-500 font-medium">メモ</span>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          placeholder="状況・気づき等..."
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit" className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">保存</button>
      </div>
    </form>
  )
}

// ── メインページ ───────────────────────────────────────────
export default function HuntingRecords() {
  const { user } = useAuth()
  const { records, add, update, remove, syncToTeam } = useHuntingRecords()
  const { records: grounds } = useHuntingGrounds()
  const { items: ammoItems, deduct } = useAmmoInventory()
  const { teams } = useHuntingTeams()
  const { records: firearms } = useFirearms()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [recordCatches, setRecordCatches] = useState({})
  const [recordSightings, setRecordSightings] = useState({})
  const [saving, setSaving] = useState(false)
  const [teamSyncMsg, setTeamSyncMsg] = useState('')
  const [viewFilter, setViewFilter] = useState('all') // 'all' | 'mine' | 'team'

  async function saveCatches(recordId, catches, teamMembers) {
    await supabase.from('hunting_catches').delete().eq('hunting_record_id', recordId)
    const valid = catches.filter(c => c.game)
    if (valid.length > 0) {
      await supabase.from('hunting_catches').insert(
        valid.map(c => ({
          hunting_record_id: recordId,
          user_id: user.id,
          catch_time: c.catchTime || null,
          game: c.game,
          count: Number(c.count) || 1,
          notes: c.notes || null,
          shooter_user_id: c.shooterUserId || null,
          catch_location: c.catchLocation || null,
          catch_lat: c.catchLat != null ? Number(c.catchLat) : null,
          catch_lng: c.catchLng != null ? Number(c.catchLng) : null,
        }))
      )
    }
  }

  async function saveSightings(recordId, sightings) {
    await supabase.from('hunting_sightings').delete().eq('hunting_record_id', recordId)
    const valid = sightings.filter(s => s.game)
    if (valid.length > 0) {
      await supabase.from('hunting_sightings').insert(
        valid.map(s => ({
          hunting_record_id: recordId,
          user_id: user.id,
          sight_time: s.sightTime || null,
          game: s.game,
          count: Number(s.count) || 1,
          location: s.location || null,
          notes: s.notes || null,
          sight_lat: s.sightLat != null ? Number(s.sightLat) : null,
          sight_lng: s.sightLng != null ? Number(s.sightLng) : null,
        }))
      )
    }
  }

  async function loadCatchesAndSightings(recordId) {
    if (recordCatches[recordId] && recordSightings[recordId]) return
    const [{ data: cd }, { data: sd }] = await Promise.all([
      supabase.from('hunting_catches')
        .select('*')
        .eq('hunting_record_id', recordId).order('catch_time'),
      supabase.from('hunting_sightings')
        .select('*')
        .eq('hunting_record_id', recordId).order('sight_time'),
    ])
    setRecordCatches(prev => ({ ...prev, [recordId]: cd || [] }))
    setRecordSightings(prev => ({ ...prev, [recordId]: sd || [] }))
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
    loadCatchesAndSightings(id)
  }

  async function handleSave(data) {
    setSaving(true)
    try {
      const { _catches, _sightings, _deductAmmo, _teamMembers, ...record } = data
      const saved = await add(record)
      if (_catches?.length > 0) await saveCatches(saved.id, _catches, _teamMembers || [])
      if (_sightings?.length > 0) await saveSightings(saved.id, _sightings)
      if (_deductAmmo && record.ammoInventoryId && record.roundsFired) {
        await deduct(record.ammoInventoryId, Number(record.roundsFired))
      }
      // チームメンバーへの自動連携
      if (record.teamId && _teamMembers?.length > 0) {
        const otherMembers = _teamMembers.filter(m => m.userId !== user.id)
        if (otherMembers.length > 0) {
          await syncToTeam(record, otherMembers.map(m => m.userId))
          setTeamSyncMsg(`${otherMembers.map(m => m.displayName).join('・')} さんに連携しました`)
          setTimeout(() => setTeamSyncMsg(''), 4000)
        }
      }
      setShowAdd(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id, data) {
    setSaving(true)
    try {
      const { _catches, _sightings, _deductAmmo, _teamMembers, ...record } = data
      await update(id, record)
      if (_catches) await saveCatches(id, _catches, _teamMembers || [])
      if (_sightings) await saveSightings(id, _sightings)
      if (_deductAmmo && record.ammoInventoryId && record.roundsFired) {
        await deduct(record.ammoInventoryId, Number(record.roundsFired))
      }
      setEditing(null)
      setRecordCatches(prev => { const n = { ...prev }; delete n[id]; return n })
      setRecordSightings(prev => { const n = { ...prev }; delete n[id]; return n })
      if (teamSyncMsg) setTeamSyncMsg('')
    } finally {
      setSaving(false)
    }
  }

  // フィルタリング
  const filteredRecords = [...records]
    .filter(r => {
      if (viewFilter === 'mine') return r.userId === user.id
      if (viewFilter === 'team') return r.userId !== user.id
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const myRecords = records.filter(r => r.userId === user.id)
  const teamRecords = records.filter(r => r.userId !== user.id)
  const totalGame = myRecords.reduce((s, r) => s + Number(r.count || 0), 0)
  const gameCounts = myRecords.reduce((acc, r) => { if (r.game) acc[r.game] = (acc[r.game] || 0) + Number(r.count || 0); return acc }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <TreePine className="text-green-600" size={24} /> 狩猟記録
        </h1>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
          <Plus size={16} /> 記録追加
        </button>
      </div>

      {/* チーム連携通知 */}
      {teamSyncMsg && (
        <div className="mb-4 flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-sm px-4 py-2.5 rounded-xl">
          <Users2 size={14} />
          <span>{teamSyncMsg}</span>
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          ['自分の出猟', myRecords.length, 'text-gray-800'],
          ['総獲物数', totalGame, 'text-green-600'],
          ['獲物/出猟', myRecords.length > 0 ? (totalGame / myRecords.length).toFixed(1) : '-', 'text-amber-600'],
        ].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <div className={`text-2xl font-bold ${c}`}>{v}</div>
            <div className="text-xs text-gray-500">{l}</div>
          </div>
        ))}
      </div>

      {/* 獲物サマリー */}
      {Object.keys(gameCounts).length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {Object.entries(gameCounts).sort((a, b) => b[1] - a[1]).map(([g, c]) => (
            <span key={g} className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">{g}: {c}頭</span>
          ))}
        </div>
      )}

      {/* フィルタータブ */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {[
          { id: 'all', label: `すべて (${records.length})` },
          { id: 'mine', label: `自分 (${myRecords.length})` },
          ...(teamRecords.length > 0 ? [{ id: 'team', label: `チーム (${teamRecords.length})` }] : []),
        ].map(f => (
          <button key={f.id} onClick={() => setViewFilter(f.id)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              viewFilter === f.id ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* 記録リスト */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          まだ記録がありません。「記録追加」から追加してください。
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map(r => {
            const isExpanded = expanded === r.id
            const catches = recordCatches[r.id]
            const sightings = recordSightings[r.id]
            const duration = r.departureTime && r.returnTime ? `${r.departureTime}〜${r.returnTime}` : r.departureTime ? `出発 ${r.departureTime}` : null
            const isTeamRecord = r.userId !== user.id
            const huntTypeStyle = HUNT_TYPE_STYLE[r.method] || 'bg-gray-100 text-gray-600'

            return (
              <div key={r.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isTeamRecord ? 'border-purple-200' : 'border-gray-100'}`}>
                {/* チーム記録バナー */}
                {isTeamRecord && (
                  <div className="bg-purple-50 px-4 py-1.5 flex items-center gap-1.5 text-xs text-purple-700">
                    <Users2 size={11} /> チーム記録 — {r.ownerName || '不明'} さんの記録
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{r.date}</span>
                        {r.groundName && (
                          <span className="flex items-center gap-0.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <MapPin size={10} /> {r.groundName}
                          </span>
                        )}
                        {r.teamName && (
                          <span className="flex items-center gap-0.5 text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                            <Users2 size={10} /> {r.teamName}
                          </span>
                        )}
                        {duration && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">⏱ {duration}</span>}
                        {(r.temperatureMin != null || r.temperatureMax != null) && (
                          <span className="text-xs text-gray-500">
                            🌡 {r.temperatureMin != null && r.temperatureMax != null
                              ? `${r.temperatureMin}〜${r.temperatureMax}°C`
                              : r.temperatureMin != null ? `最低 ${r.temperatureMin}°C`
                              : `最高 ${r.temperatureMax}°C`}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {/* 狩猟種別タグ */}
                        {r.method && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${huntTypeStyle}`}>{r.method}</span>
                        )}
                        {r.isPestControl && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">有害駆除</span>
                        )}
                        {r.game && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{r.game} {r.count ? `${r.count}頭` : ''}</span>}
                        {r.roundsFired > 0 && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><Crosshair size={10} /> {r.roundsFired}発</span>}
                        {r.count > 0 && r.roundsFired > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{(r.roundsFired / r.count).toFixed(1)}発/頭</span>}
                        {r.firearmName && (
                          <span className="flex items-center gap-0.5 bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-100">
                            <Crosshair size={9} /> {r.firearmName}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex gap-3 text-xs text-gray-400 flex-wrap">
                        {r.weather && <span>{r.weather}</span>}
                        {(r.ammoName || r.ammoUsed) && <span>装弾: {r.ammoName || r.ammoUsed}</span>}
                      </div>
                    </div>

                    <div className="flex gap-1 ml-2">
                      <button onClick={() => toggleExpand(r.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50">
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      {!isTeamRecord && (
                        <>
                          <button onClick={() => setEditing(r)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"><Pencil size={15} /></button>
                          <button onClick={() => remove(r.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
                        </>
                      )}
                    </div>
                  </div>
                  {r.notes && <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">{r.notes}</div>}
                </div>

                {/* 展開: 地図 + 捕獲タイムライン + 目撃記録 */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {!catches ? (
                      <div className="px-4 py-3 text-xs text-gray-400">読み込み中...</div>
                    ) : (
                      <>
                        {/* 地図表示 */}
                        {(r.latitude || catches.some(c => c.catch_lat) || (sightings || []).some(s => s.sight_lat)) && (
                          <div className="px-4 pt-3 pb-1">
                            <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                              <Map size={11} /> 地図
                            </div>
                            <HuntingRecordMap
                              latitude={r.latitude}
                              longitude={r.longitude}
                              catches={catches}
                              sightings={sightings || []}
                            />
                          </div>
                        )}
                        {/* 捕獲タイムライン */}
                        <div className="bg-green-50 px-4 py-3">
                          <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                            <TreePine size={11} className="text-green-600" /> 捕獲記録
                          </div>
                          {catches.length === 0 ? (
                            <p className="text-xs text-gray-400">個別捕獲記録なし</p>
                          ) : (
                            <div className="space-y-1.5">
                              {catches.map(c => (
                                <div key={c.id} className="flex items-center gap-3 text-xs flex-wrap">
                                  <span className="font-mono text-gray-500 w-12 shrink-0">{c.catch_time || '--:--'}</span>
                                  <span className="font-semibold text-green-700">{c.game} {c.count}頭</span>
                                  {c.shooter?.display_name && (
                                    <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                                      <User size={9} /> {c.shooter.display_name}
                                    </span>
                                  )}
                                  {(c.catch_lat != null) && (
                                    <span className="flex items-center gap-0.5 text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                                      <MapPin size={9} /> 地点あり
                                    </span>
                                  )}
                                  {c.notes && <span className="text-gray-400">— {c.notes}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* 目撃記録 */}
                        {sightings && sightings.length > 0 && (
                          <div className="bg-amber-50 px-4 py-3 border-t border-amber-100">
                            <div className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                              <Eye size={11} /> 目撃記録
                            </div>
                            <div className="space-y-1.5">
                              {sightings.map(s => (
                                <div key={s.id} className="flex items-center gap-3 text-xs flex-wrap">
                                  <span className="font-mono text-gray-500 w-12 shrink-0">{s.sight_time || '--:--'}</span>
                                  <span className="font-semibold text-amber-700">{s.game} {s.count}頭</span>
                                  {s.location && (
                                    <span className="flex items-center gap-0.5 text-gray-600 bg-white px-1.5 py-0.5 rounded-full border border-amber-200">
                                      <MapPin size={9} /> {s.location}
                                    </span>
                                  )}
                                  {(s.sight_lat != null) && (
                                    <span className="flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-300">
                                      <MapPin size={9} /> 地点あり
                                    </span>
                                  )}
                                  {s.notes && <span className="text-gray-400">— {s.notes}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* モーダル */}
      {showAdd && (
        <Modal title="狩猟記録を追加" onClose={() => setShowAdd(false)}>
          <RecordForm
            grounds={grounds} ammoItems={ammoItems} teams={teams} firearms={firearms}
            onSave={handleSave} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="記録を編集" onClose={() => setEditing(null)}>
          <RecordForm
            initial={editing} grounds={grounds} ammoItems={ammoItems} teams={teams} firearms={firearms}
            onSave={d => handleUpdate(editing.id, d)} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}
