import { useState } from 'react'
import { Target, Zap, Leaf, User, MapPin, Users, FileText, Camera, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isDemoMode } from '../lib/supabase'

const DEMO_ACCOUNTS = [
  { email: 'yamada@demo.com', password: 'demo1234', name: '山田 花子', role: '一般ユーザー', icon: Leaf, color: 'text-green-600', bg: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { email: 'suzuki@demo.com', password: 'demo1234', name: '鈴木 一郎', role: '一般ユーザー', icon: User, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
]

const FEATURES = [
  { icon: MapPin, color: 'bg-green-500', title: '狩猟記録', desc: '猟場・獲物・気温などを詳細に記録。チームと自動共有。' },
  { icon: Users, color: 'bg-blue-500', title: 'チーム管理', desc: 'メンバーを招待してリアルタイムで記録を共有・閲覧。' },
  { icon: FileText, color: 'bg-purple-500', title: '免許・許可証管理', desc: '狩猟免許・銃所持許可証の有効期限を一元管理。' },
  { icon: Camera, color: 'bg-amber-500', title: 'AI射撃分析', desc: '標的写真をAIが自動解析。スコアとグルーピングを記録。' },
]

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(null)
  const [showDemo, setShowDemo] = useState(false)

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
      setDemoLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col lg:flex-row">
      {/* 左パネル：アプリ紹介 */}
      <div className="lg:flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 lg:py-16">
        {/* ロゴ */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <Target className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">狩猟・射撃管理</h1>
            <p className="text-gray-400 text-xs">チームで記録・分析するアプリ</p>
          </div>
        </div>

        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3 leading-snug">
          狩猟をもっと<br />スマートに管理する
        </h2>
        <p className="text-gray-400 text-sm mb-10 leading-relaxed max-w-md">
          狩猟記録・チーム管理・免許証の有効期限・射撃記録まで、
          すべてをひとつのアプリで。AI解析で記録の手間を最小限に。
        </p>

        {/* 機能一覧 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} className="flex items-start gap-3">
                <div className={`w-8 h-8 ${f.color} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{f.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        {isDemoMode && (
          <div className="mt-8 inline-flex items-center gap-2 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-full w-fit">
            <Zap size={11} />
            デモモード動作中
          </div>
        )}
      </div>

      {/* 右パネル：ログインフォーム */}
      <div className="lg:w-[420px] flex flex-col justify-center px-6 py-8 lg:px-10 lg:py-16 lg:bg-gray-800/50">
        <div className="w-full max-w-sm mx-auto">

          {/* デモ体験セクション */}
          <div className="mb-5 bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <button
              onClick={() => setShowDemo(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-amber-400" />
                <span className="text-sm font-semibold text-white">デモアカウントで体験する</span>
              </div>
              <ChevronRight size={16} className={`text-gray-400 transition-transform ${showDemo ? 'rotate-90' : ''}`} />
            </button>

            {showDemo && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs text-gray-400 mb-3">
                  登録不要で今すぐ体験。デモデータが入った状態でアプリの全機能を確認できます。
                </p>
                {DEMO_ACCOUNTS.map(acc => {
                  const Icon = acc.icon
                  const isLoading = demoLoading === acc.email
                  return (
                    <button
                      key={acc.email}
                      onClick={() => handleDemoLogin(acc)}
                      disabled={!!demoLoading || loading}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${acc.bg} disabled:opacity-60`}>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                        <Icon size={15} className={acc.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800">{acc.name}</div>
                        <div className="text-xs text-gray-500">{acc.role}</div>
                      </div>
                      {isLoading
                        ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin shrink-0" />
                        : <ChevronRight size={14} className="text-gray-400 shrink-0" />
                      }
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ログイン / 新規登録フォーム */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              {['login', 'signup'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError('') }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === m ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
                  {m === 'login' ? 'ログイン' : '新規登録'}
                </button>
              ))}
            </div>

            {mode === 'signup' && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                無料で全機能が利用できます。チームを作成してメンバーを招待しましょう。
              </div>
            )}

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
                {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウントを作成（無料）'}
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
    </div>
  )
}
