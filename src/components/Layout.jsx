import { NavLink, useLocation } from 'react-router-dom'
import {
  Target, TreePine, Package, FileCheck, LayoutDashboard,
  BarChart2, MapPin, Settings, Menu, X, LogOut, Users2, Shield, Crosshair, FileText,
  ChevronDown, ChevronRight, Folder
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

function useNavStructure() {
  const { isAdmin } = useAuth()
  return useMemo(() => {
    const structure = [
      { type: 'link', to: '/', icon: LayoutDashboard, label: 'ダッシュボード' },
      {
        type: 'group', key: 'shooting', icon: Target, label: '射撃',
        defaultOpen: true,
        routes: ['/shooting', '/ranges'],
        children: [
          { to: '/shooting', icon: Target,    label: '射撃記録' },
          { to: '/ranges',   icon: Crosshair, label: '射撃場管理' },
        ],
      },
      {
        type: 'group', key: 'hunting', icon: TreePine, label: '狩猟',
        defaultOpen: true,
        routes: ['/hunting', '/grounds', '/teams'],
        children: [
          { to: '/hunting', icon: TreePine, label: '狩猟記録' },
          { to: '/grounds', icon: MapPin,   label: '猟場管理' },
          { to: '/teams',   icon: Users2,   label: '猟隊管理' },
        ],
      },
      {
        type: 'group', key: 'other', icon: Folder, label: 'その他',
        routes: ['/ammo', '/licenses', '/forms'],
        children: [
          { to: '/ammo',     icon: Package,   label: '実包管理' },
          { to: '/licenses', icon: FileCheck,  label: '免許・許可証' },
          { to: '/forms',    icon: FileText,   label: '申請様式作成' },
        ],
      },
      { type: 'link', to: '/stats',    icon: BarChart2, label: '統計・分析' },
      { type: 'link', to: '/settings', icon: Settings,  label: '設定' },
    ]
    if (isAdmin) structure.push({ type: 'link', to: '/admin', icon: Shield, label: '管理者', admin: true })
    return structure
  }, [isAdmin])
}

// ── ナビリンク（単体） ───────────────────────────
function NavItem({ to, icon: Icon, label, admin, onClick, mobile }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 ${mobile ? 'px-4 py-3 text-base' : 'px-3 py-2.5 text-sm'} rounded-lg mb-0.5 transition-all ${
          isActive
            ? admin
              ? 'bg-red-500/20 border-l-2 border-red-400 text-red-300 font-semibold pl-[10px]'
              : 'bg-emerald-500/15 border-l-2 border-emerald-400 text-emerald-300 font-semibold pl-[10px]'
            : admin
              ? 'text-red-400/80 hover:bg-white/5 hover:text-red-300'
              : 'text-stone-400 hover:bg-white/8 hover:text-stone-200'
        }`
      }
    >
      <Icon size={mobile ? 19 : 16} className="shrink-0" />
      {label}
    </NavLink>
  )
}

// ── ナビグループ（折りたたみ） ───────────────────
function NavGroup({ item, mobile, onClick }) {
  const location = useLocation()
  const isChildActive = item.routes.some(r => location.pathname === r)
  const [open, setOpen] = useState(isChildActive || !!item.defaultOpen)

  // パスが変わったら自動展開
  useEffect(() => {
    if (isChildActive) setOpen(true)
  }, [isChildActive])

  const Icon = item.icon
  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 ${mobile ? 'px-4 py-3 text-base' : 'px-3 py-2.5 text-sm'} rounded-lg transition-all ${
          isChildActive
            ? 'text-emerald-300 font-semibold'
            : 'text-stone-400 hover:bg-white/8 hover:text-stone-200'
        }`}
      >
        <Icon size={mobile ? 19 : 16} className="shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open
          ? <ChevronDown size={mobile ? 16 : 13} className="text-stone-500" />
          : <ChevronRight size={mobile ? 16 : 13} className="text-stone-500" />
        }
      </button>
      {open && (
        <div className={mobile ? 'pl-4' : 'pl-3'}>
          {item.children.map(child => (
            <NavItem key={child.to} {...child} onClick={onClick} mobile={mobile} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── レイアウト ────────────────────────────────────
export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navStructure = useNavStructure()

  const initial = (profile?.display_name || '?')[0].toUpperCase()

  return (
    <div className="flex h-screen bg-stone-100">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex flex-col w-60 shrink-0"
        style={{ background: 'linear-gradient(180deg, #1a2e0a 0%, #2d3b1a 60%, #1f2d12 100%)' }}>

        {/* ロゴエリア */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
              <Target size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">狩りメモ</div>
              <div className="text-emerald-400/60 text-xs leading-tight">狩猟・射撃管理</div>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 py-4 overflow-y-auto px-2">
          {navStructure.map(item =>
            item.type === 'group'
              ? <NavGroup key={item.key} item={item} />
              : <NavItem key={item.to} {...item} />
          )}
        </nav>

        {/* ユーザーセクション */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ring-2 ring-emerald-500/60"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{profile?.display_name || 'ユーザー'}</div>
              {profile?.is_admin
                ? <div className="text-xs text-red-400 font-medium">管理者</div>
                : <div className="text-xs text-stone-500">ハンター</div>
              }
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-500 hover:text-stone-200 hover:bg-white/5 rounded-lg transition-colors">
            <LogOut size={13} /> ログアウト
          </button>
          <div className="mt-3 text-center">
            <span className="text-stone-600 text-xs">v5.0.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 text-white flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(135deg, #1a2e0a 0%, #2d3b1a 100%)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
            <Target size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">狩りメモ</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-stone-300 hover:text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 text-white pt-14 overflow-y-auto"
          style={{ background: 'linear-gradient(180deg, #1a2e0a 0%, #2d3b1a 100%)' }}>
          <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ring-2 ring-emerald-500/60"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
              {initial}
            </div>
            <div>
              <div className="text-sm font-semibold">{profile?.display_name || 'ユーザー'}</div>
              {profile?.is_admin
                ? <div className="text-xs text-red-400">管理者</div>
                : <div className="text-xs text-stone-500">ハンター</div>
              }
            </div>
          </div>
          <nav className="px-2 py-3">
            {navStructure.map(item =>
              item.type === 'group'
                ? <NavGroup key={item.key} item={item} mobile onClick={() => setMobileOpen(false)} />
                : <NavItem key={item.to} {...item} mobile onClick={() => setMobileOpen(false)} />
            )}
          </nav>
          <div className="px-6 py-3 border-t border-white/10">
            <button onClick={signOut} className="flex items-center gap-3 py-2 text-stone-400 hover:text-white transition-colors text-sm">
              <LogOut size={16} /> ログアウト
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14 bg-stone-100">
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
