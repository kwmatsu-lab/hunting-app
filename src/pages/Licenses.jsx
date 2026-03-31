import { useState } from 'react'
import {
  Plus, Trash2, Pencil, FileCheck, AlertTriangle, CheckCircle2,
  Shield, Crosshair, BookOpen, Calendar, Hash, Building2, MapPin,
  Lock, StickyNote
} from 'lucide-react'
import { useLicenses, useFirearms, useHuntingRegistrations } from '../store/useStore'
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
        <span className="text-xs text-gray-500 font-medium">登録料 (円)</span>
        <input type="number" placeholder="16500" value={form.feePaid} onChange={e => set('feePaid', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </label>
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
              {reg.feePaid && (
                <InfoRow icon={Building2} label="登録料" value={`¥${reg.feePaid.toLocaleString()}`} />
              )}
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

// ── タブ3: 銃管理 ─────────────────────────────────────────
const FIREARM_TYPES = ['散弾銃', 'ライフル', '空気銃', 'その他']
const EMPTY_FIREARM = {
  name: '', type: '散弾銃', manufacturer: '', model: '', serialNumber: '',
  caliber: '', permitNumber: '', permitExpiry: '', permitIssuer: '', safeStorage: '',
  safetyTrainingDate: '', safetyTrainingCertNo: '', inspectionDate: '', notes: ''
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

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">銃名 *</span>
        <input type="text" required placeholder="例: ブローニングBPS 12番" value={form.name} onChange={e => set('name', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">種類</span>
          <select value={form.type} onChange={e => set('type', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            {FIREARM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">口径</span>
          <input type="text" placeholder="例: 12番 / .30-06" value={form.caliber} onChange={e => set('caliber', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">製造者</span>
          <input type="text" placeholder="例: Browning" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">型番</span>
          <input type="text" placeholder="例: BPS" value={form.model} onChange={e => set('model', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">製造番号</span>
        <input type="text" placeholder="例: BPS-123456" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">所持許可証番号</span>
          <input type="text" placeholder="例: 札北01-98765" value={form.permitNumber} onChange={e => set('permitNumber', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">有効期限</span>
          <input type="date" value={form.permitExpiry} onChange={e => set('permitExpiry', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">所轄警察署</span>
        <input type="text" placeholder="例: 北海道警察 札幌北警察署" value={form.permitIssuer} onChange={e => set('permitIssuer', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </label>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">保管場所</span>
        <input type="text" placeholder="例: 専用ロッカー（スチール製）" value={form.safeStorage} onChange={e => set('safeStorage', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </label>
      {/* 法令要件：安全講習・定期検査 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="text-xs font-semibold text-amber-700 mb-2">⚖️ 法令要件（銃砲刀剣類所持等取締法）</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">安全講習修了日</span>
            <input type="date" value={form.safetyTrainingDate || ''} onChange={e => set('safetyTrainingDate', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 font-medium">修了証番号</span>
            <input type="text" placeholder="例: 安全-2024-001" value={form.safetyTrainingCertNo || ''} onChange={e => set('safetyTrainingCertNo', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </label>
          <label className="block col-span-2">
            <span className="text-xs text-gray-500 font-medium">猟銃定期検査 最終受検日（3年ごと義務）</span>
            <input type="date" value={form.inspectionDate || ''} onChange={e => set('inspectionDate', e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </label>
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
  const status = firearm.permitExpiry ? getStatus(firearm.permitExpiry) : null
  const borderColor = TYPE_BORDER[firearm.type] || 'border-l-gray-300'
  const barColor = status ? { red: 'bg-red-500', amber: 'bg-amber-400', green: TYPE_BAR[firearm.type] || 'bg-amber-400' }[status.color] : (TYPE_BAR[firearm.type] || 'bg-gray-300')
  // 安全講習の次回期限（3年）
  const today = new Date().toISOString().split('T')[0]
  const trainingNextDue = firearm.safetyTrainingDate
    ? new Date(new Date(firearm.safetyTrainingDate).setFullYear(new Date(firearm.safetyTrainingDate).getFullYear() + 3)).toISOString().split('T')[0]
    : null
  const trainingStatus = trainingNextDue ? getStatus(trainingNextDue) : null
  // 定期検査の次回期限（3年）
  const inspectionNextDue = firearm.inspectionDate
    ? new Date(new Date(firearm.inspectionDate).setFullYear(new Date(firearm.inspectionDate).getFullYear() + 3)).toISOString().split('T')[0]
    : null
  const inspectionStatus = inspectionNextDue ? getStatus(inspectionNextDue) : null

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
              {status && <StatusBadge status={status} />}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {firearm.manufacturer && firearm.model && (
                <InfoRow icon={Building2} label="製造" value={`${firearm.manufacturer} ${firearm.model}`} />
              )}
              {firearm.caliber && <InfoRow icon={Crosshair} label="口径" value={firearm.caliber} />}
              {firearm.serialNumber && <InfoRow icon={Hash} label="製造番号" value={firearm.serialNumber} />}
              {firearm.permitNumber && <InfoRow icon={Shield} label="所持許可番号" value={firearm.permitNumber} />}
              {firearm.permitExpiry && (
                <InfoRow icon={Calendar} label="許可有効期限" value={firearm.permitExpiry}
                  color={status?.color === 'red' ? 'text-red-500' : 'text-gray-400'} />
              )}
              {firearm.permitIssuer && <InfoRow icon={MapPin} label="所轄警察署" value={firearm.permitIssuer} />}
              {firearm.safeStorage && <InfoRow icon={Lock} label="保管場所" value={firearm.safeStorage} />}
              {firearm.safetyTrainingDate && (
                <InfoRow icon={Shield} label="安全講習修了日" value={firearm.safetyTrainingDate}
                  color={trainingStatus?.color === 'red' ? 'text-red-500' : trainingStatus?.color === 'amber' ? 'text-amber-500' : 'text-gray-400'} />
              )}
              {trainingNextDue && (
                <InfoRow icon={Calendar} label="次回講習期限" value={trainingNextDue}
                  color={trainingStatus?.color === 'red' ? 'text-red-500' : trainingStatus?.color === 'amber' ? 'text-amber-500' : 'text-gray-400'} />
              )}
              {firearm.inspectionDate && (
                <InfoRow icon={Shield} label="定期検査 最終受検" value={firearm.inspectionDate}
                  color={inspectionStatus?.color === 'red' ? 'text-red-500' : inspectionStatus?.color === 'amber' ? 'text-amber-500' : 'text-gray-400'} />
              )}
              {inspectionNextDue && (
                <InfoRow icon={Calendar} label="次回検査期限" value={inspectionNextDue}
                  color={inspectionStatus?.color === 'red' ? 'text-red-500' : inspectionStatus?.color === 'amber' ? 'text-amber-500' : 'text-gray-400'} />
              )}
            </div>
            {/* 法令アラート */}
            {(!firearm.safetyTrainingDate || !firearm.inspectionDate) && (
              <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-amber-700 flex items-start gap-1.5">
                <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                <span>
                  {!firearm.safetyTrainingDate && '安全講習修了証を登録してください。'}
                  {!firearm.safetyTrainingDate && !firearm.inspectionDate && ' '}
                  {!firearm.inspectionDate && '定期検査の受検記録を登録してください。'}
                </span>
              </div>
            )}
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
  { id: 'license',      label: '狩猟免許',    icon: BookOpen,  color: 'emerald' },
  { id: 'registration', label: '狩猟登録',    icon: Calendar,  color: 'blue'    },
  { id: 'firearm',      label: '銃・所持許可', icon: Crosshair, color: 'amber'   },
]

export default function Licenses() {
  const [tab, setTab] = useState('license')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const { records: licenses, add: addLic, update: updLic, remove: remLic } = useLicenses()
  const { records: registrations, add: addReg, update: updReg, remove: remReg } = useHuntingRegistrations()
  const { records: firearms, add: addGun, update: updGun, remove: remGun } = useFirearms()

  // タブ設定
  const TAB_COLORS = {
    emerald: { active: 'bg-emerald-600 text-white shadow-sm', inactive: 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50' },
    blue:    { active: 'bg-blue-600 text-white shadow-sm',    inactive: 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'    },
    amber:   { active: 'bg-amber-600 text-white shadow-sm',   inactive: 'text-gray-500 hover:text-amber-700 hover:bg-amber-50'   },
  }

  const addButtonColor = {
    license:      'bg-emerald-600 hover:bg-emerald-700',
    registration: 'bg-blue-600 hover:bg-blue-700',
    firearm:      'bg-amber-600 hover:bg-amber-700',
  }

  const tabLabel = { license: '免許', registration: '登録', firearm: '銃' }

  function handleSave(data) {
    if (tab === 'license') {
      if (editing) { updLic(editing.id, data); setEditing(null) }
      else { addLic(data); setShowAdd(false) }
    } else if (tab === 'registration') {
      if (editing) { updReg(editing.id, data); setEditing(null) }
      else { addReg(data); setShowAdd(false) }
    } else {
      if (editing) { updGun(editing.id, data); setEditing(null) }
      else { addGun(data); setShowAdd(false) }
    }
  }

  function handleCancel() {
    setShowAdd(false)
    setEditing(null)
  }

  const count = { license: licenses.length, registration: registrations.length, firearm: firearms.length }

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
        licenses.length === 0 ? (
          <EmptyState message="まだ狩猟免許が登録されていません。「免許を追加」から登録してください。" />
        ) : (
          <div className="space-y-3">
            {[...licenses]
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

      {/* タブ3: 銃管理 */}
      {tab === 'firearm' && (
        firearms.length === 0 ? (
          <EmptyState message="まだ銃・所持許可が登録されていません。「銃を追加」から登録してください。" />
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
          title={tab === 'license' ? '狩猟免許を追加' : tab === 'registration' ? '狩猟登録を追加' : '銃・所持許可を追加'}
          onClose={handleCancel}>
          {tab === 'license' && <LicenseForm onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'registration' && <RegistrationForm onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'firearm' && <FirearmForm onSave={handleSave} onCancel={handleCancel} />}
        </Modal>
      )}

      {/* 編集モーダル */}
      {editing && (
        <Modal
          title={tab === 'license' ? '狩猟免許を編集' : tab === 'registration' ? '狩猟登録を編集' : '銃・所持許可を編集'}
          onClose={handleCancel}>
          {tab === 'license' && <LicenseForm initial={editing} onSave={handleSave} onCancel={handleCancel} />}
          {tab === 'registration' && <RegistrationForm initial={editing} onSave={handleSave} onCancel={handleCancel} />}
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
