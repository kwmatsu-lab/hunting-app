import { useState, useEffect, useMemo } from 'react'
import { FileText, Download, ChevronDown, ChevronUp, Eye, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useFirearms, useHuntingRecords, useShootingRecords } from '../store/useStore'
import { generateUsageReport } from '../lib/pdfUsageReport'

// ── 使用実績報告書フォーム ─────────────────────────
function UsageReportForm({ firearms, huntingRecords, shootingRecords, profile }) {
  const [selectedFirearmId, setSelectedFirearmId] = useState('')
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [commission, setCommission] = useState('')
  const [purpose, setPurpose] = useState('狩猟、標的射撃')
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const selectedFirearm = firearms.find(f => f.id === selectedFirearmId)

  // 直前2年間のデータを抽出
  const twoYearsAgo = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 2)
    return d.toISOString().slice(0, 10)
  }, [])

  // 選択した銃器に関連する狩猟記録（直前2年間・新しい順）
  const filteredHunting = useMemo(() => {
    if (!selectedFirearmId) return []
    return huntingRecords
      .filter(r => r.firearmId === selectedFirearmId && r.date >= twoYearsAgo && !r.isPestControl)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(r => ({
        date: r.date,
        location: [r.prefecture, r.groundName || r.location].filter(Boolean).join(' '),
        companion: r.teamName || '',
        rounds: r.roundsFired || 0,
        notes: r.game ? `${r.game}${r.count ? ` ${r.count}頭` : ''}` : '',
      }))
  }, [selectedFirearmId, huntingRecords, twoYearsAgo])

  // 有害鳥獣駆除
  const filteredPest = useMemo(() => {
    if (!selectedFirearmId) return []
    return huntingRecords
      .filter(r => r.firearmId === selectedFirearmId && r.date >= twoYearsAgo && r.isPestControl)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(r => ({
        date: r.date,
        location: [r.prefecture, r.groundName || r.location].filter(Boolean).join(' '),
        companion: r.teamName || '',
        rounds: r.roundsFired || 0,
        notes: r.game ? `${r.game}${r.count ? ` ${r.count}頭` : ''}` : '',
      }))
  }, [selectedFirearmId, huntingRecords, twoYearsAgo])

  // 標的射撃
  const filteredShooting = useMemo(() => {
    if (!selectedFirearmId) return []
    return shootingRecords
      .filter(r => r.firearmId === selectedFirearmId && r.date >= twoYearsAgo)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(r => ({
        date: r.date,
        location: r.rangeName || r.location || '',
        companion: '',
        rounds: r.rounds || 0,
        notes: r.discipline ? `${r.discipline}${r.score ? ` ${r.score}点` : ''}` : '',
      }))
  }, [selectedFirearmId, shootingRecords, twoYearsAgo])

  // プレビューURL のクリーンアップ
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const handleGenerate = async (download = false) => {
    if (!selectedFirearm) return
    setGenerating(true)
    try {
      const pdfBytes = await generateUsageReport({
        reportDate,
        commission,
        reporterName: profile?.display_name || '',
        permitNumber: selectedFirearm.permitNumber || '',
        gunType: `${selectedFirearm.name || ''}（${selectedFirearm.type || ''}・${selectedFirearm.caliber || ''}）`,
        permitDate: selectedFirearm.permitDate || selectedFirearm.originalPermitDate || '',
        purpose,
        huntingRecords: filteredHunting,
        pestRecords: filteredPest,
        shootingRecords: filteredShooting,
      })

      const blob = new Blob([pdfBytes], { type: 'application/pdf' })

      if (download) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `使用実績報告書_${selectedFirearm.name || '銃器'}_${reportDate}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setShowPreview(true)
      }
    } catch (err) {
      console.error('PDF生成エラー:', err)
      alert('PDF生成に失敗しました: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* 銃器選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">対象銃器 *</label>
        <select value={selectedFirearmId} onChange={e => setSelectedFirearmId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <option value="">銃器を選択してください</option>
          {firearms.map(f => (
            <option key={f.id} value={f.id}>
              {f.name}（{f.type}・{f.caliber}）{f.permitNumber ? ` [許可No.${f.permitNumber}]` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedFirearm && (
        <>
          {/* 許可情報プレビュー */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <div className="text-xs font-semibold text-gray-500 mb-2">許可情報（自動入力）</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div><span className="text-gray-400">銃種等:</span> {selectedFirearm.name}（{selectedFirearm.type}）</div>
              <div><span className="text-gray-400">口径:</span> {selectedFirearm.caliber || '未設定'}</div>
              <div><span className="text-gray-400">許可番号:</span> {selectedFirearm.permitNumber || '未設定'}</div>
              <div><span className="text-gray-400">許可年月日:</span> {selectedFirearm.permitDate || selectedFirearm.originalPermitDate || '未設定'}</div>
            </div>
          </div>

          {/* 報告情報 */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">報告日</span>
              <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">公安委員会</span>
              <input type="text" placeholder="東京都" value={commission} onChange={e => setCommission(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">許可に係る用途</span>
            <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </label>

          {/* データプレビュー */}
          <div className="space-y-3">
            <DataPreviewSection title="狩猟実績" records={filteredHunting} color="green" />
            <DataPreviewSection title="有害鳥獣駆除実績" records={filteredPest} color="red" />
            <DataPreviewSection title="標的射撃実績" records={filteredShooting} color="blue" />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => handleGenerate(false)} disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
              プレビュー
            </button>
            <button type="button" onClick={() => handleGenerate(true)} disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              PDFダウンロード
            </button>
          </div>

          {/* PDFプレビュー */}
          {showPreview && previewUrl && (
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b">
                <span className="text-xs font-medium text-gray-600">PDF プレビュー</span>
                <button onClick={() => setShowPreview(false)} className="text-xs text-gray-400 hover:text-gray-600">閉じる</button>
              </div>
              <iframe src={previewUrl} className="w-full" style={{ height: '600px' }} title="PDF Preview" />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── データプレビュー ──────────────────────────────
function DataPreviewSection({ title, records, color }) {
  const [open, setOpen] = useState(false)
  const colorMap = {
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`${c.bg} ${c.border} border rounded-lg`}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium">
        <span className={c.text}>{title}</span>
        <span className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>
            {records.length}件
          </span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3">
          {records.length === 0 ? (
            <p className="text-xs text-gray-400">該当する記録がありません</p>
          ) : (
            <div className="space-y-1">
              {records.slice(0, 10).map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-xs bg-white/70 rounded px-2 py-1.5">
                  <span className="font-mono text-gray-500 w-20 shrink-0">{r.date}</span>
                  <span className="flex-1 truncate">{r.location}</span>
                  <span className="text-gray-400 w-12 text-right">{r.rounds}発</span>
                  {r.notes && <span className="text-gray-400 truncate max-w-[100px]">{r.notes}</span>}
                </div>
              ))}
              {records.length > 10 && (
                <p className="text-[10px] text-gray-400 text-center">他 {records.length - 10}件（PDF には最新6件を記載）</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── メインページ ──────────────────────────────────
export default function FormGenerator() {
  const { profile } = useAuth()
  const { records: firearms } = useFirearms()
  const { records: huntingRecords } = useHuntingRecords()
  const { records: shootingRecords } = useShootingRecords()

  const forms = [
    {
      id: 'usage-report',
      title: '使用実績報告書',
      description: '第74号様式（第94条関係）— 銃砲の使用実績を公安委員会に報告する書類',
      available: true,
    },
    {
      id: 'permit-renewal',
      title: '所持許可更新申請書',
      description: '許可の更新時に必要な申請書（今後対応予定）',
      available: false,
    },
    {
      id: 'lecture-application',
      title: '猟銃等講習会申込書',
      description: '猟銃等講習会への参加申込書（今後対応予定）',
      available: false,
    },
  ]

  const [selectedForm, setSelectedForm] = useState(null)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={22} className="text-emerald-600" />
            申請様式作成
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            狩猟・射撃記録から警察署提出用の申請書類を自動作成します
          </p>
        </div>
      </div>

      {/* 様式一覧 */}
      <div className="grid gap-3">
        {forms.map(f => (
          <button
            key={f.id}
            onClick={() => f.available && setSelectedForm(selectedForm === f.id ? null : f.id)}
            disabled={!f.available}
            className={`text-left border rounded-xl p-4 transition-all ${
              selectedForm === f.id
                ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                : f.available
                  ? 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                  : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                  <FileText size={15} className={f.available ? 'text-emerald-600' : 'text-gray-400'} />
                  {f.title}
                  {!f.available && (
                    <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">準備中</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{f.description}</p>
              </div>
              {f.available && (
                selectedForm === f.id ? <ChevronUp size={16} className="text-emerald-500" /> : <ChevronDown size={16} className="text-gray-400" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* 選択されたフォーム */}
      {selectedForm === 'usage-report' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-emerald-600" />
            使用実績報告書の作成
          </h2>
          <UsageReportForm
            firearms={firearms}
            huntingRecords={huntingRecords}
            shootingRecords={shootingRecords}
            profile={profile}
          />
        </div>
      )}
    </div>
  )
}
