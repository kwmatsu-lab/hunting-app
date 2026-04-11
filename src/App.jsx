import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import ShootingRecords from './pages/ShootingRecords'
import ShootingRanges from './pages/ShootingRanges'
import HuntingRecords from './pages/HuntingRecords'
import AmmoInventory from './pages/AmmoInventory'
import Licenses from './pages/Licenses'
import Statistics from './pages/Statistics'
import HuntingGrounds from './pages/HuntingGrounds'
import Settings from './pages/Settings'
import FormGenerator from './pages/FormGenerator'
import Teams from './pages/Teams'
import AdminPage from './pages/AdminPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import './index.css'

function AppRoutes() {
  const { user } = useAuth()

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<Dashboard />} />
        <Route path="/shooting" element={<ShootingRecords />} />
        <Route path="/ranges"   element={<ShootingRanges />} />
        <Route path="/hunting"  element={<HuntingRecords />} />
        <Route path="/grounds"  element={<HuntingGrounds />} />
        <Route path="/teams"    element={<Teams />} />
        <Route path="/ammo"     element={<AmmoInventory />} />
        <Route path="/licenses" element={<Licenses />} />
        <Route path="/stats"    element={<Statistics />} />
        <Route path="/forms"    element={<FormGenerator />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin"    element={<AdminPage />} />
        <Route path="/privacy"  element={<PrivacyPolicy />} />
        <Route path="/terms"    element={<TermsOfService />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
