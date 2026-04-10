import { useState } from 'react'
import {
  Plus, Trash2, Pencil, FileCheck, AlertTriangle, CheckCircle2,
  Shield, Crosshair, BookOpen, Calendar, Hash, Building2, MapPin,
  Lock, StickyNote, Camera, Loader2, BookLock, GraduationCap, ClipboardList
} from 'lucide-react'
import { useLicenses, useFirearms, useHuntingRegistrations, usePermitBooks } from '../store/useStore'
import { analyzeGunPermit, fileToBase64 } from '../lib/ocr'
import Modal from '../components/Modal'

// ── ユーティリティ ─────────────────────────────────────────
function daysBetween(date1, date2) {
  return Math.ceil((new Date(date1) - new Date(date2)) / (1000 * 60 * 60 * 24))
}

function getStatus(expiryDate) {
  const today = new Date().toISOString().split('T')[0]
  const days = daysBetween(expiryDate, today)
  if (days <= 0)  return { label: '期限切れ', color: 'red',   days }
  if (days <= 30) return { label: `残り${days}日`, color: 'red',   days }
  if (days <= 90) return { label: `残り${days}日`, color: 'amber', days }
  return           { label: '有効',          color: 'green', days }
}

function StatusBar({ color }) {
  const map = { red: 'bg-red-500', amber: 'bg-amber-400', green: 'bg-emerald-500' }
  return <div className={`h-1 w-full rounded-t-xl ${map[color] || 'bg-gray-300'}`} />
}

function StatusBadge({ status }) {
  if (!status) return null
  const map = {
    red:   'bg-red-100 text-red-700 border border-red-200',
    amber: 'bg-amber-100 text-amber-700 border border-amber-200',
    green: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status.color]}`}>
      {status.days <= 0 ? '期限切れ' : status.label}
    </span>
  )
}

function InfoRow({ icon: Icon, label, value, color = 'text-gray-500' }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-1.5">
      <Icon size={12} className={`mt-0.5 shrink-0 ${color}`} />
      <div>
        <span className="text-gray-400 text-xs">{label}: </span>
        <span className="text-gray-700 text-xs font-medium">{value}</span>
      </div>
    </div>
  )
}

// ── タブ1: 狩猟免許 ───────────────────────────────────────
const LICENSE_TYPES = ['第一種銃猟免許', '第二種銃猟免許', 'わな猟免許', 'その他']
const LECTURE_TYPES = ['猟銃等講習会修了証', '技能講習修了証']
const EMPTY_LICENSE = { name: '', licenseNumber: '', issuedDate: '', expiryDate: '', issuer: '', notes: '' }

function LicenseForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_LICENSE)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">免許種別 *</span>
        <select required value={form.name} onChange={e => set('name', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <option value="">選択してください</option>
          {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">免許番号</span>
        <input type="text" placeholder="例: 北海01-12345" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">交付日</span>
          <input type="date" value={form.issuedDate} onChange={e => set('issuedDate', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">有効期限 *</span>
          <input type="date" required value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">交付都道府県・機関</span>
        <input type="text" placeholder="例: 北海道知事" value={form.issuer} onChange={e => set('issuer', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">メモ</span>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit" className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存</button>
      </div>
    </form>
  )
}

function LicenseCard({ license, onEdit, onRemove }) {
  const status = license.expiryDate ? getStatus(license.expiryDate) : null
  const borderMap = { red: 'border-l-red-400', amber: 'border-l-amber-400', green: 'border-l-emerald-400' }

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden border-l-4 ${status ? borderMap[status.color] : 'border-l-gray-200'}`}>
      <StatusBar color={status?.color || 'gray'} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <BookOpen size={15} className="text-emerald-600 shrink-0" />
              <span className="font-semibold text-gray-800 text-sm">{license.name}</span>
              {status && <StatusBadge status={status} />}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <InfoRow icon={Hash} label="免許番号" value={license.licenseNumber} />
              <InfoRow icon={Building2} label="交付機関" value={license.issuer} />
              <InfoRow icon={Calendar} label="交付日" value={license.issuedDate} />
              <InfoRow icon={Calendar} label="有効期限" value={license.expiryDate} color={status?.color === 'red' ? 'text-red-500' : 'text-gray-400'} />
            </div>
            {license.notes && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 flex items-start gap-1">
                <StickyNote size={11} className="mt-0.5 shrink-0 text-gray-400" /> {license.notes}
              </div>
            )}
          </div>
          <div className="flex gap-1 ml-3 shrink-0">
            <button onClick={() => onEdit(license)} className="p-2 text-gray-300 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={() => onRemove(license.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── タブ2: 狩猟登録 ───────────────────────────────────────
const REG_TYPES = ['第一種', '第二種']
const EMPTY_REG = { seasonYear: '', prefecture: '', licenseType: '第一種', registrationNumber: '', validFrom: '', validTo: '', feePaid: '', notes: '' }

function RegistrationForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_REG)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">猟期年度 *</span>
          <input type="number" required placeholder="2024" value={form.seasonYear} onChange={e => set('seasonYear', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">都道府県 *</span>
          <input type="text" required placeholder="北海道" value={form.prefecture} onChange={e => set('prefecture', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">種別</span>
        <select value={form.licenseType} onChange={e => set('licenseType', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          {REG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">登録番号</span>
        <input type="text" placeholder="例: 北海2024-01234" value={form.registrationNumber} onChange={e => set('registrationNumber', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">有効開始日</span>
          <input type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">有効終了日</span>
          <input type="date" value={form.validTo} onChange={e => set('validTo', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">メモ</span>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存</button>
      </div>
    </form>
  )
}

function RegistrationCard({ reg, onEdit, onRemove }) {
  const today = new Date().toISOString().split('T')[0]
  const isActive = reg.validFrom && reg.validTo
    ? today >= reg.validFrom && today <= reg.validTo
    : false
  const isPast = reg.validTo ? today > reg.validTo : false

  const borderColor = isActive ? 'border-l-blue-500' : isPast ? 'border-l-gray-300' : 'border-l-blue-300'
  const barColor = isActive ? 'bg-blue-500' : isPast ? 'bg-gray-300' : 'bg-blue-300'

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden border-l-4 ${borderColor}`}>
      <div className={`h-1 w-full ${barColor}`} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Calendar size={15} className="text-blue-600 shrink-0" />
              <span className="font-semibold text-gray-800 text-sm">{reg.seasonYear}年度 猟期登録</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{reg.prefecture}</span>
              {isActive && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">有効</span>
              )}
              {isPast && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">終了</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <InfoRow icon={Hash} label="登録番号" value={reg.registrationNumber} />
              <InfoRow icon={Shield} label="種別" value={reg.licenseType} />
              <InfoRow icon={Calendar} label="有効開始" value={reg.validFrom} />
              <InfoRow icon={Calendar} label="有効終了" value={reg.validTo} />
            </div>
            {reg.notes && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 flex items-start gap-1">
                <StickyNote size={11} className="mt-0.5 shrink-0 text-gray-400" /> {reg.notes}
              </div>
            )}
          </div>
          <div className="flex gap-1 ml-3 shrink-0">
            <button onClick={() => onEdit(reg)} className="p-2 text-gray-300 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={() => onRemove(reg.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── タブ3: 講習・資格 ────────────────────────────────────
const EMPTY_LECTURE = { name: '猟銃等講習会修了証', licenseNumber: '', issuedDate: '', expiryDate: '', issuer: '', notes: '' }

function LectureForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_LECTURE)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">種別 *</span>
        <select required value={form.name} onChange={e => set('name', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
          {LECTURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">修了証番号</span>
        <input type="text" placeholder="例: 安全-2024-0023" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">受講日</span>
          <input type="date" value={form.issuedDate} onChange={e => set('issuedDate', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">有効期限 *</span>
          <input type="date" required value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">実施機関</span>
        <input type="text" placeholder="例: 北海道公安委員会" value={form.issuer} onChange={e => set('issuer', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">メモ</span>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit" className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700">保存</button>
      </div>
    </form>
  )
}

// ── タブ4: 所持許可証 ─────────────────────────────────────
const EMPTY_PERMIT_BOOK = { bookNumber: '', originalIssueDate: '', issueDate: '' }

function PermitBookForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_PERMIT_BOOK)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">許可証番号</span>
        <input type="text" placeholder="例: 第302202000001号" value={form.bookNumber} onChange={e => set('bookNumber', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">原交付日</span>
          <input type="date" value={form.originalIssueDate} onChange={e => set('originalIssueDate', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">交付日</span>
          <input type="date" value={form.issueDate} onChange={e => set('issueDate', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit" className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">保存</button>
      </div>
    </form>
  )
}

function PermitBookCard({ book, onEdit, onRemove }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden border-l-4 border-l-purple-400">
      <div className="h-1 w-full bg-purple-400" />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <BookLock size={15} className="text-purple-600 shrink-0" />
              <span className="font-semibold text-gray-800 text-sm">銃砲所持許可証</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <InfoRow icon={Hash} label="許可証番号" value={book.bookNumber} />
              <InfoRow icon={Calendar} label="原交付日" value={book.originalIssueDate} />
              <InfoRow icon={Calendar} label="交付日" value={book.issueDate} />
            </div>
          </div>
          <div className="flex gap-1 ml-3 shrink-0">
            <button onClick={() => onEdit(book)} className="p-2 text-gray-300 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"><Pencil size={14} /></button>
            <button onClick={() => onRemove(book.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── タブ5: 銃許可 ─────────────────────────────────────────
const FIREARM_TYPES = ['散弾銃', 'ライフル', '空気銃', 'その他']
const EMPTY_FIREARM = {
  name: '', type: '散弾銃', mechanism: '', manufacturer: '', model: '', serialNumber: '',
  caliber: '',
  originalPermitDate: '', originalPermitNumber: '',
  permitDate: '', permitNumber: '',
  permitValidityText: '', renewalFrom: '', renewalTo: '',
  notes: ''
}

const TYPE_BADGE = {
  '散弾銃': 'bg-orange-100 text-orange-700 border border-orange-200',
  'ライフル': 'bg-amber-100 text-amber-800 border border-amber-200',
  '空気銃': 'bg-sky-100 text-sky-700 border border-sky-200',
  'その他': 'bg-gray-100 text-gray-600 border border-gray-200',
}
const TYPE_BORDER = {
  '散弾銃': 'border-l-orange-400',
  'ライフル': 'border-l-amber-500',
  '空気銃': 'border-l-sky-400',
  'その他': 'border-l-gray-300',
}
const TYPE_BAR = {
  '散弾銃': 'bg-orange-400',
  'ライフル': 'bg-amber-500',
  '空気銃': 'bg-sky-400',
  'その他': 'bg-gray-300',
}

function FirearmForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FIREARM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const [ocrFile, setOcrFile] = useState(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrMsg, setOcrMsg] = useState('')

  function mapGunType(str) {
    if (!str) return form.type
    if (str.includes('ライフル')) return 'ライフル'
    if (str.includes('散弾')) return '散弾銃'
    if (str.includes('空気')) return '空気銃'
    return 'その他'
  }

  async function handleOcr() {
    if (!ocrFile) return
    const apiKey = localStorage.getItem('anthropic_api_key')
    if (!apiKey) { setOcrMsg('⚠️ 設定画面でAnthropicのAPIキーを登録してください'); return }
    setOcrLoading(true); setOcrMsg('')
    try {
      const { base64, mediaType } = await fileToBase64(ocrFile)
      const result = await analyzeGunPermit(base64, mediaType, apiKey)
      if (!result) { setOcrMsg('❌ 読み取りに失敗しました。画像を確認してください'); return }
      if (result.page === 'spec') {
        if (result.type) set('type', mapGunType(result.type))
        if (result.mechanism) set('mechanism', result.mechanism)
        if (result.manufacturer) set('manufacturer', result.manufacturer)
        if (result.model) set('model', result.model)
        if (result.serialNumber) set('serialNumber', result.serialNumber)
        if (result.caliber) set('caliber', result.caliber)
        if (result.originalPermitDate) set('originalPermitDate', result.originalPermitDate)
        if (result.originalPermitNumber) set('originalPermitNumber', result.originalPermitNumber)
        if (result.permitDate) set('permitDate', result.permitDate)
        if (result.permitNumber) set('permitNumber', result.permitNumber)
        if (result.permitValidityText) set('permitValidityText', result.permitValidityText)
        // renewalPeriodText はテキストのみなので日付フィールドへの自動反映はしない
        setOcrMsg('✅ 銃諸元ページを読み取りました。内容を確認してください')
      } else if (result.page === 'holder') {
        setOcrMsg('ℹ️ 所持者情報ページです。「所持許可証」タブで登録してください')
      }
    } catch { setOcrMsg('❌ OCR処理中にエラーが発生しました') }
    finally { setOcrLoading(false) }
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      {/* OCR読み取り */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
          <Camera size={13} /> 許可証から自動入力（OCR）
        </div>
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <input type="file" accept="image/*" onChange={e => setOcrFile(e.target.files?.[0] || null)}
              className="text-xs text-gray-600 w-full" />
          </label>
          <button type="button" onClick={handleOcr} disabled={!ocrFile || ocrLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 shrink-0">
            {ocrLoading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
            読み取り
          </button>
        </div>
        {ocrMsg && <p className="text-xs mt-1.5 text-blue-700">{ocrMsg}</p>}
      </div>

      {/* 銃名 */}
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">銃名 *</span>
        <input type="text" required placeholder="例: レミントン M870 12番" value={form.name} onChange={e => set('name', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </label>

      {/* 銃諸元 */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        <div className="text-xs font-semibold text-gray-600">銃諸元</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">種類</span>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              {FIREARM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">口径・適合実包</span>
            <input type="text" placeholder="例: 12ga / .30-06" value={form.caliber} onChange={e => set('caliber', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">型式</span>
          <input type="text" placeholder="例: 単身連発スライド式（ポンプ式）" value={form.mechanism} onChange={e => set('mechanism', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">メーカー名</span>
            <input type="text" placeholder="例: レミントン" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">モデル名等</span>
            <input type="text" placeholder="例: M870" value={form.model} onChange={e => set('model', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">銃番号</span>
          <input type="text" placeholder="例: A364975M" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
      </div>

      {/* 許可情報 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
        <div className="text-xs font-semibold text-amber-700">許可情報</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">原許可日</span>
            <input type="date" value={form.originalPermitDate} onChange={e => set('originalPermitDate', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">原許可番号</span>
            <div className="mt-1 flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
              <span className="px-2 text-sm text-gray-400 bg-gray-50 border-r select-none">第</span>
              <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="220020009" value={form.originalPermitNumber} onChange={e => set('originalPermitNumber', e.target.value.replace(/[^0-9]/g, ''))}
                className="flex-1 px-2 py-2 text-sm focus:outline-none" />
              <span className="px-2 text-sm text-gray-400 bg-gray-50 border-l select-none">号</span>
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">許可年月日</span>
            <input type="date" value={form.permitDate} onChange={e => set('permitDate', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">許可番号</span>
            <div className="mt-1 flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
              <span className="px-2 text-sm text-gray-400 bg-gray-50 border-r select-none">第</span>
              <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="220080423" value={form.permitNumber} onChange={e => set('permitNumber', e.target.value.replace(/[^0-9]/g, ''))}
                className="flex-1 px-2 py-2 text-sm focus:outline-none" />
              <span className="px-2 text-sm text-gray-400 bg-gray-50 border-l select-none">号</span>
            </div>
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">有効期間</span>
          <input type="text" placeholder="例: 令和11年の誕生日まで" value={form.permitValidityText} onChange={e => set('permitValidityText', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <div className="block">
          <span className="text-xs text-gray-500 font-medium">更新申請期間</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="date" value={form.renewalFrom} onChange={e => set('renewalFrom', e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <span className="text-xs text-gray-400 shrink-0">〜</span>
            <input type="date" value={form.renewalTo} onChange={e => set('renewalTo', e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-xs text-gray-500 font-medium">メモ</span>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit" className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">保存</button>
      </div>
    </form>
  )
}

function FirearmCard({ firearm, onEdit, onRemove }) {
  const borderColor = TYPE_BORDER[firearm.type] || 'border-l-gray-300'
  const barColor = TYPE_BAR[firearm.type] || 'bg-gray-300'

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden border-l-4 ${borderColor}`}>
      <div className={`h-1 w-full ${barColor}`} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Crosshair size={15} className="text-amber-600 shrink-0" />
              <span className="font-semibold text-gray-800 text-sm">{firearm.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[firearm.type] || TYPE_BADGE['その他']}`}>
                {firearm.type}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {firearm.manufacturer && firearm.model && (
                <InfoRow icon={Building2} label="製造" value={`${firearm.manufacturer} ${firearm.model}`} />
              )}
              {firearm.caliber && <InfoRow icon={Crosshair} label="口径" value={firearm.caliber} />}
              {firearm.serialNumber && <InfoRow icon={Hash} label="銃番号" value={firearm.serialNumber} />}
              {firearm.mechanism && <InfoRow icon={ClipboardList} label="型式" value={firearm.mechanism} />}
              {firearm.originalPermitDate && <InfoRow icon={Calendar} label="原許可日" value={firearm.originalPermitDate} />}
              {firearm.originalPermitNumber && <InfoRow icon={Hash} label="原許可番号" value={`第${firearm.originalPermitNumber}号`} />}
              {firearm.permitDate && <InfoRow icon={Calendar} label="許可年月日" value={firearm.permitDate} />}
              {firearm.permitNumber && <InfoRow icon={Hash} label="許可番号" value={`第${firearm.permitNumber}号`} />}
              {firearm.permitValidityText && <InfoRow icon={Shield} label="有効期間" value={firearm.permitValidityText} />}
              {(firearm.renewalFrom || firearm.renewalTo) && (
                <InfoRow icon={Calendar} label="更新申請期間"
                  value={`${firearm.renewalFrom || ''}〜${firearm.renewalTo || ''}`}
                  color="text-amber-500" />
              )}
            </div>
            {firearm.notes && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 flex items-start gap-1">
                <StickyNote size={11} className="mt-0.5 shrink-0 text-gray-400" /> {firearm.notes}
              </div>
            )}
          </div>
          <div className="flex gap-1 ml-3 shrink-0">
            <button onClick={() => onEdit(firearm)} className="p-2 text-gray-300 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={() => onRemove(firearm.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── メインページ ───────────────────────────────────────────
const TABS = [
  { id: 'license',      label: '狩猟免許',   icon: BookOpen,      color: 'emerald' },
  { id: 'registration', label: '狩猟登録',   icon: Calendar,      color: 'blue'    },
  { id: 'lecture',      label: '講習・資格', icon: GraduationCap, color: 'teal'    },
  { id: 'permit',       label: '所持許可証', icon: BookLock,      color: 'purple'  },
  { id: 'firearm',      label: '銃許可',     icon: Crosshair,     color: 'amber'   },
]

export default function Licenses() {
  const [tab, setTab] = useState('license')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const { records: licenses, add: addLic, update: updLic, remove: remLic } = useLicenses()
  const { records: registrations, add: addReg, update: updReg, remove: remReg } = useHuntingRegistrations()
  const { records: firearms, add: addGun, update: updGun, remove: remGun } = useFirearms()
  const { records: permitBooks, add: addPB, update: updPB, remove: remPB } = usePermitBooks()

  const lectureRecords = licenses.filter(l => LECTURE_TYPES.includes(l.name))
  const licenseRecords = licenses.filter(l => !LECTURE_TYPES.includes(l.name))

  // タブ設定
  const TAB_COLORS = {
    emerald: { active: 'bg-emerald-600 text-white shadow-sm', inactive: 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50' },
    blue:    { active: 'bg-blue-600 text-white shadow-sm',    inactive: 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'    },
    teal:    { active: 'bg-teal-600 text-white shadow-sm',    inactive: 'text-gray-500 hover:text-teal-700 hover:bg-teal-50'    },
    purple:  { active: 'bg-purple-600 text-white shadow-sm',  inactive: 'text-gray-500 hover:text-purple-700 hover:bg-purple-50' },
    amber:   { active: 'bg-amber-600 text-white shadow-sm',   inactive: 'text-gray-500 hover:text-amber-700 hover:bg-amber-50'   },
  }

  const addButtonColor = {
    license:      'bg-emerald-600 hover:bg-emerald-700',
    registration: 'bg-blue-600 hover:bg-blue-700',
    lecture:      'bg-teal-600 hover:bg-teal-700',
    permit:       'bg-purple-600 hover:bg-purple-700',
    firearm:      'bg-amber-600 hover:bg-amber-700',
  }

  const tabLabel = { license: '免許', registration: '登録', lecture: '講習', permit: '所持許可証', firearm: '銃' }

  function handleSave(data) {
    if (tab === 'license') {
      if (editing) { updLic(editing.id, data); setEditing(null) }
      else { addLic(data); setShowAdd(false) }
    } else if (tab === 'registration') {
      if (editing) { updReg(editing.id, data); setEditing(null) }
      else { addReg(data); setShowAdd(false) }
    } else if (tab === 'lecture') {
      if (editing) { updLic(editing.id, data); setEditing(null) }
      else { addLic(data); setShowAdd(false) }
    } else if (tab === 'permit') {
      if (editing) { updPB(editing.id, data); setEditing(null) }
      else { addPB(data); setShowAdd(false) }
    } else {
      if (editing) { updGun(editing.id, data); setEditing(null) }
      else { addGun(data); setShowAdd(false) }
    }
  }

  function handleCancel() {
    setShowAdd(false)
    setEditing(null)
  }

  const count = {
    license: licenseRecords.length,
    registration: registrations.length,
    lecture: lectureRecords.length,
    permit: permitBooks.length,
    firearm: firearms.length
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileCheck className="text-emerald-600" size={24} /> 免許・許可証管理
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm transition-colors ${addButtonColor[tab]}`}>
          <Plus size={16} /> {tabLabel[tab]}を追加
        </button>
      </div>

      {/* タブバー */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map(({ id, label, icon: Icon, color }) => {
          const isActive = tab === id
          const { active, inactive } = TAB_COLORS[color]
          return (
            <button
              key={id}
              onClick={() => { setTab(id); setShowAdd(false); setEditing(null) }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive ? active : inactive}`}>
              <Icon size={14} />
              {label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ml-0.5 ${isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                {count[id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* タブ1: 狩猟免許 */}
      {tab === 'license' && (
        licenseRecords.length === 0 ? (
          <EmptyState message="まだ狩猟免許が登録されていません。「免許を追加」から登録してください。" />
        ) : (
          <div className="space-y-3">
            {[...licenseRecords]
              .sort((a, b) => (a.expiryDate || '').localeCompare(b.expiryDate || ''))
              .map(lic => (
                <LicenseCard
                  key={lic.id}
                  license={lic}
                  onEdit={r => setEditing(r)}
                  onRemove={id => remLic(id)}
                />
              ))}
          </div>
        )
      )}

      {/* タブ2: 狩猟登録 */}
      {tab === 'registration' && (
        registrations.length === 0 ? (
          <EmptyState message="まだ狩猟登録がありません。「登録を追加」から登録してください。" />
        ) : (
          <div className="space-y-3">
            {[...registrations]
              .sort((a, b) => b.seasonYear - a.seasonYear)
              .map(reg => (
                <RegistrationCard
                  key={reg.id}
                  reg={reg}
                  onEdit={r => setEditing(r)}
                  onRemove={id => remReg(id)}
                />
              ))}
          </div>
        )
      )}

      {/* タブ3: 講習・資格 */}
      {tab === 'lecture' && (
        lectureRecords.length === 0 ? (
          <EmptyState message="まだ講習・資格が登録されていません。「講習を追加」から登録してください。" />
        ) : (
          <div className="space-y-3">
            {[...lectureRecords]
              .sort((a, b) => (a.expiryDate || '').localeCompare(b.expiryDate || ''))
              .map(lic => (
                <LicenseCard
                  key={lic.id}
                  license={lic}
                  onEdit={r => setEditing(r)}
                  onRemove={id => remLic(id)}
                />
              ))}
          </div>
        )
      )}

      {/* タブ4: 所持許可証 */}
      {tab === 'permit' && (
        permitBooks.length === 0 ? (
          <EmptyState message="まだ所持許可証が登録されていません。「所持許可証を追加」から登録してください。" />
        ) : (
          <div className="space-y-3">
            {permitBooks.map(book => (
              <PermitBookCard
                key={book.id}
                book={book}
                onEdit={r => setEditing(r)}
                onRemove={id => remPB(id)}
              />
            ))}
          </div>
        )
      )}

      {/* タブ5: 銃許可 */}
      {tab === 'firearm' && (
        firearms.length === 0 ? (
          <EmptyState message="まだ銃許可が登録されていません。「銃を追加」から登録してください。" />
        ) : (
          <div className="space-y-3">
            {[...firearms]
              .sort((a, b) => (a.permitExpiry || '').localeCompare(b.permitExpiry || ''))
              .map(gun => (
                <FirearmCard
                  key={gun.id}
                  firearm={gun}
                  onEdit={r => setEditing(r)}
                  onRemove={id => remGun(id)}
                />
              ))}
          </div>
        )
      )}

      {/* 追加モーダル */}
      {showAdd && (
        <Modal
          title={
            tab === 'license' ? '狩猟免許を追加' :
            tab === 'registration' ? '狩猟登録を追加' :
            tab === 'lecture' ? '講習・資格を追加' :
            tab === 'permit' ? '所持許可証を追加' :
            '銃許可を追加'
          }
          onClose={handleCancel}>
          {tab === 'license' && <LicenseForm onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'registration' && <RegistrationForm onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'lecture' && <LectureForm onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'permit' && <PermitBookForm onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'firearm' && <FirearmForm onSave={handleSave} onCancel={handleCancel} />}
        </Modal>
      )}

      {/* 編集モーダル */}
      {editing && (
        <Modal
          title={
            tab === 'license' ? '狩猟免許を編集' :
            tab === 'registration' ? '狩猟登録を編集' :
            tab === 'lecture' ? '講習・資格を編集' :
            tab === 'permit' ? '所持許可証を編集' :
            '銃許可を編集'
          }
          onClose={handleCancel}>
          {tab === 'license' && <LicenseForm initial={editing} onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'registration' && <RegistrationForm initial={editing} onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'lecture' && <LectureForm initial={editing} onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'permit' && <PermitBookForm initial={editing} onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'firearm' && <FirearmForm initial={editing} onSave={handleSave} onCancel={handleCancel} />}
        </Modal>
      )}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
      {message}
    </div>
  )
}
