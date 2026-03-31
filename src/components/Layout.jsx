import { NavLink } from 'react-router-dom'
import {
  Target, TreePine, Package, FileCheck, LayoutDashboard,
  BarChart2, MapPin, Settings, Menu, X, LogOut, Users2, Shield, Crosshair
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function useNavItems() {
  const { isAdmin } = useAuth()
  const base = [
    { to: '/',          icon: LayoutDashboard, label: 'ダッシュボード' },
    { to: '/shooting',  icon: Target,           label: '射撃記録' },
    { to: '/ranges',    icon: Crosshair,        label: '射撃場管理' },
    { to: '/hunting',   icon: TreePine,         label: '狩猟記録' },
    { to: '/grounds',   icon: MapPin,           label: '猟場管理' },
    { to: '/teams',     icon: Users2,           label: '猟隊管理' },
    { to: '/ammo',      icon: Package,          label: '実包管理' },
    { to: '/licenses',  icon: FileCheck,        label: '免許・許可証' },
    { to: '/stats',     icon: BarChart2,        label: '統計・分析' },
    { to: '/settings',  icon: Settings,         label: '設定' },
  ]
  if (isAdmin) base.push({ to: '/admin', icon: Shield, label: '管理者', admin: true })
  return base
}

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navItems = useNavItems()

  const initial = (profile?.display_name || '?')[0].toUpperCase()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex flex-col w-60 shrink-0"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>

        {/* ロゴエリア */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <Target size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">狩猟・射撃</div>
              <div className="text-slate-400 text-xs leading-tight">管理アプリ</div>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 py-4 overflow-y-auto px-2">
          {navItems.map(({ to, icon: Icon, label, admin }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                  isActive
                    ? admin
                      ? 'bg-red-500/20 border-l-2 border-red-400 text-red-300 font-semibold pl-[10px]'
                      : 'bg-amber-500/15 border-l-2 border-amber-400 text-amber-300 font-semibold pl-[10px]'
                    : admin
                      ? 'text-red-400/80 hover:bg-white/5 hover:text-red-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ユーザーセクション */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-slate-900 shrink-0 ring-2 ring-amber-400/60"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{profile?.display_name || 'ユーザー'}</div>
              {profile?.is_admin
                ? <div className="text-xs text-red-400 font-medium">管理者</div>
                : <div className="text-xs text-slate-500">ハンター</div>
              }
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors">
            <LogOut size={13} /> ログアウト
          </button>
          <div className="mt-3 text-center">
            <span className="text-slate-600 text-xs">v5.0.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 text-white flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Target size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">狩猟・射撃管理</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-300 hover:text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 text-white pt-14 overflow-y-auto"
          style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 ring-2 ring-amber-400/60"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              {initial}
            </div>
            <div>
              <div className="text-sm font-semibold">{profile?.display_name || 'ユーザー'}</div>
              {profile?.is_admin
                ? <div className="text-xs text-red-400">管理者</div>
                : <div className="text-xs text-slate-500">ハンター</div>
              }
            </div>
          </div>
          <nav className="px-2 py-3">
            {navItems.map(({ to, icon: Icon, label, admin }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg mb-0.5 text-base transition-all ${
                    isActive
                      ? admin
                        ? 'bg-red-500/20 border-l-2 border-red-400 text-red-300 font-semibold pl-[14px]'
                        : 'bg-amber-500/15 border-l-2 border-amber-400 text-amber-300 font-semibold pl-[14px]'
                      : admin
                        ? 'text-red-400/80 hover:bg-white/5 hover:text-red-300'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="px-6 py-3 border-t border-white/10">
            <button onClick={signOut} className="flex items-center gap-3 py-2 text-slate-400 hover:text-white transition-colors text-sm">
              <LogOut size={16} /> ログアウト
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14 bg-gray-50">
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
