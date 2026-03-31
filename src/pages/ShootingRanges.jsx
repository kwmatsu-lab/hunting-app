import { useState } from 'react'
import { Plus, Trash2, Pencil, MapPin } from 'lucide-react'
import { useShootingRanges } from '../store/useStore'
import Modal from '../components/Modal'

const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
]

const EMPTY = { name: '', prefecture: '', address: '', notes: '' }

function RangeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">射撃場名 *</span>
        <input type="text" required placeholder="例: 札幌射撃場" value={form.name}
          onChange={e => set('name', e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">都道府県</span>
          <select value={form.prefecture} onChange={e => set('prefecture', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">選択</option>
            {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-gray-500 font-medium">住所</span>
          <input type="text" placeholder="市区町村・番地" value={form.address}
            onChange={e => set('address', e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-gray-500 font-medium">メモ（利用可能な競技種別等）</span>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          placeholder="例: 国際トラップ・国際スキート対応、毎月第2日曜定例射撃会"
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit"
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存</button>
      </div>
    </form>
  )
}

export default function ShootingRanges() {
  const { records: ranges, add, update, remove } = useShootingRanges()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MapPin className="text-blue-500" size={24} /> 射撃場管理
        </h1>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
          <Plus size={16} /> 射撃場を追加
        </button>
      </div>

      {ranges.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          登録された射撃場がありません。「射撃場を追加」から登録してください。
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ranges.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">{r.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={10} />
                    {[r.prefecture, r.address].filter(Boolean).join(' ') || '住所未登録'}
                  </div>
                  {r.notes && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1.5">{r.notes}</div>
                  )}
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={() => setEditing(r)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 rounded hover:bg-blue-50">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => remove(r.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="射撃場を追加" onClose={() => setShowAdd(false)}>
          <RangeForm onSave={d => { add(d); setShowAdd(false) }} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="射撃場を編集" onClose={() => setEditing(null)}>
          <RangeForm initial={editing}
            onSave={d => { update(editing.id, d); setEditing(null) }}
            onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}
