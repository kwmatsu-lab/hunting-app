-- ================================================
-- リセット用SQL: 全テーブルを削除して最初からやり直す
-- ① このファイルを先に実行 → ② supabase_schema_all.sql を実行
-- ================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.set_user_admin(uuid, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_app_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_teams_admin() CASCADE;

DROP TABLE IF EXISTS public.hunting_sightings CASCADE;
DROP TABLE IF EXISTS public.ammo_ledger CASCADE;
DROP TABLE IF EXISTS public.shooting_ranges CASCADE;
DROP TABLE IF EXISTS public.hunting_registrations CASCADE;
DROP TABLE IF EXISTS public.hunting_catches CASCADE;
DROP TABLE IF EXISTS public.hunting_records CASCADE;
DROP TABLE IF EXISTS public.hunting_grounds CASCADE;
DROP TABLE IF EXISTS public.ammo_inventory CASCADE;
DROP TABLE IF EXISTS public.licenses CASCADE;
DROP TABLE IF EXISTS public.shooting_records CASCADE;
DROP TABLE IF EXISTS public.firearms CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.hunting_teams CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
