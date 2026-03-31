import { useState } from 'react'
import { Target, Zap, Crown, Leaf, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isDemoMode } from '../lib/supabase'

// デモアカウント一覧
const DEMO_ACCOUNTS = [
  { email: 'tanaka@demo.com', password: 'demo1234', name: '田中 太郎', role: '管理者', icon: Crown, color: 'text-red-500', bg: 'bg-red-50 border-red-200 hover:bg-red-100' },
  { email: 'yamada@demo.com', password: 'demo1234', name: '山田 花子', role: '一般ユーザー', icon: Leaf, color: 'text-green-600', bg: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { email: 'suzuki@demo.com', password: 'demo1234', name: '鈴木 一郎', role: '一般ユーザー', icon: User, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
]

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
      } else {
        if (!form.displayName.trim()) { setError('表示名を入力してください'); setLoading(false); return }
        await signUp(form.email, form.password, form.displayName)
      }
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials' ? 'メールアドレスまたはパスワードが正しくありません' :
        err.message === 'User already registered'   ? 'このメールアドレスはすでに登録されています' :
        err.message
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleDemoLogin(account) {
    setDemoLoading(account.email)
    setError('')
    try {
      await signIn(account.email, account.password)
    } catch (err) {
      setError(err.message)
    } finally {
      setDemoLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4">
            <Target className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">狩猟・射撃管理</h1>
          <p className="text-gray-400 text-sm mt-1">チームで記録・分析</p>
          {isDemoMode && (
            <span className="inline-block mt-2 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
              デモモード動作中
            </span>
          )}
        </div>

        {/* デモクイックログイン */}
        {isDemoMode && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Zap size={11} className="text-amber-400" /> デモアカウントで体験
              </span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => {
                const Icon = acc.icon
                const isLoading = demoLoading === acc.email
                return (
                  <button
                    key={acc.email}
                    onClick={() => handleDemoLogin(acc)}
                    disabled={!!demoLoading || loading}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${acc.bg} disabled:opacity-60`}>
                    <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0`}>
                      <Icon size={16} className={acc.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">{acc.name}</div>
                      <div className="text-xs text-gray-500">{acc.role} — {acc.email}</div>
                    </div>
                    {isLoading && (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 通常ログインフォーム */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === m ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                {m === 'login' ? 'ログイン' : '新規登録'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="text-xs text-gray-500 font-medium">表示名</span>
                <input type="text" required value={form.displayName} onChange={e => set('displayName', e.target.value)}
                  placeholder="山田 太郎"
                  className="mt-1 w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </label>
            )}
            <label className="block">
              <span className="text-xs text-gray-500 font-medium">メールアドレス</span>
              <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="example@email.com"
                className="mt-1 w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 font-medium">パスワード</span>
              <input type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="6文字以上"
                className="mt-1 w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">{error}</div>
            )}

            <button type="submit" disabled={loading || !!demoLoading}
              className="w-full bg-amber-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors mt-2">
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウント作成'}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="text-xs text-gray-400 text-center mt-4">
              {isDemoMode ? 'デモモードでは確認メールは送信されません' : '登録後、確認メールが届く場合があります'}
            </p>
          )}
        </div>

        {isDemoMode && (
          <p className="text-center text-xs text-gray-500 mt-4">
            デモモード：データはブラウザのセッション内のみに保存されます
          </p>
        )}
      </div>
    </div>
  )
}
