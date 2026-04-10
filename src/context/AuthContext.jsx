import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateProfile(displayName) {
    const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id)
    if (error) throw error
    setProfile(p => ({ ...p, display_name: displayName }))
  }

  async function deleteAccount() {
    if (!user) return
    // ユーザーの全データを削除（RLSにより自分のデータのみ）
    const tables = [
      'hunting_catches', 'hunting_sightings', 'hunting_records',
      'shooting_records', 'team_members', 'firearms',
      'ammo_inventory', 'ammo_ledger', 'licenses',
      'hunting_registrations', 'permit_books', 'hunting_grounds', 'shooting_ranges',
    ]
    for (const table of tables) {
      await supabase.from(table).delete().eq('user_id', user.id)
    }
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.auth.signOut()
  }

  const isAdmin = profile?.is_admin === true

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, signUp, signIn, signOut, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
