import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Shield, Users, BarChart2, Users2, Crown,
  ToggleLeft, ToggleRight, RefreshCw, Target, TreePine, Package
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// ── ユーザー管理タブ ───────────────────────────────────────
function UsersTab() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const [error, setError] = useState('')

  async function loadUsers() {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_all_profiles')
    if (err) { setError('ユーザー情報の取得に失敗しました: ' + err.message); setLoading(false); return }
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function toggleAdmin(userId, current) {
    if (userId === me.id) { alert('自分自身の管理者権限は変更できません'); return }
    setToggling(userId)
    const { error: err } = await supabase.rpc('set_user_admin', { target_user_id: userId, admin_status: !current })
    if (!err) setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u))
    setToggling(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">全 {users.length} ユーザー</span>
        <button onClick={loadUsers}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100">
          <RefreshCw size={14} /> 更新
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">{error}</div>}

      {loading ? (
        <div className="text-center text-gray-400 py-12">読み込み中...</div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between gap-3">
                {/* アバター + 名前 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {(u.display_name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{u.display_name || '（名前未設定）'}</span>
                      {u.is_admin && (
                        <span className="flex items-center gap-0.5 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          <Crown size={10} /> 管理者
                        </span>
                      )}
                      {u.id === me?.id && (
                        <span className="text-xs text-gray-400">（あなた）</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{u.email}</div>
                    <div className="text-xs text-gray-300 mt-0.5">登録: {u.created_at?.slice(0, 10)}</div>
                  </div>
                </div>

                {/* 管理者トグル */}
                {u.id !== me?.id && (
                  <button
                    onClick={() => toggleAdmin(u.id, u.is_admin)}
                    disabled={toggling === u.id}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors shrink-0 font-medium ${
                      u.is_admin
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:opacity-50`}>
                    {u.is_admin ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {toggling === u.id ? '処理中...' : u.is_admin ? '管理者解除' : '管理者に設定'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center text-gray-400 py-12">ユーザーがいません</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── アプリ統計タブ ─────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('get_app_stats').then(({ data, error: err }) => {
      if (err) { setError(err.message); setLoading(false); return }
      setStats(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="text-center text-gray-400 py-12">読み込み中...</div>
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>

  const cards = [
    { label: '登録ユーザー数', value: stats?.total_users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: '狩猟記録件数', value: stats?.total_hunting_records, icon: TreePine, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { label: '総獲物数（頭）', value: stats?.total_game, icon: TreePine, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-100' },
    { label: '射撃記録件数', value: stats?.total_shooting_records, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: '総発射弾数（発）', value: stats?.total_rounds_fired, icon: Package, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: '猟隊数', value: stats?.total_teams, icon: Users2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg, border }) => (
        <div key={label} className={`${bg} rounded-xl border ${border} p-5 text-center`}>
          <div className={`flex items-center justify-center mb-2`}>
            <Icon size={22} className={color} />
          </div>
          <div className={`text-3xl font-bold ${color}`}>{value ?? '-'}</div>
          <div className="text-xs text-gray-500 mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}

// ── チーム管理タブ ─────────────────────────────────────────
function TeamsAdminTab() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('get_all_teams_admin').then(({ data, error: err }) => {
      if (err) { setError(err.message); setLoading(false); return }
      setTeams(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="text-center text-gray-400 py-12">読み込み中...</div>
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>

  return (
    <div>
      <div className="text-sm text-gray-500 mb-4">全 {teams.length} チーム</div>
      {teams.length === 0 ? (
        <div className="text-center text-gray-400 py-12">チームがありません</div>
      ) : (
        <div className="space-y-2">
          {teams.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Users2 size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{t.name}</div>
                    {t.description && <div className="text-xs text-gray-400">{t.description}</div>}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Crown size={11} className="text-amber-500" /> {t.leader_name || '不明'}
                      </span>
                      <span className="text-xs text-gray-500">{t.member_count}人</span>
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t.invite_code}</span>
                      <span className="text-xs text-gray-400">{t.created_at?.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── メインページ ───────────────────────────────────────────
const TABS = [
  { id: 'users', label: 'ユーザー管理', icon: Users },
  { id: 'stats', label: 'アプリ統計', icon: BarChart2 },
  { id: 'teams', label: 'チーム管理', icon: Users2 },
]

export default function AdminPage() {
  const { profile, isAdmin } = useAuth()
  const [tab, setTab] = useState('users')

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">読み込み中...</div>
    )
  }

  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">管理者パネル</h1>
          <p className="text-xs text-gray-400">アプリ全体の管理・統計</p>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === id
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'teams' && <TeamsAdminTab />}
    </div>
  )
}
