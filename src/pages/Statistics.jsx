import { useEffect, useState, useMemo } from 'react'
import {
  BarChart2, Trophy, Crosshair, TreePine, Users, TrendingUp,
  TrendingDown, Minus, ChevronDown
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  ReferenceLine, ComposedChart
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ── 定数 ────────────────────────────────────────────────────
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16']
const USER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
const MEDAL = ['bg-yellow-400 text-white', 'bg-gray-300 text-gray-700', 'bg-amber-600 text-white']

// ── ユーティリティ ───────────────────────────────────────────
function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }
function stdDev(arr) {
  if (arr.length < 2) return null
  const m = avg(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length).toFixed(1)
}
function trendDir(scores) {
  if (scores.length < 4) return 'stable'
  const half = Math.floor(scores.length / 2)
  const a = avg(scores.slice(0, half))
  const b = avg(scores.slice(half))
  if (b > a + 2) return 'up'
  if (b < a - 2) return 'down'
  return 'stable'
}

/** 期間でフィルタリング */
function filterByPeriod(records, period) {
  if (!period || period === 'all') return records
  if (period.startsWith('year-')) {
    const y = period.replace('year-', '')
    return records.filter(r => r.date?.startsWith(y))
  }
  if (period.startsWith('season-')) {
    // 猟期: その年の11月〜翌年3月
    const y = Number(period.replace('season-', ''))
    return records.filter(r => {
      if (!r.date) return false
      const [ry, rm] = r.date.split('-').map(Number)
      return (ry === y && rm >= 11) || (ry === y + 1 && rm <= 3)
    })
  }
  return records
}

/** データから利用可能な年・猟期を生成 */
function buildPeriods(shooting, hunting) {
  const years = new Set()
  ;[...shooting, ...hunting].forEach(r => { if (r.date) years.add(r.date.slice(0, 4)) })
  const sortedYears = Array.from(years).sort().reverse()

  const options = [{ value: 'all', label: '全期' }]
  sortedYears.forEach(y => options.push({ value: `year-${y}`, label: `${y}年` }))

  // 猟期（11月〜3月）— ある程度のデータがある年のみ
  const seasonYears = sortedYears.filter(y => {
    const n = parseInt(y)
    return [...shooting, ...hunting].some(r => {
      if (!r.date) return false
      const [ry, rm] = r.date.split('-').map(Number)
      return (ry === n && rm >= 11) || (ry === n + 1 && rm <= 3)
    })
  })
  seasonYears.forEach(y => options.push({ value: `season-${y}`, label: `${y}猟期（11〜3月）` }))

  return options
}

/** date列を "YYYY-MM" に丸めて月別集計 */
function groupByMonth(records, valueKey) {
  const map = {}
  records.forEach(r => {
    const m = r.date?.slice(0, 7)
    if (!m) return
    if (!map[m]) map[m] = []
    if (r[valueKey] != null) map[m].push(Number(r[valueKey]))
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({ month, value: Math.round(avg(vals) * 10) / 10, count: vals.length }))
}

// ── 共通コンポーネント ────────────────────────────────────────
function StatBox({ label, value, sub, color = 'text-gray-800', icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
      {icon && <div className="flex justify-center mb-1">{icon}</div>}
      <div className={`text-2xl font-bold ${color}`}>{value ?? '-'}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function ChartCard({ title, children, empty, emptyMsg = 'データがありません' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {title && <h3 className="text-sm font-semibold text-gray-600 mb-4">{title}</h3>}
      {empty ? <p className="text-sm text-gray-400 text-center py-8">{emptyMsg}</p> : children}
    </div>
  )
}

function TrendIcon({ dir }) {
  if (dir === 'up') return <TrendingUp size={14} className="text-green-500" />
  if (dir === 'down') return <TrendingDown size={14} className="text-red-400" />
  return <Minus size={14} className="text-gray-400" />
}

function MedalBadge({ rank }) {
  const cls = rank < 3 ? MEDAL[rank] : 'bg-gray-100 text-gray-500'
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${cls}`}>
      {rank + 1}
    </div>
  )
}

// ── 種目ラベル変換 ────────────────────────────────────────────
const DISC_LABELS = {
  jp_trap: '和式トラップ', intl_trap: '国際トラップ',
  jp_skeet: '和式スキート', intl_skeet: '国際スキート',
  rifle_50m: 'ライフル50m', rifle_100m: 'ライフル100m',
}

// ── 射撃成績タブ ─────────────────────────────────────────────
function ShootingTab({ records, selectedName }) {
  const [discFilter, setDiscFilter] = useState('all')

  // 種目一覧を抽出
  const disciplines = useMemo(() => {
    const set = new Set()
    records.forEach(r => { if (r.discipline) set.add(r.discipline) })
    return Array.from(set).sort()
  }, [records])

  // フィルタ適用
  const filtered = discFilter === 'all' ? records : records.filter(r => r.discipline === discFilter)

  const scored = filtered.filter(r => r.score != null).map(r => ({ ...r, score: Number(r.score) }))
  const scores = scored.map(r => r.score)
  const avgScore   = scores.length ? avg(scores).toFixed(1) : null
  const bestScore  = scores.length ? Math.max(...scores) : null
  const sd         = stdDev(scores)
  const dir        = trendDir(scores)
  const totalRounds = filtered.reduce((s, r) => s + Number(r.rounds || 0), 0)

  // 直近5回 vs 全体平均
  const recentScores = scores.slice(-5)
  const recentAvg  = recentScores.length >= 2 ? avg(recentScores).toFixed(1) : null
  const recentDiff = (recentAvg && avgScore) ? (Number(recentAvg) - Number(avgScore)).toFixed(1) : null
  const recentDir  = recentDiff == null ? 'stable' : Number(recentDiff) > 1 ? 'up' : Number(recentDiff) < -1 ? 'down' : 'stable'

  // 1矢率（score_detailから）
  let firstHits = 0, totalHits = 0
  filtered.forEach(r => {
    const sd = r.score_detail
    if (!sd) return
    if (sd.type === 'trap' && sd.shots) {
      sd.shots.forEach(s => { if (s.hit) { totalHits++; if (s.shotNum === 1) firstHits++ } })
    } else if (sd.type === 'skeet' && sd.stations) {
      sd.stations.forEach(st => {
        if (st.h === true) { totalHits++; if (st.h_shotNum === 1) firstHits++ }
        if (st.l === true) { totalHits++; if (st.l_shotNum === 1) firstHits++ }
      })
    }
  })
  const firstShotRate = totalHits > 0 ? ((firstHits / totalHits) * 100).toFixed(1) : null
  const secondShotRate = (firstShotRate && totalHits > 0) ? (100 - Number(firstShotRate)).toFixed(1) : null

  // 種目別平均スコア
  const discMap = {}
  scored.forEach(r => {
    const d = r.discipline || 'その他'
    if (!discMap[d]) discMap[d] = []
    discMap[d].push(r.score)
  })
  const discData = Object.entries(discMap).map(([d, ss]) => ({
    name: DISC_LABELS[d] || d,
    avg: Number(avg(ss).toFixed(1)),
    best: Math.max(...ss),
    count: ss.length,
  })).sort((a, b) => b.count - a.count)

  const trendData   = scored.map(r => ({ date: r.date, score: r.score }))
  const monthlyData = groupByMonth(filtered.filter(r => r.score != null), 'score')

  const buckets = {}
  scored.forEach(r => {
    const b = Math.floor(r.score / 10) * 10
    buckets[b] = (buckets[b] || 0) + 1
  })
  const distData = Object.entries(buckets).sort(([a], [b]) => Number(a) - Number(b))
    .map(([range, count]) => ({ range: `${range}台`, count }))

  return (
    <div className="space-y-5">
      {/* 種目フィルター */}
      {disciplines.length > 1 && (
        <div>
          <span className="text-xs text-gray-500 font-medium mr-2">種目:</span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            <button onClick={() => setDiscFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                discFilter === 'all'
                  ? 'bg-blue-100 text-blue-700 border-transparent ring-2 ring-offset-1 ring-blue-400'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
              }`}>全種目</button>
            {disciplines.map(d => (
              <button key={d} onClick={() => setDiscFilter(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                  discFilter === d
                    ? 'bg-blue-100 text-blue-700 border-transparent ring-2 ring-offset-1 ring-blue-400'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                }`}>{DISC_LABELS[d] || d}</button>
            ))}
          </div>
        </div>
      )}

      {/* サマリー */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatBox label="セッション数" value={filtered.length} />
        <StatBox label="平均スコア" value={avgScore} color="text-blue-600" icon={<TrendIcon dir={dir} />} />
        <StatBox label="自己ベスト" value={bestScore} color="text-green-600" />
        <StatBox
          label="直近5回平均"
          value={recentAvg ?? '-'}
          color={recentDir === 'up' ? 'text-green-600' : recentDir === 'down' ? 'text-red-500' : 'text-gray-800'}
          sub={recentDiff != null ? `全体比 ${Number(recentDiff) >= 0 ? '+' : ''}${recentDiff}点` : '5回未満'}
          icon={<TrendIcon dir={recentDir} />}
        />
        <StatBox
          label="1矢率（クレー）"
          value={firstShotRate ? `${firstShotRate}%` : '-'}
          color={firstShotRate && Number(firstShotRate) >= 80 ? 'text-green-600' : firstShotRate ? 'text-blue-600' : 'text-gray-400'}
          sub={firstShotRate ? `2矢 ${secondShotRate}%` : 'スコア詳細なし'}
        />
        <StatBox label="標準偏差" value={sd} sub="小=安定" color={sd && Number(sd) <= 2 ? 'text-green-600' : 'text-gray-800'} />
      </div>

      {/* 上達ヒントカード */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
        <div className="font-semibold mb-1.5 flex items-center gap-1.5">💡 スコアアップのヒント</div>
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
          <div>• <strong>1矢率が高い</strong>ほど弾を節約でき、2矢での修正が減りスコアが安定します</div>
          <div>• <strong>標準偏差が小さい</strong>ほど安定した射撃ができています（目標：±2点以内）</div>
          <div>• <strong>苦手種目</strong>を集中練習すると総合力が上がります</div>
          <div>• <strong>練習頻度</strong>を上げると直近平均が全体平均を超えてきます</div>
        </div>
      </div>

      {/* スコア推移 */}
      <ChartCard title={`📈 スコア推移 — ${selectedName}`} empty={scored.length < 2} emptyMsg="記録が2件以上あるとグラフが表示されます">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => [`${v}点`, 'スコア']} />
            {avgScore && <ReferenceLine y={Number(avgScore)} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: `平均${avgScore}`, fill: '#94a3b8', fontSize: 10 }} />}
            <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="スコア" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 種目別 平均スコア（苦手種目の把握） */}
      {discData.length > 1 && (
        <ChartCard title="🎯 種目別 平均スコア（苦手種目を見つける）">
          <ResponsiveContainer width="100%" height={Math.max(140, discData.length * 52)}>
            <BarChart data={discData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v, n, p) => [`${v}点 (${p.payload.count}回)`, n]} />
              <Legend />
              <Bar dataKey="avg" name="平均スコア" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="best" name="自己ベスト" fill="#93c5fd" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* 1矢率（クレー射撃のみ）*/}
      {firstShotRate && (
        <ChartCard title="🔫 1矢・2矢 内訳（クレー射撃）">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3.5"
                  strokeDasharray={`${firstShotRate} ${100 - Number(firstShotRate)}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-green-600">{firstShotRate}%</div>
                <div className="text-xs text-gray-400">1矢率</div>
              </div>
            </div>
            <div className="flex-1 space-y-2 text-sm w-full">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                <span className="text-gray-600">1矢でヒット</span>
                <span className="ml-auto font-bold text-green-600">{firstHits}発 ({firstShotRate}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                <span className="text-gray-600">2矢でヒット</span>
                <span className="ml-auto font-bold text-amber-600">{totalHits - firstHits}発 ({secondShotRate}%)</span>
              </div>
              <div className="mt-3 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700">
                1矢率 80%超が上級者の目安。2矢が多い場合は<strong>スイングの早さ</strong>と<strong>クレーの読み</strong>に注目しましょう。
              </div>
            </div>
          </div>
        </ChartCard>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* 月別平均スコア */}
        <ChartCard title="📅 月別平均スコア（練習成果の推移）" empty={monthlyData.length === 0}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, _, p) => [`${v}点 (${p.payload.count}回)`, '平均スコア']} />
              <Bar dataKey="value" name="平均スコア" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* スコア分布 */}
        <ChartCard title="📊 スコア分布（実力レンジの把握）" empty={distData.length === 0}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v}回`, '回数']} />
              <Bar dataKey="count" name="回数" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

// ── 狩猟成果タブ ─────────────────────────────────────────────
function HuntingTab({ records, selectedName }) {
  const totalGame   = records.reduce((s, r) => s + Number(r.count || 0), 0)
  const totalRounds = records.reduce((s, r) => s + Number(r.rounds_fired || 0), 0)
  const rPerGame    = totalGame > 0 && totalRounds > 0 ? (totalRounds / totalGame).toFixed(1) : null

  // 猟果率・成功率
  const successOutings = records.filter(r => Number(r.count || 0) > 0).length
  const catchRate   = records.length > 0 ? (totalGame / records.length).toFixed(2) : null
  const successRate = records.length > 0 ? ((successOutings / records.length) * 100).toFixed(0) : null

  const gameCounts = {}
  records.forEach(r => { if (r.game) gameCounts[r.game] = (gameCounts[r.game] || 0) + Number(r.count || 0) })
  const pieData = Object.entries(gameCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  const topGame = pieData[0]?.name || '-'

  // 月別獲物数＋猟果率
  const monthlyMap = {}
  records.forEach(r => {
    const m = r.date?.slice(0, 7); if (!m) return
    if (!monthlyMap[m]) monthlyMap[m] = { month: m, count: 0, outings: 0 }
    monthlyMap[m].count   += Number(r.count || 0)
    monthlyMap[m].outings += 1
  })
  const monthlyData = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({ ...m, catchRate: m.outings > 0 ? Number((m.count / m.outings).toFixed(2)) : 0 }))

  // 猟場別効率（出猟あたり獲物数）
  const groundMap = {}
  records.forEach(r => {
    const key = r.ground_name || r.location || '不明'
    if (!groundMap[key]) groundMap[key] = { name: key, count: 0, rounds: 0, outings: 0 }
    groundMap[key].count   += Number(r.count || 0)
    groundMap[key].rounds  += Number(r.rounds_fired || 0)
    groundMap[key].outings += 1
  })
  const groundData = Object.values(groundMap)
    .map(g => ({ ...g, catchRate: g.outings > 0 ? Number((g.count / g.outings).toFixed(2)) : 0 }))
    .sort((a, b) => b.catchRate - a.catchRate).slice(0, 6)

  // 猟法別効率（重要: どの猟法が一番獲れるか）
  const methodMap = {}
  records.forEach(r => {
    const m = r.method || 'その他'
    if (!methodMap[m]) methodMap[m] = { name: m, outings: 0, game: 0, success: 0 }
    methodMap[m].outings++
    methodMap[m].game += Number(r.count || 0)
    if (Number(r.count || 0) > 0) methodMap[m].success++
  })
  const methodData = Object.values(methodMap).map(m => ({
    ...m,
    catchRate:   Number((m.outings > 0 ? m.game    / m.outings       : 0).toFixed(2)),
    successRate: Number((m.outings > 0 ? m.success / m.outings * 100 : 0).toFixed(0)),
  })).sort((a, b) => b.catchRate - a.catchRate)

  // 天候別成功率（どの天気で出れば獲れるか）
  const weatherMap = {}
  records.forEach(r => {
    const w = r.weather || '不明'
    if (!weatherMap[w]) weatherMap[w] = { name: w, outings: 0, game: 0, success: 0 }
    weatherMap[w].outings++
    weatherMap[w].game += Number(r.count || 0)
    if (Number(r.count || 0) > 0) weatherMap[w].success++
  })
  const weatherData = Object.values(weatherMap).map(w => ({
    ...w,
    catchRate:   Number((w.outings > 0 ? w.game    / w.outings       : 0).toFixed(2)),
    successRate: Number((w.outings > 0 ? w.success / w.outings * 100 : 0).toFixed(0)),
  })).sort((a, b) => b.catchRate - a.catchRate)

  // 出発時間帯別効率（早朝 vs 通常）
  function classifyTime(t) {
    if (!t) return null
    const h = parseInt(t.split(':')[0])
    if (h < 5)  return '深夜〜4時'
    if (h < 7)  return '早朝（5〜6時）'
    if (h < 9)  return '朝（7〜8時）'
    return '9時以降'
  }
  const timeMap = {}
  records.forEach(r => {
    const t = classifyTime(r.departure_time); if (!t) return
    if (!timeMap[t]) timeMap[t] = { name: t, outings: 0, game: 0, success: 0 }
    timeMap[t].outings++
    timeMap[t].game += Number(r.count || 0)
    if (Number(r.count || 0) > 0) timeMap[t].success++
  })
  const timeData = Object.values(timeMap).map(t => ({
    ...t,
    catchRate:   Number((t.outings > 0 ? t.game    / t.outings       : 0).toFixed(2)),
    successRate: Number((t.outings > 0 ? t.success / t.outings * 100 : 0).toFixed(0)),
  }))

  return (
    <div className="space-y-5">
      {/* サマリー（猟果率・成功率追加） */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatBox label="出猟回数" value={records.length} />
        <StatBox label="総獲物数" value={totalGame} color="text-green-600" />
        <StatBox
          label="猟果率"
          value={catchRate ? `${catchRate}頭` : '-'}
          sub="出猟1回あたり"
          color="text-green-700"
        />
        <StatBox
          label="成功率"
          value={successRate ? `${successRate}%` : '-'}
          sub={`${successOutings}/${records.length}回`}
          color={successRate && Number(successRate) >= 50 ? 'text-green-600' : 'text-amber-600'}
        />
        <StatBox label="最多獲物" value={topGame} color="text-green-700" />
        <StatBox label="発射数/頭" value={rPerGame} sub={rPerGame ? `計${totalRounds}発` : undefined} />
      </div>

      {/* 上達ヒントカード */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-800">
        <div className="font-semibold mb-1.5 flex items-center gap-1.5">💡 もっと獲れるようになるヒント</div>
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
          <div>• <strong>猟果率・成功率が高い猟法</strong>を選ぶと効率が上がります</div>
          <div>• <strong>早朝出発</strong>は動物の行動時間帯と重なり成功率が上がる傾向があります</div>
          <div>• <strong>天候別成功率</strong>から出猟判断の参考にしましょう</div>
          <div>• <strong>発射数/頭</strong>が少ないほど弾薬コストが抑えられます</div>
        </div>
      </div>

      {/* 月別 獲物数・出猟・猟果率（ComposedChart） */}
      <ChartCard title={`📅 月別 獲物数・出猟回数・猟果率 — ${selectedName}`} empty={monthlyData.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}頭`} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="count"   name="獲物数（頭）" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="outings" name="出猟回数"     fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="catchRate" name="猟果率（頭/回）"
              stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 猟法別 効率分析（重要） */}
      <ChartCard title="🏹 猟法別 効率分析（どの猟法が一番獲れるか）" empty={methodData.length === 0}>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* 棒グラフ: 猟果率 */}
          <div>
            <p className="text-xs text-gray-400 mb-2 text-center">猟果率（出猟あたり獲物数）</p>
            <ResponsiveContainer width="100%" height={Math.max(120, methodData.length * 48)}>
              <BarChart data={methodData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}頭`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={v => [`${v}頭/回`, '猟果率']} />
                <Bar dataKey="catchRate" name="猟果率" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* 棒グラフ: 成功率 */}
          <div>
            <p className="text-xs text-gray-400 mb-2 text-center">成功率（獲物あり出猟の割合）</p>
            <ResponsiveContainer width="100%" height={Math.max(120, methodData.length * 48)}>
              <BarChart data={methodData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={v => [`${v}%`, '成功率']} />
                <Bar dataKey="successRate" name="成功率" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* 詳細テーブル */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-1.5 text-left font-medium">猟法</th>
                <th className="py-1.5 text-right font-medium">出猟</th>
                <th className="py-1.5 text-right font-medium">獲物計</th>
                <th className="py-1.5 text-right font-medium">猟果率</th>
                <th className="py-1.5 text-right font-medium">成功率</th>
              </tr>
            </thead>
            <tbody>
              {methodData.map((m, i) => (
                <tr key={m.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-1.5 font-medium text-gray-700">{m.name}</td>
                  <td className="py-1.5 text-right text-gray-500">{m.outings}回</td>
                  <td className="py-1.5 text-right text-green-600 font-bold">{m.game}頭</td>
                  <td className="py-1.5 text-right text-amber-600 font-bold">{m.catchRate}頭/回</td>
                  <td className="py-1.5 text-right text-indigo-600 font-bold">{m.successRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-5">
        {/* 天候別 猟果分析 */}
        <ChartCard title="🌤 天候別 猟果分析（どの天気で出るか）" empty={weatherData.length === 0}>
          <div className="space-y-2.5">
            {weatherData.map(w => (
              <div key={w.name} className="flex items-center gap-3 text-sm">
                <span className="w-14 text-xs text-gray-500 shrink-0 text-right">{w.name}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-green-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, w.successRate)}%` }} />
                </div>
                <div className="shrink-0 text-right w-28 text-xs">
                  <span className="text-green-700 font-bold">{w.successRate}%</span>
                  <span className="text-gray-400 ml-1">({w.outings}回/{w.game}頭)</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3">バーが長いほど出猟成功率が高い天候</p>
        </ChartCard>

        {/* 出発時間帯別 */}
        {timeData.length > 0 ? (
          <ChartCard title="⏰ 出発時間帯別 猟果分析（いつ出るか）">
            <div className="space-y-2.5">
              {['深夜〜4時','早朝（5〜6時）','朝（7〜8時）','9時以降']
                .map(label => timeData.find(t => t.name === label)).filter(Boolean)
                .map(t => (
                  <div key={t.name} className="flex items-center gap-3 text-sm">
                    <span className="w-20 text-xs text-gray-500 shrink-0 text-right leading-tight">{t.name}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 bg-amber-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, t.successRate)}%` }} />
                    </div>
                    <div className="shrink-0 text-right w-28 text-xs">
                      <span className="text-amber-700 font-bold">{t.successRate}%</span>
                      <span className="text-gray-400 ml-1">({t.outings}回/{t.game}頭)</span>
                    </div>
                  </div>
                ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3">バーが長いほど出猟成功率が高い時間帯</p>
          </ChartCard>
        ) : (
          <ChartCard title="⏰ 出発時間帯別 猟果分析" empty emptyMsg="出発時刻を記録すると表示されます" />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* 獲物種類 */}
        <ChartCard title="🦌 獲物種類の内訳" empty={pieData.length === 0}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, value, percent }) => `${name} ${value}頭 (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => [`${v}頭`, '獲物数']} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 猟場別 猟果率 */}
        <ChartCard title="📍 猟場別 猟果率（どこで獲れるか）" empty={groundData.length === 0}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={groundData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}頭`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v, n, p) => n === 'catchRate'
                ? [`${v}頭/回 (計${p.payload.count}頭, ${p.payload.outings}回)`, '猟果率']
                : [`${v}頭`, n]} />
              <Bar dataKey="catchRate" name="猟果率（頭/回）" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

// ── メンバー比較タブ ─────────────────────────────────────────
function CompareTab({ allShooting, allHunting, profiles, period, currentUserId }) {
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.display_name || '不明']))

  const fShooting = filterByPeriod(allShooting, period)
  const fHunting = filterByPeriod(allHunting, period)

  // 射撃ランキング
  const shootingStats = {}
  fShooting.forEach(r => {
    if (!r.user_id) return
    if (!shootingStats[r.user_id]) shootingStats[r.user_id] = { scores: [], rounds: 0 }
    if (r.score != null) shootingStats[r.user_id].scores.push(Number(r.score))
    shootingStats[r.user_id].rounds += Number(r.rounds || 0)
  })
  const shootingRanking = Object.entries(shootingStats)
    .map(([uid, { scores, rounds }]) => ({
      uid, name: profileMap[uid] || '不明',
      avg: scores.length ? (avg(scores)).toFixed(1) : null,
      best: scores.length ? Math.max(...scores) : null,
      sessions: scores.length,
      rounds,
      isMe: uid === currentUserId,
    }))
    .filter(r => r.avg != null)
    .sort((a, b) => Number(b.avg) - Number(a.avg))

  // 狩猟ランキング
  const huntingStats = {}
  fHunting.forEach(r => {
    if (!r.user_id) return
    if (!huntingStats[r.user_id]) huntingStats[r.user_id] = { game: 0, outings: 0, rounds: 0 }
    huntingStats[r.user_id].game += Number(r.count || 0)
    huntingStats[r.user_id].outings += 1
    huntingStats[r.user_id].rounds += Number(r.rounds_fired || 0)
  })
  const huntingRanking = Object.entries(huntingStats)
    .map(([uid, { game, outings, rounds }]) => ({
      uid, name: profileMap[uid] || '不明',
      game, outings,
      rPerGame: game > 0 && rounds > 0 ? (rounds / game).toFixed(1) : '-',
      isMe: uid === currentUserId,
    }))
    .sort((a, b) => b.game - a.game)

  // 全ユーザーのスコア推移（月別平均）を一本にまとめ
  const userMonths = {}
  fShooting.filter(r => r.score != null).forEach(r => {
    const m = r.date?.slice(0, 7); if (!m || !r.user_id) return
    if (!userMonths[r.user_id]) userMonths[r.user_id] = {}
    if (!userMonths[r.user_id][m]) userMonths[r.user_id][m] = []
    userMonths[r.user_id][m].push(Number(r.score))
  })
  const allMonths = [...new Set(fShooting.map(r => r.date?.slice(0, 7)).filter(Boolean))].sort()
  const multiLineData = allMonths.map(m => {
    const entry = { month: m }
    Object.entries(userMonths).forEach(([uid, months]) => {
      const vals = months[m]
      if (vals?.length) entry[uid] = Math.round(avg(vals) * 10) / 10
    })
    return entry
  })
  const usersWithScores = Object.keys(userMonths)

  // 弾薬消費ランキング（射撃）
  const ammoRanking = Object.entries(shootingStats)
    .map(([uid, { rounds }]) => ({ name: profileMap[uid] || '不明', rounds, isMe: uid === currentUserId }))
    .sort((a, b) => b.rounds - a.rounds)

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        {/* 射撃スコアランキング */}
        <ChartCard title="🏆 射撃スコア ランキング" empty={shootingRanking.length === 0}>
          <div className="space-y-2">
            {shootingRanking.map((r, i) => (
              <div key={r.uid} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${r.isMe ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                <MedalBadge rank={i} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {r.name}{r.isMe && <span className="text-xs text-blue-500 ml-1">（自分）</span>}
                  </div>
                  <div className="text-xs text-gray-400">{r.sessions}回 / {r.rounds}発</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-blue-600">{r.avg}<span className="text-xs text-gray-400 font-normal">点均</span></div>
                  <div className="text-xs text-gray-400">ベスト {r.best}点</div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* 狩猟成果ランキング */}
        <ChartCard title="🦌 狩猟成果 ランキング" empty={huntingRanking.length === 0}>
          <div className="space-y-2">
            {huntingRanking.map((r, i) => (
              <div key={r.uid} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${r.isMe ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <MedalBadge rank={i} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {r.name}{r.isMe && <span className="text-xs text-green-600 ml-1">（自分）</span>}
                  </div>
                  <div className="text-xs text-gray-400">{r.outings}回出猟 / {r.rPerGame}発/頭</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-green-600">{r.game}<span className="text-xs text-gray-400 font-normal">頭</span></div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* スコア比較折れ線 */}
      <ChartCard title="📈 メンバー別スコア推移（月別平均）" empty={multiLineData.length < 2 || usersWithScores.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={multiLineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, k) => [`${v}点`, profileMap[k] || k]} />
            <Legend formatter={k => profileMap[k] || k} />
            {usersWithScores.map((uid, i) => (
              <Line key={uid} type="monotone" dataKey={uid}
                stroke={USER_COLORS[i % USER_COLORS.length]} strokeWidth={uid === currentUserId ? 3 : 1.5}
                dot={{ r: 3 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* スコア比較バー */}
      {shootingRanking.length > 0 && (
        <ChartCard title="📊 平均スコア比較">
          <ResponsiveContainer width="100%" height={Math.max(160, shootingRanking.length * 44)}>
            <BarChart data={shootingRanking.map(r => ({ name: r.name, avg: Number(r.avg), best: r.best, isMe: r.isMe }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={v => [`${v}点`, '']} />
              <Legend />
              <Bar dataKey="avg" name="平均スコア" radius={[0, 4, 4, 0]}
                fill="#3b82f6" />
              <Bar dataKey="best" name="自己ベスト" radius={[0, 4, 4, 0]}
                fill="#93c5fd" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* 弾薬消費ランキング */}
      {ammoRanking.length > 0 && (
        <ChartCard title="💥 弾薬消費ランキング（射撃記録より）">
          <ResponsiveContainer width="100%" height={Math.max(120, ammoRanking.length * 44)}>
            <BarChart data={ammoRanking} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={v => [`${v}発`, '消費弾数']} />
              <Bar dataKey="rounds" name="消費弾数（発）" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}

// ── メインコンポーネント ─────────────────────────────────────
const TABS = [
  { id: 'shooting', label: '射撃成績', icon: Crosshair },
  { id: 'hunting', label: '狩猟成果', icon: TreePine },
  { id: 'compare', label: 'メンバー比較', icon: Users },
]

export default function Statistics() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [allShooting, setAllShooting] = useState([])
  const [allHunting, setAllHunting] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('shooting')
  const [period, setPeriod] = useState('all')
  const [selectedUserId, setSelectedUserId] = useState(user.id)

  useEffect(() => {
    async function fetchAll() {
      const [pRes, sRes, hRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name'),
        supabase.from('shooting_records')
          .select('user_id, date, score, rounds, firearm, caliber, ammo_name, discipline, location, score_detail')
          .order('date'),
        supabase.from('hunting_records')
          .select('user_id, date, game, count, method, rounds_fired, ground_id, location, weather, departure_time, hunting_grounds(name)')
          .order('date'),
      ])
      setProfiles(pRes.data || [])
      setAllShooting(sRes.data || [])
      setAllHunting((hRes.data || []).map(r => ({ ...r, ground_name: r.hunting_grounds?.name || null })))
      setLoading(false)
    }
    fetchAll()
  }, [])

  const periodOptions = useMemo(() => buildPeriods(allShooting, allHunting), [allShooting, allHunting])
  const profileMap = useMemo(() => Object.fromEntries(profiles.map(p => [p.id, p.display_name || '不明'])), [profiles])
  const selectedName = profileMap[selectedUserId] || '不明'

  // 選択ユーザー × 期間でフィルタ
  const filteredShooting = useMemo(() =>
    filterByPeriod(allShooting.filter(r => r.user_id === selectedUserId), period),
    [allShooting, selectedUserId, period])

  const filteredHunting = useMemo(() =>
    filterByPeriod(allHunting.filter(r => r.user_id === selectedUserId), period),
    [allHunting, selectedUserId, period])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">読み込み中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2">
        <BarChart2 className="text-indigo-500" size={24} /> 統計・分析
      </h1>

      {/* フィルターバー */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-5 flex flex-wrap gap-3 items-center">
        {/* 期間選択 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium shrink-0">期間:</span>
          <div className="relative">
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none bg-white">
              {periodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* アカウント選択（射撃・狩猟タブのみ有効） */}
        {activeTab !== 'compare' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium shrink-0">アカウント:</span>
            <div className="relative">
              <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
                className="border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none bg-white">
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.display_name || '不明'}{p.id === user.id ? '（自分）' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* 期間バッジ */}
        <div className="ml-auto flex gap-2">
          {periodOptions.slice(0, 5).map(o => (
            <button key={o.value} onClick={() => setPeriod(o.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${period === o.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={15} />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.slice(0, 3)}</span>
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'shooting' && (
        <ShootingTab records={filteredShooting} selectedName={selectedName} />
      )}
      {activeTab === 'hunting' && (
        <HuntingTab records={filteredHunting} selectedName={selectedName} />
      )}
      {activeTab === 'compare' && (
        <CompareTab
          allShooting={allShooting}
          allHunting={allHunting}
          profiles={profiles}
          period={period}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}
