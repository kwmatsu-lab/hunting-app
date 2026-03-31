-- =====================================================
-- Schema v6: 射撃場・実包管理帳簿・目撃記録テーブル追加
-- ★ v1〜v5 を適用済みの環境で実行してください
-- =====================================================

-- ── 射撃場テーブル ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shooting_ranges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  prefecture text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.shooting_ranges ENABLE ROW LEVEL SECURITY;

-- 自分の射撃場を管理
CREATE POLICY "自分の射撃場管理" ON public.shooting_ranges
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 認証済みユーザーは全射撃場を閲覧可（記録フォームで選択するため）
CREATE POLICY "認証済みユーザーが射撃場閲覧" ON public.shooting_ranges
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ── 実包管理帳簿テーブル ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ammo_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ammo_inventory_id uuid REFERENCES public.ammo_inventory(id) ON DELETE SET NULL,
  date date NOT NULL,
  event_type text NOT NULL,        -- '購入' | '射撃練習' | '狩猟使用' | '廃棄' | '譲渡' | '調整' | 'その他'
  description text,
  received integer NOT NULL DEFAULT 0,
  paid_out integer NOT NULL DEFAULT 0,
  balance integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ammo_ledger ENABLE ROW LEVEL SECURITY;

-- 自分の帳簿のみ操作可
CREATE POLICY "自分の帳簿管理" ON public.ammo_ledger
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 目撃記録テーブル ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hunting_sightings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hunting_record_id uuid REFERENCES public.hunting_records(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  sighting_time text,
  location_notes text,
  sighting_lat numeric,
  sighting_lng numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hunting_sightings ENABLE ROW LEVEL SECURITY;

-- 自分または所属チームの狩猟記録に紐づく目撃記録を管理
CREATE POLICY "自分の目撃記録管理" ON public.hunting_sightings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 同じ猟隊メンバーはチームの目撃記録を閲覧可
CREATE POLICY "チームの目撃記録閲覧" ON public.hunting_sightings
  FOR SELECT USING (
    hunting_record_id IN (
      SELECT hr.id FROM public.hunting_records hr
      WHERE hr.user_id = auth.uid()
         OR hr.team_id IN (
           SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
         )
    )
  );


-- ── shooting_records に score_detail・discipline カラム追加 ──
-- (v1〜v4 では未追加の場合に備えて)
ALTER TABLE public.shooting_records
  ADD COLUMN IF NOT EXISTS discipline text,
  ADD COLUMN IF NOT EXISTS score_detail jsonb;

-- ── hunting_records に追加カラム ──────────────────────────
ALTER TABLE public.hunting_records
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.hunting_teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS departure_time text,
  ADD COLUMN IF NOT EXISTS return_time text,
  ADD COLUMN IF NOT EXISTS temperature_min numeric,
  ADD COLUMN IF NOT EXISTS temperature_max numeric,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

-- ── hunting_grounds に位置カラム追加 ─────────────────────
ALTER TABLE public.hunting_grounds
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;


-- =====================================================
-- RLSポリシーの強化（v1 の「統計用」ポリシーを認証済み限定に変更）
-- =====================================================

-- shooting_records の公開閲覧ポリシーを認証必須に変更
DROP POLICY IF EXISTS "統計用: 全員の射撃記録閲覧" ON public.shooting_records;
CREATE POLICY "認証済みユーザーが射撃記録閲覧" ON public.shooting_records
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- hunting_records の公開閲覧ポリシーを認証必須に変更
DROP POLICY IF EXISTS "統計用: 全員の狩猟記録閲覧" ON public.hunting_records;
CREATE POLICY "認証済みユーザーが狩猟記録閲覧" ON public.hunting_records
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- hunting_grounds の公開閲覧ポリシーを認証必須に変更
DROP POLICY IF EXISTS "統計用: 全猟場閲覧" ON public.hunting_grounds;
CREATE POLICY "認証済みユーザーが猟場閲覧" ON public.hunting_grounds
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- hunting_catches の公開閲覧ポリシーを認証必須に変更
DROP POLICY IF EXISTS "統計用: 捕獲記録閲覧" ON public.hunting_catches;
CREATE POLICY "認証済みユーザーが捕獲記録閲覧" ON public.hunting_catches
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- profiles の全閲覧ポリシー（表示名取得用、認証必須に変更）
DROP POLICY IF EXISTS "全ユーザーのプロフィール閲覧（名前のみ）" ON public.profiles;
CREATE POLICY "認証済みユーザーがプロフィール閲覧" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
