import { useState } from 'react'
import { Plus, Trash2, Pencil, Target, Crosshair, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { useShootingRecords, useAmmoInventory, useFirearms, useShootingRanges } from '../store/useStore'
import Modal from '../components/Modal'

// ── 競技種別定義 ─────────────────────────────────────────────────────────────
const DISCIPLINES = [
  { id: 'intl_trap',  label: '国際トラップ',  category: 'クレー射撃',   type: 'trap'   },
  { id: 'jp_trap',    label: '和式トラップ',  category: 'クレー射撃',   type: 'trap'   },
  { id: 'intl_skeet', label: '国際スキート',  category: 'クレー射撃',   type: 'skeet'  },
  { id: 'jp_skeet',   label: '和式スキート',  category: 'クレー射撃',   type: 'skeet'  },
  { id: 'rifle_10m',  label: 'ライフル 10m',  category: 'ライフル射撃', type: 'target' },
  { id: 'rifle_50m',  label: 'ライフル 50m',  category: 'ライフル射撃', type: 'target' },
  { id: 'rifle_300m', label: 'ライフル 300m', category: 'ライフル射撃', type: 'target' },
  { id: 'pistol_10m', label: '拳銃 10m',      category: '拳銃射撃',    type: 'target' },
  { id: 'pistol_25m', label: '拳銃 25m',      category: '拳銃射撃',    type: 'target' },
  { id: 'other',      label: 'その他',         category: 'その他',      type: 'other'  },
]
const DISC_CATEGORIES = [...new Set(DISCIPLINES.map(d => d.category))]
function getDisc(id) { return DISCIPLINES.find(d => d.id === id) || null }

// ── スコアデータ初期化 ─────────────────────────────────────────────────────
const SKEET_STATIONS = [
  { st: 1, hasDouble: true  },
  { st: 2, hasDouble: true  },
  { st: 3, hasDouble: false },
  { st: 4, hasDouble: false },
  { st: 5, hasDouble: false },
  { st: 6, hasDouble: true  },
  { st: 7, hasDouble: true  },
  { st: 8, hasDouble: false },
]

function initTrapDetail(n = 25) {
  return { type: 'trap', shots: Array.from({ length: n }, (_, i) => ({ n: i + 1, hit: null, dir: null, shotNum: null })) }
}
function initSkeetDetail() {
  return {
    type: 'skeet',
    stations: SKEET_STATIONS.map(s => ({
      st: s.st, h: null, h_shotNum: null, l: null, l_shotNum: null,
      ...(s.hasDouble ? { dh: null, dl: null } : {}),
    })),
  }
}
function initTargetDetail(n = 10) {
  return { type: 'target', shots: Array.from({ length: n }, (_, i) => ({ n: i + 1, score: '' })) }
}
function initScoreDetail(disciplineId) {
  const disc = getDisc(disciplineId)
  if (!disc) return null
  if (disc.type === 'trap')   return initTrapDetail(25)
  if (disc.type === 'skeet')  return initSkeetDetail()
  if (disc.type === 'target') return initTargetDetail(10)
  return null
}

// ── スコア計算 ─────────────────────────────────────────────────────────────
function calcScore(scoreDetail) {
  if (!scoreDetail) return null
  if (scoreDetail.type === 'trap') {
    return scoreDetail.shots.filter(s => s.hit === true).length
  }
  if (scoreDetail.type === 'skeet') {
    let hits = 0
    for (const st of scoreDetail.stations) {
      if (st.h === true) hits++
      if (st.l === true) hits++
      if (st.dh === true) hits++
      if (st.dl === true) hits++
    }
    return hits
  }
  if (scoreDetail.type === 'target') {
    const sum = scoreDetail.shots.reduce((s, sh) => s + (Number(sh.score) || 0), 0)
    return parseFloat(sum.toFixed(1))
  }
  return null
}

// ── トラップスコアシート ───────────────────────────────────────────────────
const DIRS = [{ key: 'left', label: '左' }, { key: 'center', label: '中' }, { key: 'right', label: '右' }]

function TrapShotCell({ shot, onChange }) {
  function cycle() {
    if (shot.hit === null)  onChange({ ...shot, hit: true,  shotNum: 1, dir: 'center' })
    else if (shot.hit)      onChange({ ...shot, hit: false, shotNum: null, dir: null })
    else                    onChange({ ...shot, hit: null,  shotNum: null, dir: null })
  }
  const is2 = shot.hit === true && shot.shotNum === 2
  const ringClass = shot.hit === true
    ? (is2 ? 'bg-amber-500 text-white' : 'bg-green-500 text-white')
    : shot.hit === false ? 'bg-red-400 text-white'
    : 'bg-white border border-gray-300 text-gray-300'
  const cellClass = shot.hit === true
    ? (is2 ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-300')
    : shot.hit === false ? 'bg-red-50 border-red-200'
    : 'bg-gray-50 border-gray-200'

  return (
    <div className={`border rounded-lg p-1.5 text-center select-none ${cellClass}`}>
      <div className="text-[10px] text-gray-400 leading-tight">{shot.n}</div>
      <button type="button" onClick={cycle}
        className={`w-8 h-8 rounded-full text-sm font-bold mx-auto flex items-center justify-center transition-colors mt-0.5 ${ringClass}`}>
        {shot.hit === true ? '○' : shot.hit === false ? '×' : '?'}
      </button>
      {shot.hit === true && (
        <>
          <div className="flex justify-center gap-px mt-1">
            <button type="button" onClick={() => onChange({ ...shot, shotNum: 1 })}
              className={`px-1 py-0.5 rounded text-[9px] font-semibold transition-colors ${shot.shotNum === 1 ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:border-green-300'}`}>
              1矢
            </button>
            <button type="button" onClick={() => onChange({ ...shot, shotNum: 2 })}
              className={`px-1 py-0.5 rounded text-[9px] font-semibold transition-colors ${shot.shotNum === 2 ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:border-amber-300'}`}>
              2矢
            </button>
          </div>
          <div className="flex justify-center gap-px mt-0.5">
            {DIRS.map(d => (
              <button key={d.key} type="button" onClick={() => onChange({ ...shot, dir: d.key })}
                className={`px-1 py-0.5 rounded text-[9px] font-semibold transition-colors ${shot.dir === d.key ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:border-blue-300'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TrapScoreSheet({ data, onChange }) {
  if (!data || data.type !== 'trap') return null
  const hits = data.shots.filter(s => s.hit === true).length
  function updateShot(i, s) {
    const shots = [...data.shots]; shots[i] = s; onChange({ ...data, shots })
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600">トラップスコアシート</span>
        <span className="text-sm font-bold text-green-700">{hits} / {data.shots.length} 中</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {data.shots.map((shot, i) => (
          <TrapShotCell key={shot.n} shot={shot} onChange={s => updateShot(i, s)} />
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">タップ: ?→○（命中）→×（失中）→?　命中時は方向を選択</p>
    </div>
  )
}

// ── スキートスコアシート ───────────────────────────────────────────────────
// ダブル用（1矢/2矢なし）
function BirdBtn({ label, value, onChange }) {
  function cycle() {
    if (value === null) onChange(true)
    else if (value === true) onChange(false)
    else onChange(null)
  }
  return (
    <button type="button" onClick={cycle}
      className={`px-2 py-1 rounded text-xs font-bold transition-colors min-w-[28px] text-center ${
        value === true  ? 'bg-green-500 text-white' :
        value === false ? 'bg-red-400 text-white'   :
        'bg-white border border-gray-200 text-gray-400 hover:border-gray-400'
      }`}>
      {value === true ? '○' : value === false ? '×' : label}
    </button>
  )
}

// シングル用（1矢/2矢トグル付き）
function SkeetSingleBtn({ label, value, shotNum, onValue, onShotNum }) {
  function cycle() {
    if (value === null)       onValue(true)
    else if (value === true)  onValue(false)
    else                      onValue(null)
  }
  const is2 = value === true && shotNum === 2
  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <button type="button" onClick={cycle}
        className={`px-2 py-1 rounded text-xs font-bold transition-colors min-w-[28px] text-center ${
          value === true  ? (is2 ? 'bg-amber-500 text-white' : 'bg-green-500 text-white') :
          value === false ? 'bg-red-400 text-white' :
          'bg-white border border-gray-200 text-gray-400 hover:border-gray-400'
        }`}>
        {value === true ? '○' : value === false ? '×' : label}
      </button>
      {value === true && (
        <div className="flex gap-px">
          <button type="button" onClick={() => onShotNum(1)}
            className={`px-1 rounded text-[8px] font-bold leading-tight transition-colors ${shotNum === 1 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
            1
          </button>
          <button type="button" onClick={() => onShotNum(2)}
            className={`px-1 rounded text-[8px] font-bold leading-tight transition-colors ${shotNum === 2 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
            2
          </button>
        </div>
      )}
    </div>
  )
}

function SkeetScoreSheet({ data, onChange }) {
  if (!data || data.type !== 'skeet') return null
  let hits = 0
  for (const st of data.stations) {
    if (st.h === true) hits++
    if (st.l === true) hits++
    if (st.dh === true) hits++
    if (st.dl === true) hits++
  }
  function updateStation(i, fields) {
    const stations = data.stations.map((s, j) => j === i ? { ...s, ...fields } : s)
    onChange({ ...data, stations })
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600">スキートスコアシート</span>
        <span className="text-sm font-bold text-green-700">{hits} / 25 中</span>
      </div>
      <div className="space-y-1.5">
        {data.stations.map((st, i) => (
          <div key={st.st} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2">
            <span className="text-xs font-semibold text-gray-500 w-8 shrink-0">St.{st.st}</span>
            <div className="flex gap-1.5 flex-wrap items-start">
              <SkeetSingleBtn label="H" value={st.h} shotNum={st.h_shotNum}
                onValue={v => updateStation(i, { h: v, ...(v !== true ? { h_shotNum: null } : { h_shotNum: st.h_shotNum ?? 1 }) })}
                onShotNum={n => updateStation(i, { h_shotNum: n })} />
              <SkeetSingleBtn label="L" value={st.l} shotNum={st.l_shotNum}
                onValue={v => updateStation(i, { l: v, ...(v !== true ? { l_shotNum: null } : { l_shotNum: st.l_shotNum ?? 1 }) })}
                onShotNum={n => updateStation(i, { l_shotNum: n })} />
              {st.dh !== undefined && (
                <>
                  <span className="text-gray-300 self-center text-xs">│</span>
                  <BirdBtn label="DH" value={st.dh} onChange={v => updateStation(i, { dh: v })} />
                  <BirdBtn label="DL" value={st.dl} onChange={v => updateStation(i, { dl: v })} />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">H/L: タップで命中/失中、数字で1矢/2矢 | DH/DL=ダブル（2矢なし）</p>
    </div>
  )
}

// ── 標的射撃スコアシート ──────────────────────────────────────────────────
function TargetScoreSheet({ data, onChange }) {
  if (!data || data.type !== 'target') return null
  const total = parseFloat(data.shots.reduce((s, sh) => s + (Number(sh.score) || 0), 0).toFixed(1))

  function updateScore(i, val) {
    const shots = data.shots.map((s, j) => j === i ? { ...s, score: val } : s)
    onChange({ ...data, shots })
  }
  function addShot() {
    onChange({ ...data, shots: [...data.shots, { n: data.shots.length + 1, score: '' }] })
  }
  function removeShot() {
    if (data.shots.length > 1) onChange({ ...data, shots: data.shots.slice(0, -1) })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600">標的射撃スコアシート</span>
        <span className="text-sm font-bold text-green-700">合計: {total}</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5 mb-2">
        {data.shots.map((sh, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-1.5 text-center">
            <div className="text-[10px] text-gray-400 mb-0.5">{sh.n}射</div>
            <input type="number" min="0" max="10" step="0.1"
              value={sh.score} onChange={e => updateScore(i, e.target.value)}
              className="w-full text-center text-sm font-bold border rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
              placeholder="-" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={addShot} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100">+ 追加</button>
        <button type="button" onClick={removeShot} className="px-2 py-1 text-xs bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-gray-100">− 削除</button>
      </div>
    </div>
  )
}

function ScoreSheet({ disciplineId, data, onChange }) {
  const disc = getDisc(disciplineId)
  if (!disc || disc.type === 'other') return null
  if (disc.type === 'trap')   return <TrapScoreSheet   data={data} onChange={onChange} />
  if (disc.type === 'skeet')  return <SkeetScoreSheet  data={data} onChange={onChange} />
  if (disc.type === 'target') return <TargetScoreSheet data={data} onChange={onChange} />
  return null
}

// ── スコア詳細表示（読み取り専用） ───────────────────────────────────────
const DIR_LABELS = { left: '左', center: '中', right: '右' }

function StatBox({ label, value, sub, color = 'text-gray-800', bg = 'bg-gray-50' }) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function MiniBar({ items }) {
  // items: [{label, count, color}]
  const total = items.reduce((s, i) => s + i.count, 0)
  if (total === 0) return null
  return (
    <div>
      <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
        {items.map(item => item.count > 0 && (
          <div key={item.label} style={{ flex: item.count }}
            className={`${item.color} flex items-center justify-center text-[9px] text-white font-bold`}>
            {Math.round(item.count / total * 100) >= 15 ? `${Math.round(item.count / total * 100)}%` : ''}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-1 flex-wrap">
        {items.map(item => (
          <span key={item.label} className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${item.color}`} />
            {item.label}: {item.count} ({total > 0 ? Math.round(item.count / total * 100) : 0}%)
          </span>
        ))}
      </div>
    </div>
  )
}

// ── トラップ詳細 ──────────────────────────────────────────────────────────
function TrapDetailView({ shots }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {shots.map(s => {
        const is2 = s.hit === true && s.shotNum === 2
        return (
          <div key={s.n}
            className={`rounded p-1 text-center text-[10px] border ${
              is2             ? 'bg-amber-50 border-amber-200' :
              s.hit === true  ? 'bg-green-50 border-green-200' :
              s.hit === false ? 'bg-red-50 border-red-200'     :
              'bg-gray-50 border-gray-100'}`}>
            <div className="text-gray-400">{s.n}</div>
            <div className={`font-bold text-sm ${is2 ? 'text-amber-600' : s.hit === true ? 'text-green-600' : s.hit === false ? 'text-red-500' : 'text-gray-300'}`}>
              {s.hit === true ? '○' : s.hit === false ? '×' : '?'}
            </div>
            {s.hit === true && (
              <div className={`text-[9px] font-bold ${is2 ? 'text-amber-500' : 'text-green-600'}`}>
                {s.shotNum === 2 ? '2矢' : '1矢'}
              </div>
            )}
            {s.hit === true && s.dir && (
              <div className="text-blue-500 text-[9px] font-semibold">{DIR_LABELS[s.dir] || s.dir}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TrapAnalyticsPanel({ shots }) {
  const total  = shots.length
  const hits   = shots.filter(s => s.hit === true).length
  const misses = shots.filter(s => s.hit === false).length
  const hitRate = total > 0 ? Math.round(hits / total * 100) : 0
  const first  = shots.filter(s => s.hit === true && s.shotNum === 1).length
  const second = shots.filter(s => s.hit === true && s.shotNum === 2).length
  const firstRate  = hits > 0 ? Math.round(first  / hits * 100) : 0
  const secondRate = hits > 0 ? Math.round(second / hits * 100) : 0
  const dirs = { left: 0, center: 0, right: 0 }
  shots.filter(s => s.hit === true && s.dir).forEach(s => { dirs[s.dir] = (dirs[s.dir] || 0) + 1 })

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="命中" value={`${hits}/${total}`} sub={`${hitRate}%`} color="text-green-700" bg="bg-green-50" />
        <StatBox label="1矢命中" value={`${first}`} sub={`${firstRate}%`} color="text-blue-700" bg="bg-blue-50" />
        <StatBox label="失中" value={`${misses}`} sub={total > 0 ? `${100 - hitRate}%` : '-'} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* 命中/失中バー */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-1.5">命中 / 失中の内訳</div>
        <MiniBar items={[
          { label: '1矢命中', count: first,  color: 'bg-green-500' },
          { label: '2矢命中', count: second, color: 'bg-amber-400' },
          { label: '失中',    count: misses, color: 'bg-red-400'   },
        ]} />
      </div>

      {/* 方向別 */}
      {hits > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1.5">方向別命中分布</div>
          <MiniBar items={[
            { label: '左', count: dirs.left,   color: 'bg-blue-400'   },
            { label: '中', count: dirs.center, color: 'bg-purple-400' },
            { label: '右', count: dirs.right,  color: 'bg-cyan-400'   },
          ]} />
          <div className="flex gap-2 mt-2">
            {[['left','左','bg-blue-50 border-blue-200 text-blue-700'],
              ['center','中','bg-purple-50 border-purple-200 text-purple-700'],
              ['right','右','bg-cyan-50 border-cyan-200 text-cyan-700']].map(([key, label, cls]) => (
              <div key={key} className={`flex-1 text-center border rounded-lg py-2 text-xs font-semibold ${cls}`}>
                {label}<br />
                <span className="text-base font-bold">{dirs[key] || 0}</span>
                <span className="text-[10px] font-normal ml-0.5">
                  ({hits > 0 ? Math.round((dirs[key] || 0) / hits * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1矢 vs 2矢 */}
      {hits > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
            <div className="text-green-700 font-semibold">1矢命中率</div>
            <div className="text-2xl font-bold text-green-700">{firstRate}%</div>
            <div className="text-[10px] text-gray-400">{first}中 / {hits}命中中</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
            <div className="text-amber-700 font-semibold">2矢命中率</div>
            <div className="text-2xl font-bold text-amber-700">{secondRate}%</div>
            <div className="text-[10px] text-gray-400">{second}中 / {hits}命中中</div>
          </div>
        </div>
      )}

      {/* 弾図 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-1.5">ショット詳細</div>
        <TrapDetailView shots={shots} />
      </div>
    </div>
  )
}

// ── スキート詳細 ──────────────────────────────────────────────────────────
function SkeetDetailView({ stations }) {
  return (
    <div className="space-y-1">
      {stations.map(st => {
        const birds = [
          { key: 'h',  label: 'H',  val: st.h,  shotNum: st.h_shotNum, isSingle: true  },
          { key: 'l',  label: 'L',  val: st.l,  shotNum: st.l_shotNum, isSingle: true  },
          ...(st.dh !== undefined
            ? [{ key: 'dh', label: 'DH', val: st.dh, isSingle: false },
               { key: 'dl', label: 'DL', val: st.dl, isSingle: false }]
            : []),
        ]
        return (
          <div key={st.st} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-8 shrink-0">St.{st.st}</span>
            <div className="flex gap-1 flex-wrap">
              {birds.map(b => {
                const is2 = b.isSingle && b.val === true && b.shotNum === 2
                return (
                  <span key={b.key} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    is2             ? 'bg-amber-100 text-amber-700' :
                    b.val === true  ? 'bg-green-100 text-green-700' :
                    b.val === false ? 'bg-red-100 text-red-600'     :
                    'bg-gray-100 text-gray-400'}`}>
                    {b.val === true ? '○' : b.val === false ? '×' : '-'}{b.label}
                    {b.isSingle && b.val === true && (
                      <span className={`ml-0.5 text-[8px] ${is2 ? 'text-amber-600' : 'text-green-600'}`}>
                        {b.shotNum === 2 ? '2矢' : '1矢'}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SkeetAnalyticsPanel({ stations }) {
  let hHits = 0, hTotal = 0, lHits = 0, lTotal = 0, dhHits = 0, dhTotal = 0, dlHits = 0, dlTotal = 0
  let first1 = 0, first2 = 0

  for (const st of stations) {
    hTotal++; if (st.h === true) { hHits++; if (st.h_shotNum === 1) first1++; else if (st.h_shotNum === 2) first2++ }
    lTotal++; if (st.l === true) { lHits++ }
    if (st.dh !== undefined) { dhTotal++; if (st.dh === true) dhHits++ }
    if (st.dl !== undefined) { dlTotal++; if (st.dl === true) dlHits++ }
  }
  const totalPossible = hTotal + lTotal + dhTotal + dlTotal
  const totalHits     = hHits  + lHits  + dhHits  + dlHits
  const hitRate = totalPossible > 0 ? Math.round(totalHits / totalPossible * 100) : 0

  // Station summary
  const stationStats = stations.map(st => {
    let h = 0, t = 0
    if (st.h === true) h++; t++
    if (st.l === true) h++; t++
    if (st.dh !== undefined) { if (st.dh === true) h++; t++ }
    if (st.dl !== undefined) { if (st.dl === true) h++; t++ }
    return { st: st.st, hits: h, total: t }
  })

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="総命中" value={`${totalHits}/${totalPossible}`} sub={`${hitRate}%`} color="text-green-700" bg="bg-green-50" />
        <StatBox label="H命中率" value={`${hTotal > 0 ? Math.round(hHits/hTotal*100) : 0}%`} sub={`${hHits}/${hTotal}`} color="text-blue-700" bg="bg-blue-50" />
        <StatBox label="L命中率" value={`${lTotal > 0 ? Math.round(lHits/lTotal*100) : 0}%`} sub={`${lHits}/${lTotal}`} color="text-purple-700" bg="bg-purple-50" />
      </div>

      {/* H/L/Double分布 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-1.5">バード別命中</div>
        <MiniBar items={[
          { label: 'H',  count: hHits,  color: 'bg-blue-500'   },
          { label: 'L',  count: lHits,  color: 'bg-purple-500' },
          { label: 'DH', count: dhHits, color: 'bg-cyan-500'   },
          { label: 'DL', count: dlHits, color: 'bg-teal-500'   },
        ]} />
      </div>

      {/* ステーション別 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-1.5">ステーション別成績</div>
        <div className="grid grid-cols-4 gap-1.5">
          {stationStats.map(s => {
            const rate = s.total > 0 ? Math.round(s.hits / s.total * 100) : 0
            return (
              <div key={s.st} className={`rounded-lg p-2 text-center border ${
                rate === 100 ? 'bg-green-50 border-green-200' :
                rate >= 50   ? 'bg-blue-50 border-blue-200'   :
                               'bg-red-50 border-red-200'}`}>
                <div className="text-[10px] text-gray-500">St.{s.st}</div>
                <div className={`text-sm font-bold ${rate === 100 ? 'text-green-700' : rate >= 50 ? 'text-blue-700' : 'text-red-600'}`}>
                  {s.hits}/{s.total}
                </div>
                <div className="text-[10px] text-gray-400">{rate}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 詳細 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-1.5">ショット詳細</div>
        <SkeetDetailView stations={stations} />
      </div>
    </div>
  )
}

// ── 標的射撃詳細 ─────────────────────────────────────────────────────────
function TargetDetailView({ shots }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {shots.map(s => {
        const v = Number(s.score)
        const colorClass = v >= 10 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                           v >= 9  ? 'text-green-700 bg-green-50 border-green-200' :
                           v >= 8  ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                     'text-gray-600 bg-gray-50 border-gray-100'
        return (
          <div key={s.n} className={`border rounded p-1 text-center ${s.score !== '' ? colorClass : 'bg-gray-50 border-gray-100'}`}>
            <div className="text-[10px] text-gray-400">{s.n}射</div>
            <div className="font-bold text-sm">{s.score !== '' ? s.score : '-'}</div>
          </div>
        )
      })}
    </div>
  )
}

function TargetAnalyticsPanel({ shots }) {
  const valid = shots.filter(s => s.score !== '' && s.score != null)
  const scores = valid.map(s => Number(s.score))
  const total = scores.reduce((a, b) => a + b, 0)
  const avg = valid.length > 0 ? (total / valid.length).toFixed(1) : '-'
  const max = valid.length > 0 ? Math.max(...scores) : '-'
  const min = valid.length > 0 ? Math.min(...scores) : '-'
  const perfect = scores.filter(s => s === 10).length
  const maxPossible = valid.length * 10
  const rate = maxPossible > 0 ? Math.round(total / maxPossible * 100) : 0

  // 点数分布
  const dist = [10,9,8,7,6,5].map(v => ({ label: `${v}点`, count: scores.filter(s => s === v).length }))

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="合計点" value={total} sub={`得点率 ${rate}%`} color="text-blue-700" bg="bg-blue-50" />
        <StatBox label="平均点" value={avg} sub={`最高 ${max} / 最低 ${min}`} color="text-green-700" bg="bg-green-50" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="10点（満点）" value={`${perfect}射`} sub={valid.length > 0 ? `${Math.round(perfect/valid.length*100)}%` : '-'} color="text-yellow-600" bg="bg-yellow-50" />
        <StatBox label="採点済み" value={`${valid.length}射`} sub={`全${shots.length}射`} color="text-gray-700" bg="bg-gray-50" />
      </div>

      {/* 点数分布バー */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-1.5">点数分布</div>
        <div className="space-y-1">
          {dist.filter(d => d.count > 0 || true).map(d => (
            <div key={d.label} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-10 shrink-0 text-right">{d.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    d.label === '10点' ? 'bg-yellow-400' :
                    d.label === '9点'  ? 'bg-green-500'  :
                    d.label === '8点'  ? 'bg-blue-400'   : 'bg-gray-400'}`}
                  style={{ width: valid.length > 0 ? `${Math.round(d.count / valid.length * 100)}%` : '0%' }}
                />
              </div>
              <span className="text-[10px] text-gray-500 w-8 shrink-0">{d.count}射</span>
            </div>
          ))}
        </div>
      </div>

      {/* 弾図 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-1.5">各射点数</div>
        <TargetDetailView shots={shots} />
      </div>
    </div>
  )
}

// ── 詳細パネル（カードクリックで展開） ───────────────────────────────────
function RecordDetailPanel({ scoreDetail }) {
  if (!scoreDetail) return (
    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 text-center">
      スコア詳細データなし
    </div>
  )
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {scoreDetail.type === 'trap'   && <TrapAnalyticsPanel   shots={scoreDetail.shots} />}
      {scoreDetail.type === 'skeet'  && <SkeetAnalyticsPanel  stations={scoreDetail.stations} />}
      {scoreDetail.type === 'target' && <TargetAnalyticsPanel shots={scoreDetail.shots} />}
    </div>
  )
}

// ── 記録フォーム ─────────────────────────────────────────────────────────
const EMPTY = {
  date: '', rangeId: '', location: '', firearmId: '',
  discipline: '', scoreDetail: null, score: '', rounds: '',
  notes: '', ammoInventoryId: '', ammoName: '',
}

function RecordForm({ initial, onSave, onCancel, ammoItems, firearms, ranges }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial,
    scoreDetail: initial?.scoreDetail || null,
    discipline: initial?.discipline || '',
    rangeId: initial?.rangeId || '',
    firearmId: initial?.firearmId || '',
  })
  const [deductAmmo, setDeductAmmo] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const disc = getDisc(form.discipline)
  const computedScore = calcScore(form.scoreDetail)
  const displayScore = computedScore !== null ? computedScore : (form.score !== '' ? Number(form.score) : null)
  const selectedAmmo = ammoItems.find(a => a.id === form.ammoInventoryId)
  const roundsNum = Number(form.rounds) || 0
  const ammoShort = selectedAmmo && roundsNum > Number(selectedAmmo.quantity)

  function handleDisciplineChange(id) {
    set('discipline', id)
    // Only reinitialize if no existing detail or discipline type changed
    const prev = getDisc(form.discipline)
    const next = getDisc(id)
    if (!form.scoreDetail || prev?.type !== next?.type) {
      set('scoreDetail', initScoreDetail(id))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const ammoObj = ammoItems.find(a => a.id === form.ammoInventoryId)
    onSave({
      ...form,
      score: displayScore,
      scoreDetail: form.scoreDetail,
      ammoName: ammoObj?.name || form.ammoName || null,
      _deductAmmo: deductAmmo && !!selectedAmmo && roundsNum > 0,
    })
  }

  const discGroups = DISC_CATEGORIES.map(cat => ({
    label: cat, items: DISCIPLINES.filter(d => d.category === cat)
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">日付 *</span>
          <input type="date" required value={form.date} onChange={e => set('date', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">競技種別 *</span>
          <select required value={form.discipline} onChange={e => handleDisciplineChange(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">選択してください</option>
            {discGroups.map(g => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">射撃場</span>
          <select value={form.rangeId} onChange={e => { set('rangeId', e.target.value); if (e.target.value) set('location', '') }}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">選択または手入力</option>
            {ranges.map(r => <option key={r.id} value={r.id}>{r.name}（{r.prefecture}）</option>)}
          </select>
          {!form.rangeId && (
            <input type="text" placeholder="射撃場名を入力" value={form.location}
              onChange={e => set('location', e.target.value)}
              className="mt-1.5 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          )}
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">使用銃器</span>
          <select value={form.firearmId} onChange={e => set('firearmId', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">選択（任意）</option>
            {firearms.map(f => <option key={f.id} value={f.id}>{f.name}{f.caliber ? ` [${f.caliber}]` : ''}</option>)}
          </select>
        </label>
      </div>

      {/* スコアシート */}
      {form.discipline && disc?.type !== 'other' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <ScoreSheet
            disciplineId={form.discipline}
            data={form.scoreDetail}
            onChange={d => set('scoreDetail', d)}
          />
          {computedScore !== null && (
            <div className="pt-2 border-t border-blue-200 flex items-center gap-2 text-sm font-semibold text-blue-800">
              <Target size={14} /> 自動計算スコア:
              <span className="text-2xl text-blue-700 font-bold">{computedScore}</span>
              {(disc.type === 'trap' || disc.type === 'skeet') && (
                <span className="text-gray-400 font-normal">/ 25</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 手入力スコア（その他） */}
      {(!form.discipline || disc?.type === 'other') && (
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">スコア</span>
          <input type="number" placeholder="スコアを入力" value={form.score}
            onChange={e => set('score', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
      )}

      {/* 装弾連携 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
          <Crosshair size={13} /> 装弾・発射弾数
        </div>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">使用装弾（在庫から選択）</span>
          <select value={form.ammoInventoryId}
            onChange={e => { set('ammoInventoryId', e.target.value); const a = ammoItems.find(a => a.id === e.target.value); if (a) set('ammoName', a.name) }}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="">選択（任意）</option>
            {ammoItems.map(a => <option key={a.id} value={a.id}>{a.name}{a.caliber ? ` [${a.caliber}]` : ''} — 在庫: {a.quantity}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">使用弾数</span>
            <input type="number" placeholder="25" value={form.rounds} onChange={e => set('rounds', e.target.value)}
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
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
            <AlertTriangle size={12} /> 発射弾数が在庫を超えています
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
          placeholder="練習内容・気づき等..."
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit" className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存</button>
      </div>
    </form>
  )
}

// ── メインページ ─────────────────────────────────────────────────────────
export default function ShootingRecords() {
  const { records, add, update, remove } = useShootingRecords()
  const { items: ammoItems, deduct } = useAmmoInventory()
  const { records: firearms } = useFirearms()
  const { records: ranges }   = useShootingRanges()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterDisc, setFilterDisc] = useState('すべて')
  const [saving, setSaving]   = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const sorted = [...records].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const discIds = [...new Set(sorted.map(r => r.discipline).filter(Boolean))]
  const filtered = filterDisc === 'すべて' ? sorted : sorted.filter(r => r.discipline === filterDisc)

  const scoredRecords = records.filter(r => r.score != null)
  const avgScore = scoredRecords.length > 0
    ? (scoredRecords.reduce((s, r) => s + Number(r.score), 0) / scoredRecords.length).toFixed(1)
    : '-'

  async function handleSave(data) {
    setSaving(true)
    try {
      const { _deductAmmo, ...record } = data
      await add(record)
      if (_deductAmmo && record.ammoInventoryId && record.rounds) await deduct(record.ammoInventoryId, Number(record.rounds))
      setShowAdd(false)
    } finally { setSaving(false) }
  }

  async function handleUpdate(id, data) {
    setSaving(true)
    try {
      const { _deductAmmo, ...record } = data
      await update(id, record)
      if (_deductAmmo && record.ammoInventoryId && record.rounds) await deduct(record.ammoInventoryId, Number(record.rounds))
      setEditing(null)
    } finally { setSaving(false) }
  }

  const sharedProps = { ammoItems, firearms, ranges }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Target className="text-blue-500" size={24} /> 射撃記録
        </h1>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
          <Plus size={16} /> 記録追加
        </button>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-800">{records.length}</div>
          <div className="text-xs text-gray-500">総セッション</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{avgScore}</div>
          <div className="text-xs text-gray-500">平均スコア</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-800">{records.reduce((s, r) => s + Number(r.rounds || 0), 0)}</div>
          <div className="text-xs text-gray-500">総使用弾数</div>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['すべて', ...discIds].map(f => (
          <button key={f} onClick={() => setFilterDisc(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterDisc === f ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'すべて' ? 'すべて' : (getDisc(f)?.label || f)}
          </button>
        ))}
      </div>

      {/* 記録リスト */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          まだ記録がありません。「記録追加」から追加してください。
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const disc = getDisc(r.discipline)
            const rangeName = r.rangeName || (ranges.find(rng => rng.id === r.rangeId)?.name) || r.location
            const firearmName = r.firearmName || (firearms.find(f => f.id === r.firearmId)?.name)
            const isTrapSkeet = disc?.type === 'trap' || disc?.type === 'skeet'
            const isExpanded = expandedId === r.id
            const hasDetail = !!r.scoreDetail

            return (
              <div key={r.id}
                className={`bg-white rounded-xl border shadow-sm transition-all ${isExpanded ? 'border-blue-200 shadow-md' : 'border-gray-100'}`}>
                {/* クリッカブルヘッダー */}
                <div
                  className={`p-4 cursor-pointer select-none ${hasDetail ? 'hover:bg-gray-50' : ''}`}
                  onClick={() => hasDetail && setExpandedId(isExpanded ? null : r.id)}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">{r.date}</span>
                          {rangeName && <span className="text-sm text-gray-600">{rangeName}</span>}
                          {disc && (
                            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                              {disc.label}
                            </span>
                          )}
                          {r.score != null && (
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              isTrapSkeet
                                ? r.score >= 23 ? 'bg-yellow-100 text-yellow-700' :
                                  r.score >= 20 ? 'bg-green-100 text-green-700'  : 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {r.score}{isTrapSkeet ? '/25' : '点'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasDetail && (
                            <span className="text-[10px] text-blue-400 mr-1 flex items-center gap-0.5">
                              {isExpanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                              {isExpanded ? '閉じる' : '詳細'}
                            </span>
                          )}
                          <button onClick={e => { e.stopPropagation(); setEditing(r) }}
                            className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50">
                            <Pencil size={15} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); remove(r.id) }}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 flex gap-3 text-xs text-gray-400 flex-wrap">
                        {firearmName && <span>銃: {firearmName}</span>}
                        {r.rounds && <span className="flex items-center gap-0.5"><Crosshair size={10} /> {r.rounds}発</span>}
                        {r.ammoName && <span>装弾: {r.ammoName}</span>}
                      </div>
                      {r.notes && (
                        <div className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">{r.notes}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 展開パネル */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <RecordDetailPanel scoreDetail={r.scoreDetail} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="射撃記録を追加" onClose={() => setShowAdd(false)}>
          <RecordForm {...sharedProps} onSave={handleSave} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="記録を編集" onClose={() => setEditing(null)}>
          <RecordForm initial={editing} {...sharedProps}
            onSave={d => handleUpdate(editing.id, d)}
            onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}
