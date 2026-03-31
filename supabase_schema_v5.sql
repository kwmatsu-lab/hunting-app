-- =====================================================
-- Schema v5: 銃管理・狩猟登録・管理者機能
-- =====================================================

-- プロフィールに管理者フラグ追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 銃管理テーブル
CREATE TABLE IF NOT EXISTS firearms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
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

ALTER TABLE firearms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own firearms" ON firearms FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 狩猟登録テーブル
CREATE TABLE IF NOT EXISTS hunting_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
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

ALTER TABLE hunting_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own registrations" ON hunting_registrations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 狩猟記録に銃IDを追加
ALTER TABLE hunting_records ADD COLUMN IF NOT EXISTS firearm_id uuid REFERENCES firearms(id) ON DELETE SET NULL;

-- 猟隊テーブル（v5で追加）
CREATE TABLE IF NOT EXISTS hunting_teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  invite_code text UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES hunting_teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE hunting_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team members can see team" ON hunting_teams FOR SELECT
  USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "team leader can manage" ON hunting_teams FOR ALL
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "members can see team members" ON team_members FOR SELECT
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "leader can manage members" ON team_members FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'leader')
  OR user_id = auth.uid()
);
CREATE POLICY "self leave or leader remove" ON team_members FOR DELETE
  USING (user_id = auth.uid() OR
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'leader'));

-- 管理者RPC
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS TABLE (id uuid, email text, display_name text, is_admin boolean, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT p.id, u.email, p.display_name, p.is_admin, p.created_at
    FROM profiles p JOIN auth.users u ON p.id = u.id;
END;
$$;

CREATE OR REPLACE FUNCTION set_user_admin(target_user_id uuid, admin_status boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE profiles SET is_admin = admin_status WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_app_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN json_build_object(
    'total_users', (SELECT count(*) FROM profiles),
    'total_hunting_records', (SELECT count(*) FROM hunting_records),
    'total_game', (SELECT coalesce(sum(count), 0) FROM hunting_records),
    'total_shooting_records', (SELECT count(*) FROM shooting_records),
    'total_rounds_fired', (SELECT coalesce(sum(rounds_fired), 0) FROM hunting_records),
    'total_teams', (SELECT count(*) FROM hunting_teams)
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_all_teams_admin()
RETURNS TABLE (id uuid, name text, description text, invite_code text, created_by uuid, leader_name text, member_count bigint, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT t.id, t.name, t.description, t.invite_code, t.created_by,
           p.display_name, count(tm.id), t.created_at
    FROM hunting_teams t
    LEFT JOIN profiles p ON t.created_by = p.id
    LEFT JOIN team_members tm ON t.id = tm.team_id
    GROUP BY t.id, p.display_name;
END;
$$;
