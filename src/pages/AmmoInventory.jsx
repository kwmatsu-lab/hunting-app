import { useState, useMemo } from 'react'
import {
  Plus, Trash2, Pencil, Package, AlertTriangle,
  BookOpen, FileDown, X, ChevronDown, ChevronUp
} from 'lucide-react'
import {
  useAmmoInventory, useAmmoLedger,
  useShootingRecords, useHuntingRecords,
} from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

// ── 定数 ────────────────────────────────────────────────────
// 射撃練習・狩猟使用は自動派生のため、手動記帳には表示しない
const EVENT_TYPES_MANUAL = ['購入', '廃棄', '譲渡', '調整', 'その他']
const EVENT_STYLE = {
  '購入':    'bg-green-100 text-green-700',
  '射撃練習': 'bg-blue-100 text-blue-700',
  '狩猟使用': 'bg-orange-100 text-orange-700',
  '廃棄':    'bg-red-100 text-red-700',
  '譲渡':    'bg-purple-100 text-purple-700',
  '調整':    'bg-gray-100 text-gray-600',
  'その他':  'bg-gray-100 text-gray-600',
}
const EMPTY_ITEM = { name: '', caliber: '', type: '実包', quantity: '', minQuantity: '', brand: '', notes: '' }

// ── HTML エスケープ（XSS対策） ──────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ── PDF出力（ブラウザ印刷経由 → 文字化けなし） ──────────────
function exportLedgerPDF({ entries, ammoItems, profile, filterAmmoId }) {
  const ammoLabel = filterAmmoId
    ? (ammoItems.find(a => a.id === filterAmmoId)?.name || '')
    : '全種別'
  const owner   = profile?.display_name || ''
  const today   = new Date().toLocaleDateString('ja-JP')
  const totalRx = entries.reduce((s, e) => s + (e.received || 0), 0)
  const totalPd = entries.reduce((s, e) => s + (e.paidOut  || 0), 0)

  function badgeClass(t) {
    return { '購入': 'purchase', '射撃練習': 'shooting', '狩猟使用': 'hunting',
             '廃棄': 'dispose',  '譲渡': 'transfer' }[t] || ''
  }

  const rows = entries.map(e => `
    <tr>
      <td>${esc(e.date)}</td>
      <td>${esc(e.ammoName)}</td>
      <td><span class="badge ${esc(badgeClass(e.eventType))}">${esc(e.eventType)}</span></td>
      <td>${esc(e.description)}</td>
      <td class="num">${e.received > 0 ? `+${e.received}` : '—'}</td>
      <td class="num">${e.paidOut  > 0 ? `-${e.paidOut}`  : '—'}</td>
      <td class="num bal">${Number(e.balance)}</td>
      <td>${esc(e.notes)}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="ja"><head>
<meta charset="UTF-8">
<title>実包管理帳簿</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  body { font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Arial', sans-serif;
         font-size: 9pt; color: #1e293b; margin: 0; }
  h2   { text-align: center; font-size: 15pt; margin: 0 0 4px; }
  .sub { text-align: center; font-size: 9pt; color: #64748b; margin-bottom: 6px; }
  .meta { display: flex; justify-content: space-between; font-size: 8.5pt; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e293b; color: #fff; padding: 4px 6px; font-size: 8.5pt;
       text-align: center; white-space: nowrap; }
  td { padding: 3px 6px; border-bottom: 1px solid #e2e8f0; font-size: 8.5pt; }
  tr:nth-child(even) td { background: #f8fafc; }
  tfoot td { background: #fef3c7 !important; font-weight: bold;
             border-top: 2px solid #f59e0b; }
  .num { text-align: right; font-family: 'Courier New', monospace; }
  .bal { color: #b45309; font-weight: bold; }
  .badge { display: inline-block; padding: 1px 5px; border-radius: 3px;
           font-size: 7.5pt; font-weight: 600; }
  .purchase { background: #dcfce7; color: #15803d; }
  .shooting { background: #dbeafe; color: #1d4ed8; }
  .hunting  { background: #ffedd5; color: #c2410c; }
  .dispose  { background: #fee2e2; color: #b91c1c; }
  .transfer { background: #f3e8ff; color: #7c3aed; }
  .footer   { margin-top: 6px; font-size: 7.5pt; color: #94a3b8; }
</style>
</head><body>
<h2>実包管理帳簿</h2>
<div class="sub">品名: ${esc(ammoLabel)}</div>
<div class="meta"><span>所持者: ${esc(owner)}</span><span>出力日: ${esc(today)}</span></div>
<table>
  <thead>
    <tr>
      <th>年月日</th><th>品名</th><th>事由</th><th>内容</th>
      <th>受取数</th><th>払出数</th><th>残数</th><th>備考</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td colspan="4">合計</td>
      <td class="num">${totalRx}</td>
      <td class="num">${totalPd}</td>
      <td></td><td></td>
    </tr>
  </tfoot>
</table>
<div class="footer">
  本帳簿は猟銃用火薬類等譲受許可証に基づき作成しました。内容に誤りがある場合は訂正してください。
</div>
</body></html>`

  const win = window.open('', '_blank', 'width=1050,height=750')
  if (!win) {
    alert('ポップアップがブロックされています。ブラウザの設定を確認してください。')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 400)
}

// ── 実包アイテム登録フォーム ──────────────────────────────
function ItemForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_ITEM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block col-span-2">
          <span className="text-xs text-gray-500 font-medium">品名 *</span>
          <input type="text" required placeholder="例: 12番スラッグ弾" value={form.name}
            onChange={e => set('name', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">口径・規格</span>
          <input type="text" placeholder="12番 / .30-06" value={form.caliber}
            onChange={e => set('caliber', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">種別</span>
          <input type="text" placeholder="実包 / 散弾" value={form.type}
            onChange={e => set('type', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">現在庫数（発）</span>
          <input type="number" min="0" placeholder="0" value={form.quantity}
            onChange={e => set('quantity', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">最低在庫警告（発）</span>
          <input type="number" min="0" placeholder="10" value={form.minQuantity}
            onChange={e => set('minQuantity', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block col-span-2">
          <span className="text-xs text-gray-500 font-medium">ブランド・メーカー</span>
          <input type="text" placeholder="住友 / フェデラル" value={form.brand}
            onChange={e => set('brand', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">メモ</span>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit"
          className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600">保存</button>
      </div>
    </form>
  )
}

// ── 手動記帳フォーム（購入・廃棄・譲渡等） ──────────────────
function LedgerEntryForm({ ammoItems, combinedEntries, onSave, onCancel }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    ammoInventoryId: ammoItems[0]?.id || '',
    date: today, eventType: '購入', description: '', received: '', paidOut: '', notes: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // 選択中の実包の現在残数（帳簿上の最終残数）
  const currentBalance = useMemo(() => {
    const relevant = combinedEntries.filter(e => e.ammoInventoryId === form.ammoInventoryId)
    return relevant.length > 0 ? relevant[relevant.length - 1].balance : 0
  }, [combinedEntries, form.ammoInventoryId])

  const recv = Number(form.received) || 0
  const paid = Number(form.paidOut)  || 0
  const newBal = currentBalance + recv - paid

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, balance: newBal }) }} className="space-y-3">
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">実包 *</span>
        <select required value={form.ammoInventoryId} onChange={e => set('ammoInventoryId', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
          {ammoItems.map(a => (
            <option key={a.id} value={a.id}>{a.name}{a.caliber ? ` (${a.caliber})` : ''}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">日付 *</span>
          <input type="date" required value={form.date} onChange={e => set('date', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">事由 *</span>
          <select required value={form.eventType} onChange={e => set('eventType', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            {EVENT_TYPES_MANUAL.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block col-span-2">
          <span className="text-xs text-gray-500 font-medium">内容・説明</span>
          <input type="text" placeholder="例: 銃砲店で購入" value={form.description}
            onChange={e => set('description', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">受取数（発）</span>
          <input type="number" min="0" placeholder="0" value={form.received}
            onChange={e => set('received', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">払出数（発）</span>
          <input type="number" min="0" placeholder="0" value={form.paidOut}
            onChange={e => set('paidOut', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
      </div>
      {/* 残数プレビュー */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm">
        <span className="text-gray-500">現在残数: <strong>{currentBalance}発</strong></span>
        <span className="text-gray-300">→</span>
        <span className={`font-bold ${newBal < 0 ? 'text-red-500' : 'text-amber-700'}`}>{newBal}発</span>
        {newBal < 0 && (
          <span className="text-red-500 text-xs flex items-center gap-1">
            <AlertTriangle size={11} /> 残数がマイナスになります
          </span>
        )}
      </div>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">備考（許可証番号等）</span>
        <input type="text" placeholder="許可証番号・場所など" value={form.notes}
          onChange={e => set('notes', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit"
          className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600">記帳</button>
      </div>
    </form>
  )
}

// ── メインページ ─────────────────────────────────────────
export default function AmmoInventory() {
  const { profile } = useAuth()
  const { items, add, update, remove } = useAmmoInventory()
  const { entries, add: addEntry, remove: removeEntry } = useAmmoLedger()
  const { records: shootingRecords } = useShootingRecords()
  const { records: huntingRecords }  = useHuntingRecords()

  const [showAdd,      setShowAdd]      = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [filterAmmoId, setFilterAmmoId] = useState('')
  const [showLedger,   setShowLedger]   = useState(true)

  // ── 統合帳簿を構築（手動エントリ ＋ 射撃・狩猟記録から自動派生） ──
  const combinedEntries = useMemo(() => {
    const ammoIdSet = new Set(items.map(a => a.id))
    const all = []

    // 手動エントリ（購入・廃棄・譲渡等）
    entries.forEach(e => {
      if (!ammoIdSet.has(e.ammoInventoryId)) return
      all.push({
        ...e,
        source: 'manual',
        ammoName: items.find(a => a.id === e.ammoInventoryId)?.name || '',
      })
    })

    // 自動派生: 射撃記録
    shootingRecords
      .filter(r => r.ammoInventoryId && ammoIdSet.has(r.ammoInventoryId) && Number(r.rounds) > 0)
      .forEach(r => {
        all.push({
          id: `__sht__${r.id}`,
          source: 'shooting',
          ammoInventoryId: r.ammoInventoryId,
          ammoName: items.find(a => a.id === r.ammoInventoryId)?.name || r.ammoName || '',
          date: r.date,
          eventType: '射撃練習',
          description: [r.location, r.discipline].filter(Boolean).join(' '),
          received: 0,
          paidOut: Number(r.rounds),
          balance: 0,
          notes: r.notes || '',
        })
      })

    // 自動派生: 狩猟記録
    huntingRecords
      .filter(r => r.ammoInventoryId && ammoIdSet.has(r.ammoInventoryId) && Number(r.roundsFired) > 0)
      .forEach(r => {
        all.push({
          id: `__hnt__${r.id}`,
          source: 'hunting',
          ammoInventoryId: r.ammoInventoryId,
          ammoName: items.find(a => a.id === r.ammoInventoryId)?.name || r.ammoName || '',
          date: r.date,
          eventType: '狩猟使用',
          description: [r.location, r.game].filter(Boolean).join(' '),
          received: 0,
          paidOut: Number(r.roundsFired),
          balance: 0,
          notes: r.notes || '',
        })
      })

    // 日付順ソート（同日付は手動エントリを先頭）
    all.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      if (a.source === 'manual' && b.source !== 'manual') return -1
      if (a.source !== 'manual' && b.source === 'manual') return 1
      return 0
    })

    // 実包種別ごとに残数を計算
    const balMap = {}
    return all.map(e => {
      const bal = (balMap[e.ammoInventoryId] || 0) + e.received - e.paidOut
      balMap[e.ammoInventoryId] = bal
      return { ...e, balance: bal }
    })
  }, [entries, shootingRecords, huntingRecords, items])

  // フィルタ済みエントリ
  const filteredEntries = filterAmmoId
    ? combinedEntries.filter(e => e.ammoInventoryId === filterAmmoId)
    : combinedEntries

  // 実包別の最終残数（帳簿上）
  const finalBalByAmmo = useMemo(() => {
    const m = {}
    combinedEntries.forEach(e => { m[e.ammoInventoryId] = e.balance })
    return m
  }, [combinedEntries])

  const totalAmmo   = items.reduce((s, i) => s + Number(i.quantity || 0), 0)
  const lowItems    = items.filter(i => i.minQuantity && Number(i.quantity) <= Number(i.minQuantity))
  const totalRx     = filteredEntries.reduce((s, e) => s + (e.received || 0), 0)
  const totalPd     = filteredEntries.reduce((s, e) => s + (e.paidOut  || 0), 0)

  async function handleAddEntry(data) {
    await addEntry(data)
    setShowAddEntry(false)
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-amber-500" size={24} /> 実包管理
        </h1>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600">
          <Plus size={16} /> 実包を追加
        </button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{items.length}</div>
          <div className="text-xs text-gray-500">登録種類数</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">
            {totalAmmo}<span className="text-sm font-normal ml-1">発</span>
          </div>
          <div className="text-xs text-gray-500">総在庫数</div>
        </div>
        <div className={`rounded-xl border shadow-sm p-4 text-center
          ${lowItems.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
          <div className={`text-2xl font-bold ${lowItems.length > 0 ? 'text-orange-500' : 'text-gray-800'}`}>
            {lowItems.length}
          </div>
          <div className="text-xs text-gray-500">在庫少警告</div>
        </div>
      </div>

      {/* 法令注意事項 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-xs text-blue-800">
        <div className="font-semibold mb-1 flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-blue-600" /> 法令管理事項
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
          <li>猟銃用実包の購入には<strong>猟銃用火薬類等譲受許可証</strong>（火薬類取締法）が必要です</li>
          <li>所持できる実包の数量は許可証に記載された上限以内に限られます</li>
          <li>実包管理帳簿に受取・払出を記録し、残数を常に把握してください</li>
          <li>許可証の有効期間は原則1年です。期間内に購入・使用を完了してください</li>
        </ul>
      </div>

      {/* 実包一覧 */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm mb-6">
          実包が登録されていません。「実包を追加」から追加してください。
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {items.map(item => {
            const isLow     = item.minQuantity && Number(item.quantity) <= Number(item.minQuantity)
            const ledgerBal = finalBalByAmmo[item.id]
            const dispQty   = ledgerBal != null ? ledgerBal : Number(item.quantity ?? 0)
            const isFiltered = filterAmmoId === item.id
            return (
              <div key={item.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all
                  ${isLow ? 'border-orange-300' : isFiltered ? 'border-amber-300' : 'border-gray-100'}`}>
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* 在庫数（帳簿ベース） */}
                    <div className="text-center shrink-0 min-w-[64px]">
                      <div className={`text-3xl font-bold ${isLow ? 'text-orange-500' : 'text-amber-600'}`}>
                        {dispQty}
                      </div>
                      <div className="text-xs text-gray-400">発</div>
                      {isLow && (
                        <div className="flex items-center justify-center gap-0.5 text-[10px] text-orange-500 mt-0.5">
                          <AlertTriangle size={10} /> 在庫少
                        </div>
                      )}
                    </div>
                    {/* 情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {item.type    && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{item.type}</span>}
                        {item.caliber && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.caliber}</span>}
                        {item.brand   && <span className="text-xs text-gray-400">{item.brand}</span>}
                      </div>
                      {item.notes && <div className="text-xs text-gray-400 mt-1">{item.notes}</div>}
                    </div>
                    {/* アクション */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setFilterAmmoId(isFiltered ? '' : item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors font-medium
                          ${isFiltered
                            ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-amber-50 hover:text-amber-600'
                          }`}>
                        <BookOpen size={12} />
                        帳簿
                      </button>
                      <button onClick={() => setEditing(item)}
                        className="p-2 text-gray-400 hover:text-amber-500 rounded-lg hover:bg-amber-50">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 実包管理帳簿（アカウント統合・自動同期） ────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 帳簿ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-slate-50">
          <div className="flex items-center gap-2 flex-wrap">
            <BookOpen size={16} className="text-amber-600" />
            <span className="font-semibold text-gray-700 text-sm">実包管理帳簿</span>
            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
              {filteredEntries.length}件
            </span>
            <span className="text-xs text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              射撃・狩猟記録より自動反映
            </span>
          </div>
          <button onClick={() => setShowLedger(v => !v)} className="text-gray-400 hover:text-gray-600 shrink-0">
            {showLedger ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showLedger && (
          <div className="p-4">
            {/* 操作バー */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <select value={filterAmmoId} onChange={e => setFilterAmmoId(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                <option value="">全種別</option>
                {items.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <div className="flex-1" />
              <button
                onClick={() => exportLedgerPDF({ entries: filteredEntries, ammoItems: items, profile, filterAmmoId })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">
                <FileDown size={12} /> PDF出力 (A4横)
              </button>
              <button
                onClick={() => setShowAddEntry(true)}
                disabled={items.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40">
                <Plus size={12} /> 手動記帳（購入等）
              </button>
            </div>

            {/* サマリー */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                ['総受取数', totalRx,        'text-green-700',  'bg-green-50 border-green-200'],
                ['総払出数', totalPd,        'text-orange-700', 'bg-orange-50 border-orange-200'],
                ['現在残数', totalRx - totalPd, 'text-amber-700',  'bg-amber-50 border-amber-200'],
              ].map(([label, val, tc, bc]) => (
                <div key={label} className={`${bc} border rounded-lg px-3 py-2 text-center`}>
                  <div className={`text-lg font-bold ${tc}`}>
                    {val}<span className="text-xs ml-0.5">発</span>
                  </div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>

            {/* 帳簿テーブル */}
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                帳簿エントリがありません。<br />
                射撃・狩猟記録に実包を紐づけると自動で反映されます。
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-700 text-white">
                      {['年月日','品名','事由','内容','受取数','払出数','残数','備考',''].map(h => (
                        <th key={h} className="px-2.5 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((e, i) => (
                      <tr key={e.id}
                        className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-2.5 py-2 font-mono whitespace-nowrap">{e.date}</td>
                        <td className="px-2.5 py-2 text-gray-600 whitespace-nowrap">{e.ammoName}</td>
                        <td className="px-2.5 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold
                            ${EVENT_STYLE[e.eventType] || 'bg-gray-100 text-gray-600'}`}>
                            {e.eventType}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 text-gray-600 max-w-[160px] truncate">{e.description}</td>
                        <td className="px-2.5 py-2 text-right font-mono">
                          {e.received > 0
                            ? <span className="text-green-600 font-semibold">+{e.received}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-2.5 py-2 text-right font-mono">
                          {e.paidOut > 0
                            ? <span className="text-orange-600 font-semibold">-{e.paidOut}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-2.5 py-2 text-right font-mono font-bold text-amber-700">
                          {e.balance}
                        </td>
                        <td className="px-2.5 py-2 text-gray-400 max-w-[120px] truncate">{e.notes}</td>
                        <td className="px-2.5 py-2">
                          {e.source === 'manual' ? (
                            <button onClick={() => removeEntry(e.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors">
                              <X size={12} />
                            </button>
                          ) : (
                            <span className="text-[9px] text-blue-300 whitespace-nowrap">自動</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-50 border-t-2 border-amber-200 font-semibold text-xs">
                      <td colSpan={4} className="px-2.5 py-2 text-gray-600">合計</td>
                      <td className="px-2.5 py-2 text-right text-green-700 font-bold">{totalRx}</td>
                      <td className="px-2.5 py-2 text-right text-orange-700 font-bold">{totalPd}</td>
                      <td className="px-2.5 py-2 text-right text-amber-700 font-bold">{totalRx - totalPd}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* モーダル */}
      {showAdd && (
        <Modal title="実包を追加" onClose={() => setShowAdd(false)}>
          <ItemForm onSave={d => { add(d); setShowAdd(false) }} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="実包を編集" onClose={() => setEditing(null)}>
          <ItemForm initial={editing}
            onSave={d => { update(editing.id, d); setEditing(null) }}
            onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {showAddEntry && (
        <Modal title="手動記帳（購入・廃棄・譲渡等）" onClose={() => setShowAddEntry(false)}>
          <LedgerEntryForm
            ammoItems={items}
            combinedEntries={combinedEntries}
            onSave={handleAddEntry}
            onCancel={() => setShowAddEntry(false)}
          />
        </Modal>
      )}
    </div>
  )
}
