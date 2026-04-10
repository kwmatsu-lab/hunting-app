-- ================================================
-- 狩猟・射撃管理アプリ Supabase スキーマ（全バージョン統合版 v1〜v6）
-- Supabase の SQL Editor に貼り付けて実行してください
-- 依存関係の正しい順序で並べ、ALTER TABLE ADD COLUMN はすべて
-- CREATE TABLE 内に統合済みです。
-- ================================================


-- ============================================================
-- 1. profiles（依存なし）
--    v5: is_admin カラムを統合
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分のプロフィールのみ閲覧" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "自分のプロフィールのみ更新" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "プロフィール作成" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 認証済みユーザーがプロフィール（表示名）を閲覧可（v6でupgrade）
CREATE POLICY "認証済みユーザーがプロフィール閲覧" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ============================================================
-- 2. hunting_teams（depends on profiles）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hunting_teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  invite_code text UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hunting_teams ENABLE ROW LEVEL SECURITY;

-- "team leader can manage" のみここで作成（team_membersへの参照がないもの）
CREATE POLICY "team leader can manage" ON public.hunting_teams FOR ALL
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());


-- ============================================================
-- 3. team_members（depends on hunting_teams, profiles）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES public.hunting_teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can see team members" ON public.team_members FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE POLICY "leader can manage members" ON public.team_members FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND role = 'leader')
  OR user_id = auth.uid()
);
CREATE POLICY "self leave or leader remove" ON public.team_members FOR DELETE
  USING (user_id = auth.uid() OR
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND role = 'leader'));

-- team_members 作成後に hunting_teams のポリシーを追加
CREATE POLICY "team members can see team" ON public.hunting_teams FOR SELECT
  USING (id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));


-- ============================================================
-- 4. hunting_grounds（depends on auth.users）
--    v2: base table
--    v3 & v6: latitude / longitude を統合
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hunting_grounds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  prefecture text,
  address text,
  area_ha numeric,
  terrain text,       -- 山林 / 農地 / 河川 / 海岸 / 雑種地
  latitude numeric,
  longitude numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hunting_grounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の猟場管理" ON public.hunting_grounds FOR ALL USING (auth.uid() = user_id);
-- v6: 認証済みユーザーに限定（「統計用: 全猟場閲覧」の代替）
CREATE POLICY "認証済みユーザーが猟場閲覧" ON public.hunting_grounds
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ============================================================
-- 5. firearms（depends on profiles）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.firearms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('散弾銃', 'ライフル', '空気銃', 'その他')),
  manufacturer text,
  model text,
  serial_number text,
  caliber text,
  permit_number text,
  permit_expiry date,
  permit_issuer text,
  safe_storage text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.firearms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own firearms" ON public.firearms
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 6. hunting_records（depends on hunting_grounds, firearms, hunting_teams）
--    全バージョンのカラムをすべて統合:
--    v1: base columns
--    v2: ground_id, rounds_fired, ammo_inventory_id, ammo_name
--    v3: departure_time, return_time（temperature は v6 で temperature_min/max に置換）
--    v5: firearm_id
--    v6: team_id, temperature_min, temperature_max, latitude, longitude
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hunting_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES public.hunting_teams(id) ON DELETE SET NULL,
  date date NOT NULL,
  location text,
  prefecture text,
  game text,
  count numeric DEFAULT 0,
  method text,
  ammo_used text,
  weather text,
  notes text,
  ground_id uuid REFERENCES public.hunting_grounds(id) ON DELETE SET NULL,
  rounds_fired numeric,
  ammo_inventory_id uuid,
  ammo_name text,
  firearm_id uuid REFERENCES public.firearms(id) ON DELETE SET NULL,
  departure_time text,
  return_time text,
  temperature_min numeric,
  temperature_max numeric,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hunting_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の狩猟記録" ON public.hunting_records FOR ALL USING (auth.uid() = user_id);
-- v6: 認証済みユーザーに限定（「統計用: 全員の狩猟記録閲覧」の代替）
CREATE POLICY "認証済みユーザーが狩猟記録閲覧" ON public.hunting_records
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ============================================================
-- 7. hunting_catches（depends on hunting_records）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hunting_catches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hunting_record_id uuid REFERENCES public.hunting_records(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  catch_time text,
  game text,
  count integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hunting_catches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の捕獲記録管理" ON public.hunting_catches FOR ALL USING (auth.uid() = user_id);
-- v6: 認証済みユーザーに限定（「統計用: 捕獲記録閲覧」の代替）
CREATE POLICY "認証済みユーザーが捕獲記録閲覧" ON public.hunting_catches
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ============================================================
-- 8. hunting_sightings（depends on hunting_records, team_members）
--    NOTE: "チームの目撃記録閲覧" ポリシーは hr.team_id を参照するが、
--    hunting_records.team_id は上の CREATE TABLE で定義済みなので問題なし。
-- ============================================================
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

-- 同じ猟隊メンバーはチームの目撃記録を閲覧可（hr.team_id は上で定義済み）
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


-- ============================================================
-- 9. shooting_records（depends on auth.users）
--    v1: base columns
--    v4: ammo_inventory_id, ammo_name, target_photo_url
--    v6: discipline, score_detail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shooting_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  location text,
  firearm text,
  caliber text,
  distance numeric,
  score numeric,
  rounds numeric,
  ammo_inventory_id uuid,
  ammo_name text,
  target_photo_url text,
  discipline text,
  score_detail jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.shooting_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の射撃記録" ON public.shooting_records FOR ALL USING (auth.uid() = user_id);
-- v6: 認証済みユーザーに限定（「統計用: 全員の射撃記録閲覧」の代替）
CREATE POLICY "認証済みユーザーが射撃記録閲覧" ON public.shooting_records
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ============================================================
-- 10. ammo_inventory（depends on auth.users）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ammo_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  caliber text,
  type text,
  quantity numeric DEFAULT 0,
  min_quantity numeric DEFAULT 0,
  brand text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ammo_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の弾薬在庫" ON public.ammo_inventory FOR ALL USING (auth.uid() = user_id);


-- ============================================================
-- 11. ammo_ledger（depends on ammo_inventory, profiles）
-- ============================================================
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

CREATE POLICY "自分の帳簿管理" ON public.ammo_ledger
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 12. licenses（depends on auth.users）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  license_number text,
  issued_date date,
  expiry_date date NOT NULL,
  issuer text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の免許" ON public.licenses FOR ALL USING (auth.uid() = user_id);


-- ============================================================
-- 13. hunting_registrations（depends on profiles）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hunting_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_year integer NOT NULL,
  prefecture text NOT NULL,
  license_type text DEFAULT '第一種',
  registration_number text,
  valid_from date,
  valid_to date,
  fee_paid integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hunting_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own registrations" ON public.hunting_registrations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 14. shooting_ranges（depends on profiles）
-- ============================================================
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


-- ============================================================
-- 15. Admin RPC functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE (id uuid, email text, display_name text, is_admin boolean, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT p.id, u.email, p.display_name, p.is_admin, p.created_at
    FROM public.profiles p JOIN auth.users u ON p.id = u.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_admin(target_user_id uuid, admin_status boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles SET is_admin = admin_status WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_app_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN json_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_hunting_records', (SELECT count(*) FROM public.hunting_records),
    'total_game', (SELECT coalesce(sum(count), 0) FROM public.hunting_records),
    'total_shooting_records', (SELECT count(*) FROM public.shooting_records),
    'total_rounds_fired', (SELECT coalesce(sum(rounds_fired), 0) FROM public.hunting_records),
    'total_teams', (SELECT count(*) FROM public.hunting_teams)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_teams_admin()
RETURNS TABLE (id uuid, name text, description text, invite_code text, created_by uuid, leader_name text, member_count bigint, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT t.id, t.name, t.description, t.invite_code, t.created_by,
           p.display_name, count(tm.id), t.created_at
    FROM public.hunting_teams t
    LEFT JOIN public.profiles p ON t.created_by = p.id
    LEFT JOIN public.team_members tm ON t.id = tm.team_id
    GROUP BY t.id, p.display_name;
END;
$$;


-- ============================================================
-- 16. handle_new_user trigger（新規ユーザー登録時にプロフィール自動作成）
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- NOTE: Supabase Storage バケット（Storage UI で作成推奨）
--   バケット名: shooting-targets (public)
--   Policy例（Storage > Policies で設定）:
--     INSERT: auth.uid() is not null
--     SELECT: true (公開)
--     DELETE: auth.uid() = owner
-- ============================================================
