import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mockSupabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// URLがプレースホルダーの場合はデモモードを使用
const isDemoMode =
  !supabaseUrl ||
  supabaseUrl.includes('xxxxxxxx') ||
  supabaseUrl === 'undefined'

export const supabase = isDemoMode
  ? mockSupabase
  : createClient(supabaseUrl, supabaseAnonKey)

export { isDemoMode }
