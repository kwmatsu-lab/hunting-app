import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function useTable(table, mapTo, mapFrom) {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) console.error(`[DEBUG] ${table} fetch error:`, error.message, error.code, error.details)
    else setRecords((data || []).map(mapTo))
    setLoading(false)
  }, [user, table])

  useEffect(() => { fetch() }, [fetch])

  const add = useCallback(async (record) => {
    const { data, error } = await supabase
      .from(table)
      .insert({ ...mapFrom(record), user_id: user.id })
      .select().single()
    if (error) throw error
    const mapped = mapTo(data)
    setRecords(prev => [mapped, ...prev])
    return mapped
  }, [user, table])

  const update = useCallback(async (id, record) => {
    const { error } = await supabase.from(table).update(mapFrom(record)).eq('id', id)
    if (error) throw error
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...record, id } : r))
  }, [table])

  const remove = useCallback(async (id) => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error) setRecords(prev => prev.filter(r => r.id !== id))
  }, [table])

  return { records, loading, add, update, remove, refresh: fetch }
}

// ── 猟場 ──────────────────────────────────────────────────
const groundTo = r => ({
  id: r.id, name: r.name, prefecture: r.prefecture, address: r.address,
  areaHa: r.area_ha, terrain: r.terrain, notes: r.notes, userId: r.user_id,
  latitude: r.latitude, longitude: r.longitude, createdAt: r.created_at
})
const groundFrom = r => ({
  name: r.name, prefecture: r.prefecture, address: r.address,
  area_ha: r.areaHa ? Number(r.areaHa) : null, terrain: r.terrain, notes: r.notes,
  latitude: r.latitude ? Number(r.latitude) : null,
  longitude: r.longitude ? Number(r.longitude) : null,
})

export function useHuntingGrounds() {
  return useTable('hunting_grounds', groundTo, groundFrom)
}

// ── 射撃場 ─────────────────────────────────────────────────
const rangeTo = r => ({
  id: r.id, name: r.name, prefecture: r.prefecture,
  address: r.address, notes: r.notes, userId: r.user_id,
})
const rangeFrom = r => ({
  name: r.name, prefecture: r.prefecture, address: r.address, notes: r.notes,
})
export function useShootingRanges() {
  return useTable('shooting_ranges', rangeTo, rangeFrom)
}

// ── 射撃記録 ───────────────────────────────────────────────
const shootingTo = r => ({
  id: r.id, date: r.date,
  rangeId: r.range_id || null,
  rangeName: r.shooting_ranges?.name || null,
  location: r.location, firearm: r.firearm,
  firearmId: r.firearm_id || null,
  firearmName: r.firearms?.name || null,
  caliber: r.caliber,
  discipline: r.discipline || null,
  scoreDetail: r.score_detail || null,
  score: r.score != null ? Number(r.score) : null,
  rounds: r.rounds, notes: r.notes, userId: r.user_id,
  ammoInventoryId: r.ammo_inventory_id, ammoName: r.ammo_name,
  targetPhotoUrl: r.target_photo_url,
})
const shootingFrom = r => ({
  date: r.date,
  range_id: r.rangeId || null,
  location: r.location || null,
  firearm: r.firearm || null,
  firearm_id: r.firearmId || null,
  caliber: r.caliber || null,
  discipline: r.discipline || null,
  score_detail: r.scoreDetail || null,
  score: r.score != null ? Number(r.score) : null,
  rounds: r.rounds ? Number(r.rounds) : null,
  notes: r.notes,
  ammo_inventory_id: r.ammoInventoryId || null,
  ammo_name: r.ammoName || null,
  target_photo_url: r.targetPhotoUrl || null,
})

export function useShootingRecords() {
  return useTable('shooting_records', shootingTo, shootingFrom)
}

// ── 狩猟記録 ───────────────────────────────────────────────
const huntingTo = r => ({
  id: r.id, date: r.date, location: r.location, prefecture: r.prefecture,
  game: r.game, count: r.count, method: r.method, ammoUsed: r.ammo_used,
  weather: r.weather, notes: r.notes, userId: r.user_id,
  groundId: r.ground_id,
  groundName: r.hunting_grounds?.name || null,
  roundsFired: r.rounds_fired,
  ammoInventoryId: r.ammo_inventory_id,
  ammoName: r.ammo_name,
  departureTime: r.departure_time,
  returnTime: r.return_time,
  temperatureMin: r.temperature_min ?? null,
  temperatureMax: r.temperature_max ?? null,
  // チーム連携
  teamId: r.team_id || null,
  teamName: r.hunting_teams?.name || null,
  ownerName: r.profiles?.display_name || null,
  // 銃器連携
  firearmId: r.firearm_id || null,
  firearmName: r.firearms?.name || null,
  // 地図座標
  latitude: r.latitude ?? null,
  longitude: r.longitude ?? null,
})
const huntingFrom = r => ({
  date: r.date, location: r.location, prefecture: r.prefecture,
  game: r.game, count: r.count ? Number(r.count) : 0,
  method: r.method, ammo_used: r.ammoUsed, weather: r.weather, notes: r.notes,
  ground_id: r.groundId || null,
  rounds_fired: r.roundsFired ? Number(r.roundsFired) : null,
  ammo_inventory_id: r.ammoInventoryId || null,
  ammo_name: r.ammoName || null,
  departure_time: r.departureTime || null,
  return_time: r.returnTime || null,
  temperature_min: r.temperatureMin != null && r.temperatureMin !== '' ? Number(r.temperatureMin) : null,
  temperature_max: r.temperatureMax != null && r.temperatureMax !== '' ? Number(r.temperatureMax) : null,
  team_id: r.teamId || null,
  firearm_id: r.firearmId || null,
  latitude: r.latitude != null ? Number(r.latitude) : null,
  longitude: r.longitude != null ? Number(r.longitude) : null,
})

export function useHuntingRecords() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // チーム記録も含めて取得（RLS が権限を制御）
    const { data, error } = await supabase
      .from('hunting_records')
      .select('*, hunting_grounds(name)')
      .order('date', { ascending: false })
    if (error) console.error('[DEBUG] hunting_records fetch error:', error.message, error.code, error.details)
    else setRecords((data || []).map(huntingTo))
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = useCallback(async (record) => {
    const { data, error } = await supabase
      .from('hunting_records')
      .insert({ ...huntingFrom(record), user_id: user.id })
      .select('*, hunting_grounds(name)').single()
    if (error) throw error
    const mapped = huntingTo(data)
    setRecords(prev => [mapped, ...prev])
    return mapped
  }, [user])

  const update = useCallback(async (id, record) => {
    const { data, error } = await supabase
      .from('hunting_records')
      .update(huntingFrom(record))
      .eq('id', id)
      .select('*, hunting_grounds(name)').single()
    if (error) throw error
    setRecords(prev => prev.map(r => r.id === id ? huntingTo(data) : r))
  }, [])

  const remove = useCallback(async (id) => {
    const { error } = await supabase.from('hunting_records').delete().eq('id', id)
    if (!error) setRecords(prev => prev.filter(r => r.id !== id))
  }, [])

  // チームメンバーに記録を自動連携（作成者以外のメンバー全員に同一の猟行記録を作成）
  const syncToTeam = useCallback(async (record, memberUserIds) => {
    const base = {
      ...huntingFrom(record),
      rounds_fired: null,
      ammo_inventory_id: null,
      ammo_name: null,
      firearm_id: null,
    }
    for (const memberId of memberUserIds) {
      const { data, error } = await supabase
        .from('hunting_records')
        .insert({ ...base, user_id: memberId })
        .select('*, hunting_grounds(name)')
        .single()
      if (!error && data) setRecords(prev => [...prev, huntingTo(data)])
    }
  }, [])

  return { records, loading, add, update, remove, syncToTeam, refresh: fetch }
}

// ── 弾薬・装備 ─────────────────────────────────────────────
const ammoTo = r => ({
  id: r.id, name: r.name, caliber: r.caliber, type: r.type,
  quantity: r.quantity, minQuantity: r.min_quantity, brand: r.brand,
  notes: r.notes, userId: r.user_id
})
const ammoFrom = r => ({
  name: r.name, caliber: r.caliber, type: r.type,
  quantity: r.quantity ? Number(r.quantity) : 0,
  min_quantity: r.minQuantity ? Number(r.minQuantity) : 0,
  brand: r.brand, notes: r.notes
})

export function useAmmoInventory() {
  const base = useTable('ammo_inventory', ammoTo, ammoFrom)

  const deduct = useCallback(async (id, rounds) => {
    const item = base.records.find(r => r.id === id)
    if (!item) return
    const newQty = Math.max(0, Number(item.quantity) - Number(rounds))
    await base.update(id, { ...item, quantity: newQty })
  }, [base.records, base.update])

  return { ...base, items: base.records, deduct }
}

// ── 実包管理帳簿 ───────────────────────────────────────────
const ledgerTo = r => ({
  id: r.id,
  ammoInventoryId: r.ammo_inventory_id,
  userId: r.user_id,
  date: r.date,
  eventType: r.event_type,
  description: r.description,
  received: r.received ?? 0,
  paidOut: r.paid_out ?? 0,
  balance: r.balance ?? 0,
  notes: r.notes,
  createdAt: r.created_at,
})
const ledgerFrom = r => ({
  ammo_inventory_id: r.ammoInventoryId,
  date: r.date,
  event_type: r.eventType,
  description: r.description || null,
  received: r.received != null ? Number(r.received) : 0,
  paid_out: r.paidOut != null ? Number(r.paidOut) : 0,
  balance: r.balance != null ? Number(r.balance) : 0,
  notes: r.notes || null,
})

export function useAmmoLedger() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('ammo_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
    if (!error) setEntries((data || []).map(ledgerTo))
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = useCallback(async (entry) => {
    const { data, error } = await supabase
      .from('ammo_ledger')
      .insert({ ...ledgerFrom(entry), user_id: user.id })
      .select().single()
    if (error) throw error
    const mapped = ledgerTo(data)
    setEntries(prev => [...prev, mapped].sort((a, b) => a.date.localeCompare(b.date)))
    return mapped
  }, [user])

  const remove = useCallback(async (id) => {
    const { error } = await supabase.from('ammo_ledger').delete().eq('id', id)
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  return { entries, loading, add, remove, refresh: fetch }
}

// ── 免許・許可証 ───────────────────────────────────────────
const licenseTo = r => ({
  id: r.id, name: r.name, licenseNumber: r.license_number,
  issuedDate: r.issued_date, expiryDate: r.expiry_date,
  issuer: r.issuer, notes: r.notes, userId: r.user_id
})
const licenseFrom = r => ({
  name: r.name, license_number: r.licenseNumber,
  issued_date: r.issuedDate || null, expiry_date: r.expiryDate,
  issuer: r.issuer, notes: r.notes
})

export function useLicenses() {
  return useTable('licenses', licenseTo, licenseFrom)
}

// ── 猟隊 ──────────────────────────────────────────────────
export function useHuntingTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTeams = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id, role, hunting_teams(id, name, description, invite_code, created_by, created_at)')
      .eq('user_id', user.id)
    if (error) console.error('[DEBUG] team_members fetch error:', error.message, error.code, error.details)
    setTeams((data || []).map(r => ({
      id: r.hunting_teams?.id,
      name: r.hunting_teams?.name,
      description: r.hunting_teams?.description,
      inviteCode: r.hunting_teams?.invite_code,
      createdBy: r.hunting_teams?.created_by,
      createdAt: r.hunting_teams?.created_at,
      role: r.role,
      isLeader: r.role === 'leader',
    })).filter(t => t.id))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  const createTeam = useCallback(async ({ name, description }) => {
    const { data: team, error } = await supabase
      .from('hunting_teams')
      .insert({ name, description, created_by: user.id })
      .select().single()
    if (error) throw error
    await supabase.from('team_members').insert({ team_id: team.id, user_id: user.id, role: 'leader' })
    await fetchTeams()
    return team
  }, [user, fetchTeams])

  const joinTeam = useCallback(async (inviteCode) => {
    const { data: team, error } = await supabase
      .from('hunting_teams')
      .select('id, name')
      .eq('invite_code', inviteCode)
      .single()
    if (error || !team) throw new Error('招待コードが見つかりません')
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, user_id: user.id, role: 'member' })
    if (memberError) {
      if (memberError.code === '23505') throw new Error('すでにチームに参加しています')
      throw memberError
    }
    await fetchTeams()
    return team
  }, [user, fetchTeams])

  const leaveTeam = useCallback(async (teamId) => {
    await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', user.id)
    setTeams(prev => prev.filter(t => t.id !== teamId))
  }, [user])

  const deleteTeam = useCallback(async (teamId) => {
    await supabase.from('hunting_teams').delete().eq('id', teamId)
    setTeams(prev => prev.filter(t => t.id !== teamId))
  }, [])

  return { teams, loading, createTeam, joinTeam, leaveTeam, deleteTeam, refresh: fetchTeams }
}

// ── 銃管理 ─────────────────────────────────────────────────
const firearmTo = r => ({
  id: r.id, name: r.name, type: r.type, manufacturer: r.manufacturer,
  model: r.model, serialNumber: r.serial_number, caliber: r.caliber,
  mechanism: r.mechanism,
  purpose: r.purpose || '',
  originalPermitDate: r.original_permit_date,
  originalPermitNumber: r.original_permit_number,
  permitDate: r.permit_date,
  permitNumber: r.permit_number,
  permitValidityText: r.permit_validity_text,
  renewalFrom: r.renewal_from,
  renewalTo: r.renewal_to,
  alternateBars: r.alternate_barrels || [],
  notes: r.notes, userId: r.user_id
})
const firearmFrom = r => ({
  name: r.name, type: r.type, manufacturer: r.manufacturer, model: r.model,
  serial_number: r.serialNumber, caliber: r.caliber,
  mechanism: r.mechanism,
  purpose: r.purpose || null,
  original_permit_date: r.originalPermitDate || null,
  original_permit_number: r.originalPermitNumber,
  permit_date: r.permitDate || null,
  permit_number: r.permitNumber,
  permit_validity_text: r.permitValidityText,
  renewal_from: r.renewalFrom || null,
  renewal_to: r.renewalTo || null,
  alternate_barrels: r.alternateBars?.length ? r.alternateBars : [],
  notes: r.notes
})
export function useFirearms() {
  return useTable('firearms', firearmTo, firearmFrom)
}

// ── 所持許可証 ─────────────────────────────────────────────────
const permitBookTo = r => ({
  id: r.id, bookNumber: r.book_number,
  originalIssueDate: r.original_issue_date,
  issueDate: r.issue_date, userId: r.user_id
})
const permitBookFrom = r => ({
  book_number: r.bookNumber,
  original_issue_date: r.originalIssueDate || null,
  issue_date: r.issueDate || null,
})
export function usePermitBooks() {
  return useTable('permit_books', permitBookTo, permitBookFrom)
}

// ── 狩猟登録 ───────────────────────────────────────────────
const regTo = r => ({
  id: r.id, seasonYear: r.season_year, prefecture: r.prefecture,
  licenseType: r.license_type, registrationNumber: r.registration_number,
  validFrom: r.valid_from, validTo: r.valid_to, feePaid: r.fee_paid,
  notes: r.notes, userId: r.user_id
})
const regFrom = r => ({
  season_year: r.seasonYear ? Number(r.seasonYear) : null,
  prefecture: r.prefecture, license_type: r.licenseType,
  registration_number: r.registrationNumber, valid_from: r.validFrom,
  valid_to: r.validTo, fee_paid: r.feePaid ? Number(r.feePaid) : null, notes: r.notes
})
export function useHuntingRegistrations() {
  return useTable('hunting_registrations', regTo, regFrom)
}

// ── チームメンバー ─────────────────────────────────────────
export function useTeamMembers(teamId) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchMembers = useCallback(async () => {
    if (!teamId) { setMembers([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('team_members')
      .select('id, role, user_id, profiles(id, display_name)')
      .eq('team_id', teamId)
    setMembers((data || []).map(m => ({
      id: m.id,
      userId: m.user_id,
      role: m.role,
      displayName: m.profiles?.display_name || '不明',
      isLeader: m.role === 'leader',
    })))
    setLoading(false)
  }, [teamId])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const removeMember = useCallback(async (memberId) => {
    const { error } = await supabase.from('team_members').delete().eq('id', memberId)
    if (error) throw error
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }, [])

  return { members, loading, refresh: fetchMembers, removeMember }
}
