import { useState } from 'react'
import { Settings as SettingsIcon, Key, Eye, EyeOff, Check, User, Shield, ScrollText, Trash2, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { profile, updateProfile, deleteAccount } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState('')

  async function handleNameSave() {
    if (!displayName.trim()) { setNameError('名前を入力してください'); return }
    try {
      await updateProfile(displayName.trim())
      setNameSaved(true)
      setNameError('')
      setTimeout(() => setNameSaved(false), 2000)
    } catch {
      setNameError('保存に失敗しました')
    }
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'アカウントを削除') return
    setDeleting(true)
    try {
      await deleteAccount()
    } catch {
      setDeleting(false)
    }
  }

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_api_key') || '')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (apiKey.trim()) {
      localStorage.setItem('anthropic_api_key', apiKey.trim())
    } else {
      localStorage.removeItem('anthropic_api_key')
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <SettingsIcon className="text-gray-500" size={24} /> 設定
      </h1>

      {/* アカウント名 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
          <User size={16} className="text-indigo-500" /> アカウント名
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          猟隊のメンバー一覧などに表示される名前です。
        </p>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="表示名を入力"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
        <button onClick={handleNameSave}
          className={`mt-3 flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${nameSaved ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {nameSaved ? <><Check size={15} /> 保存しました</> : '保存'}
        </button>
      </div>

      {/* Anthropic API Key */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
          <Key size={16} className="text-indigo-500" /> Anthropic API キー
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          射撃記録の標的写真OCR機能（Claude AI解析）に使用します。
          キーは <strong>このブラウザのみ</strong> に保存されます。
        </p>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full border rounded-lg px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {saved ? <><Check size={15} /> 保存しました</> : '保存'}
          </button>
          {apiKey && (
            <button onClick={() => { setApiKey(''); localStorage.removeItem('anthropic_api_key') }}
              className="text-xs text-red-400 hover:text-red-600">
              クリア
            </button>
          )}
        </div>
        <p className="text-xs text-amber-600 mt-3 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          ⚠️ APIキーはブラウザのlocalStorageに保存されます。共用PCでの使用は避けてください。
          Anthropicコンソール（console.anthropic.com）でキーを発行・管理できます。
        </p>
      </div>
      {/* 法的情報 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-4">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <ScrollText size={16} className="text-indigo-500" /> 法的情報
        </h2>
        <div className="space-y-2">
          <Link to="/privacy" className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900 hover:underline">
            <Shield size={14} /> プライバシーポリシー
          </Link>
          <Link to="/terms" className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900 hover:underline">
            <ScrollText size={14} /> 利用規約
          </Link>
        </div>
      </div>

      {/* アカウント削除 */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6 mt-4">
        <h2 className="font-semibold text-red-700 flex items-center gap-2 mb-1">
          <Trash2 size={16} /> アカウント削除
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          アカウントと全てのデータ（記録・銃器・免許・チーム所属等）を完全に削除します。この操作は取り消せません。
        </p>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-sm rounded-lg font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
            アカウントを削除する...
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-red-700">
                <strong>警告：</strong>全てのデータが完全に削除されます。狩猟記録、射撃記録、銃器情報、免許情報、チーム所属がすべて失われます。
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">確認のため「アカウントを削除」と入力してください</label>
              <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="アカウントを削除"
                className="mt-1 w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'アカウントを削除' || deleting}
                className="px-4 py-2 text-sm rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {deleting ? '削除中...' : '完全に削除する'}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                className="px-4 py-2 text-sm rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
