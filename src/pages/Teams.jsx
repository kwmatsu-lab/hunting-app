import { useState } from 'react'
import {
  Users2, Plus, LogIn, Crown, UserMinus, Trash2,
  Copy, Check, ChevronDown, ChevronUp, Info
} from 'lucide-react'
import { useHuntingTeams, useTeamMembers } from '../store/useStore'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

// ── チームメンバー展開パネル ───────────────────────────────
function MembersPanel({ teamId, isLeader, currentUserId }) {
  const { members, loading, removeMember } = useTeamMembers(teamId)

  async function handleRemove(member) {
    if (!confirm(`${member.displayName} をチームから削除しますか？`)) return
    try { await removeMember(member.id) } catch (e) { alert(e.message) }
  }

  if (loading) return <p className="text-xs text-gray-400 px-4 py-3">読み込み中...</p>

  return (
    <div className="border-t border-gray-100 bg-purple-50 px-4 py-3">
      <div className="text-xs font-semibold text-gray-500 mb-2">メンバー ({members.length}人)</div>
      {members.length === 0 ? (
        <p className="text-xs text-gray-400">メンバーがいません</p>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">
                  {m.displayName[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-sm text-gray-700">{m.displayName}</span>
                {m.isLeader && <Crown size={12} className="text-amber-500" title="リーダー" />}
                {m.userId === currentUserId && (
                  <span className="text-xs text-gray-400">（あなた）</span>
                )}
              </div>
              {isLeader && m.userId !== currentUserId && (
                <button
                  onClick={() => handleRemove(m)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50 transition-colors">
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── チームカード ───────────────────────────────────────────
function TeamCard({ team, onLeave, onDelete, currentUserId }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(team.inviteCode || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          {/* 左: 情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-800 text-sm">{team.name}</h3>
              {team.isLeader ? (
                <span className="flex items-center gap-0.5 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  <Crown size={10} /> リーダー
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">メンバー</span>
              )}
            </div>
            {team.description && (
              <p className="text-xs text-gray-500 mt-1">{team.description}</p>
            )}

            {/* 招待コード */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">招待コード:</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700 tracking-widest">
                {team.inviteCode}
              </span>
              <button onClick={copyCode} title="コピー"
                className="text-gray-400 hover:text-gray-600 transition-colors">
                {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          {/* 右: アクション */}
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setExpanded(e => !e)}
              className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {team.isLeader ? (
              <button onClick={() => onDelete(team.id)} title="チームを削除"
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 size={15} />
              </button>
            ) : (
              <button onClick={() => onLeave(team.id)} title="チームから退出"
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                <UserMinus size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <MembersPanel
          teamId={team.id}
          isLeader={team.isLeader}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}

// ── メインページ ───────────────────────────────────────────
export default function Teams() {
  const { user } = useAuth()
  const { teams, loading, createTeam, joinTeam, leaveTeam, deleteTeam } = useHuntingTeams()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [joinCode, setJoinCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createTeam(createForm)
      setShowCreate(false)
      setCreateForm({ name: '', description: '' })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const team = await joinTeam(joinCode.trim().toUpperCase())
      setShowJoin(false)
      setJoinCode('')
      alert(`「${team.name}」に参加しました！`)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLeave(teamId) {
    if (!confirm('チームから退出しますか？')) return
    try { await leaveTeam(teamId) } catch (e) { alert(e.message) }
  }

  async function handleDelete(teamId) {
    if (!confirm('チームを削除しますか？\nすべてのメンバーがアクセスできなくなります。')) return
    try { await deleteTeam(teamId) } catch (e) { alert(e.message) }
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users2 className="text-purple-600" size={24} /> 猟隊管理
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(true); setError('') }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
            <LogIn size={15} /> 参加
          </button>
          <button
            onClick={() => { setShowCreate(true); setError('') }}
            className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
            <Plus size={15} /> 新規作成
          </button>
        </div>
      </div>

      {/* インフォメーション */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <Info size={15} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-700 space-y-0.5">
            <p className="font-semibold">猟隊（チーム）について</p>
            <p>• 猟隊を作成して招待コードを共有することでメンバーを追加できます</p>
            <p>• 狩猟記録で「巻き狩り」を選択しチームを設定すると、捕獲ごとに射手を記録できます</p>
            <p>• チームの狩猟記録は参加メンバー全員が閲覧できます</p>
          </div>
        </div>
      </div>

      {/* チーム一覧 */}
      {loading ? (
        <div className="text-center text-gray-400 py-12 text-sm">読み込み中...</div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Users2 size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">チームに参加していません</p>
          <p className="text-gray-300 text-xs mt-1">新規作成するか、招待コードで参加してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              currentUserId={user.id}
              onLeave={handleLeave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 新規作成モーダル */}
      {showCreate && (
        <Modal title="猟隊を新規作成" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block">
              <span className="text-xs text-gray-500 font-medium">チーム名 *</span>
              <input
                type="text" required
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="例: 山田猟友会"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 font-medium">説明（任意）</span>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="チームの説明..."
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
            </label>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {saving ? '作成中...' : '作成する'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 参加モーダル */}
      {showJoin && (
        <Modal title="招待コードで参加" onClose={() => setShowJoin(false)}>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="bg-purple-50 text-purple-700 text-xs rounded-lg px-3 py-2">
              チームのリーダーに招待コードを聞いてください（8桁の英数字）
            </div>
            <label className="block">
              <span className="text-xs text-gray-500 font-medium">招待コード *</span>
              <input
                type="text" required
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="例: AB12CD34"
                maxLength={8}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </label>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowJoin(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {saving ? '参加中...' : '参加する'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
