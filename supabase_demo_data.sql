-- ==================================================
-- デモデータ挿入 SQL (v4 - 完全版)
-- Supabase SQL Editor に貼り付けて実行してください
-- yamada@demo.com / suzuki@demo.com のデータを作成します
-- ※ 既存デモデータを一度クリアして再挿入します
-- ==================================================

-- Step1: ユーザーIDを一時テーブルに格納
DROP TABLE IF EXISTS _demo_ids;
CREATE TEMP TABLE _demo_ids AS
SELECT
  (SELECT id FROM auth.users WHERE email = 'yamada@demo.com') AS u2,
  (SELECT id FROM auth.users WHERE email = 'suzuki@demo.com') AS u3;

-- 確認（NULLなら先にユーザー作成が必要）
SELECT
  CASE WHEN u2 IS NULL THEN 'ERROR: yamada@demo.com が存在しません' ELSE 'OK: yamada = ' || u2::text END AS yamada_check,
  CASE WHEN u3 IS NULL THEN 'ERROR: suzuki@demo.com が存在しません' ELSE 'OK: suzuki = ' || u3::text END AS suzuki_check
FROM _demo_ids;

-- ==================================================
-- 既存デモデータをクリア（子テーブルから順に）
-- ==================================================
DELETE FROM public.shooting_records    WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.hunting_sightings   WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.hunting_catches     WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.hunting_records     WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.ammo_ledger         WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.ammo_inventory      WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.hunting_registrations WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.licenses            WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.permit_books        WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.firearms            WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.shooting_ranges     WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.hunting_grounds     WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.team_members        WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.hunting_teams       WHERE created_by IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);

-- ==================================================
-- プロフィール
-- ==================================================
INSERT INTO public.profiles (id, display_name, is_admin)
SELECT u2, '山田 花子', false FROM _demo_ids WHERE u2 IS NOT NULL
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, is_admin = EXCLUDED.is_admin;

INSERT INTO public.profiles (id, display_name, is_admin)
SELECT u3, '鈴木 一郎', false FROM _demo_ids WHERE u3 IS NOT NULL
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, is_admin = EXCLUDED.is_admin;

-- ==================================================
-- チーム
-- ==================================================
INSERT INTO public.hunting_teams (id, name, description, invite_code, created_by)
SELECT 'a1a10001-0000-0000-0000-000000000001'::uuid, '北海道猟友会',
  '北海道を中心に活動する猟隊。大雪山系・阿寒エリアで巻き狩りを実施。', 'HOKKAI01', u2
FROM _demo_ids WHERE u2 IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_teams (id, name, description, invite_code, created_by)
SELECT 'a1a10001-0000-0000-0000-000000000002'::uuid, 'アルプス猟隊',
  '南アルプス周辺で活動。シカ・イノシシの個体数管理に協力。', 'ALPS0001', u2
FROM _demo_ids WHERE u2 IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- チームメンバー
-- ==================================================
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 'a1a10001-0000-0000-0000-000000000001'::uuid, u2, 'leader' FROM _demo_ids WHERE u2 IS NOT NULL
ON CONFLICT (team_id, user_id) DO NOTHING;

INSERT INTO public.team_members (team_id, user_id, role)
SELECT 'a1a10001-0000-0000-0000-000000000001'::uuid, u3, 'member' FROM _demo_ids WHERE u3 IS NOT NULL
ON CONFLICT (team_id, user_id) DO NOTHING;

INSERT INTO public.team_members (team_id, user_id, role)
SELECT 'a1a10001-0000-0000-0000-000000000002'::uuid, u2, 'leader' FROM _demo_ids WHERE u2 IS NOT NULL
ON CONFLICT (team_id, user_id) DO NOTHING;

INSERT INTO public.team_members (team_id, user_id, role)
SELECT 'a1a10001-0000-0000-0000-000000000002'::uuid, u3, 'member' FROM _demo_ids WHERE u3 IS NOT NULL
ON CONFLICT (team_id, user_id) DO NOTHING;

-- ==================================================
-- 猟場
-- ==================================================
INSERT INTO public.hunting_grounds (id, user_id, name, prefecture, address, area_ha, terrain, notes, latitude, longitude)
SELECT 'b1b10001-0000-0000-0000-000000000001'::uuid, u2, '大雪山系猟区', '北海道', '上川郡上川町', 500, '山岳', '積雪期は林道閉鎖', 43.723, 142.871
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_grounds (id, user_id, name, prefecture, address, area_ha, terrain, notes, latitude, longitude)
SELECT 'b1b10001-0000-0000-0000-000000000002'::uuid, u2, '阿寒の森', '北海道', '釧路市阿寒町', 350, '森林', '湿地帯あり要注意', 43.446, 144.099
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_grounds (id, user_id, name, prefecture, address, area_ha, terrain, notes, latitude, longitude)
SELECT 'b1b10001-0000-0000-0000-000000000003'::uuid, u2, '南アルプス猟区', '長野県', '伊那市長谷', 800, '高山', '11月から積雪多い', 35.644, 138.227
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 射撃場
-- ==================================================
INSERT INTO public.shooting_ranges (id, user_id, name, prefecture, address, notes)
SELECT 'c1c10001-0000-0000-0000-000000000001'::uuid, u2, '伊那射撃場', '長野県', '伊那市高遠町', 'クレー専用'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shooting_ranges (id, user_id, name, prefecture, address, notes)
SELECT 'c1c10001-0000-0000-0000-000000000002'::uuid, u2, '札幌射撃場', '北海道', '札幌市清田区羊ヶ丘', '公営。クレー各種対応'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shooting_ranges (id, user_id, name, prefecture, address, notes)
SELECT 'c1c10001-0000-0000-0000-000000000003'::uuid, u3, '帯広射撃場', '北海道', '帯広市西22条南8丁目', 'ライフル専用コースあり'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 銃器
-- d1d10001: yamada レミントン870(散弾銃)
-- d1d10001: suzuki ウィンチェスターSXP(散弾銃)
-- d1d10001: suzuki ブローニングBLR(ライフル銃)
-- ==================================================
INSERT INTO public.firearms (id, user_id, name, type, manufacturer, model, serial_number, caliber, mechanism,
  original_permit_date, original_permit_number, permit_date, permit_number, permit_validity_text,
  renewal_from, renewal_to, notes)
SELECT 'd1d10001-0000-0000-0000-000000000001'::uuid, u2,
  'レミントン 870 12番', '散弾銃', 'Remington', '870', 'R870-345678', '12番', 'ポンプアクション式',
  '2021-06-15', '210060001', '2026-06-20', '210060201', '令和11年の誕生日まで',
  '2029-04-01', '2029-05-01', ''
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.firearms (id, user_id, name, type, manufacturer, model, serial_number, caliber, mechanism,
  original_permit_date, original_permit_number, permit_date, permit_number, permit_validity_text,
  renewal_from, renewal_to, notes)
SELECT 'd1d10001-0000-0000-0000-000000000002'::uuid, u3,
  'ウィンチェスター SXP 12番', '散弾銃', 'Winchester', 'SXP', 'SXP-654321', '12番', 'ポンプアクション式',
  '2021-03-20', '210030001', '2026-03-18', '210030201', '令和11年の誕生日まで',
  '2029-01-01', '2029-02-01', ''
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.firearms (id, user_id, name, type, manufacturer, model, serial_number, caliber, mechanism,
  original_permit_date, original_permit_number, permit_date, permit_number, permit_validity_text,
  renewal_from, renewal_to, notes)
SELECT 'd1d10001-0000-0000-0000-000000000003'::uuid, u3,
  'ブローニング BLR .30-06', 'ライフル銃', 'Browning', 'BLR', 'BLR-987654', '.30-06', 'レバーアクション式',
  '2022-05-10', '220050001', '2027-05-08', '220050201', '令和12年の誕生日まで',
  '2030-03-01', '2030-04-01', '狩猟・標的射撃兼用'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 所持許可証帳
-- ==================================================
INSERT INTO public.permit_books (id, user_id, book_number, original_issue_date, issue_date)
SELECT 'ab220001-0000-0000-0000-000000000001'::uuid, u2, '第030220000001号', '2021-06-15', '2026-06-20'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.permit_books (id, user_id, book_number, original_issue_date, issue_date)
SELECT 'ab220002-0000-0000-0000-000000000001'::uuid, u3, '第020110000001号', '2021-03-20', '2026-03-18'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 弾薬在庫
-- ee000001: yamada クレー射撃用12番散弾
-- ee000002: yamada 12番スラッグ弾
-- ee000003: suzuki .30-06ライフル弾
-- ee000004: suzuki 12番散弾(トラップ用)
-- ==================================================
INSERT INTO public.ammo_inventory (id, user_id, name, caliber, type, quantity, min_quantity, brand, notes)
SELECT 'ee000001-0000-0000-0000-000000000001'::uuid, u2, 'クレー射撃用12番散弾', '12番', '実包', 250, 50, 'フィオッキ', 'クレー専用'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ammo_inventory (id, user_id, name, caliber, type, quantity, min_quantity, brand, notes)
SELECT 'ee000001-0000-0000-0000-000000000002'::uuid, u2, '12番スラッグ弾', '12番', '実包', 24, 5, 'フェデラル', '狩猟用'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ammo_inventory (id, user_id, name, caliber, type, quantity, min_quantity, brand, notes)
SELECT 'ee000001-0000-0000-0000-000000000003'::uuid, u3, '.30-06ライフル弾', '.30-06', '実包', 18, 10, 'レミントン', '狩猟・標的射撃兼用'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ammo_inventory (id, user_id, name, caliber, type, quantity, min_quantity, brand, notes)
SELECT 'ee000001-0000-0000-0000-000000000004'::uuid, u3, 'クレー射撃用12番散弾', '12番', '実包', 80, 20, 'ウィンチェスター', 'トラップ練習用'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 弾薬帳簿
-- ==================================================
INSERT INTO public.ammo_ledger (id, user_id, ammo_inventory_id, date, event_type, description, received, paid_out, balance, notes)
SELECT '1ed00001-0000-0000-0000-000000000001'::uuid, u2,
  'ee000001-0000-0000-0000-000000000001'::uuid,
  '2024-08-15', '購入', '銃砲店でクレー弾購入', 300, 0, 300, '許可証番号: 長野-2024-001'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ammo_ledger (id, user_id, ammo_inventory_id, date, event_type, description, received, paid_out, balance, notes)
SELECT '1ed00001-0000-0000-0000-000000000002'::uuid, u2,
  'ee000001-0000-0000-0000-000000000001'::uuid,
  '2025-01-05', '射撃練習', '伊那射撃場での練習', 0, 50, 250, '和式トラップ2ラウンド'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ammo_ledger (id, user_id, ammo_inventory_id, date, event_type, description, received, paid_out, balance, notes)
SELECT '1ed00001-0000-0000-0000-000000000003'::uuid, u2,
  'ee000001-0000-0000-0000-000000000002'::uuid,
  '2024-10-01', '購入', 'スラッグ弾購入', 50, 0, 50, '狩猟シーズン前準備'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ammo_ledger (id, user_id, ammo_inventory_id, date, event_type, description, received, paid_out, balance, notes)
SELECT '1ed00001-0000-0000-0000-000000000004'::uuid, u2,
  'ee000001-0000-0000-0000-000000000002'::uuid,
  '2024-12-01', '狩猟使用', '大雪山巻き狩り', 0, 2, 48, '2発使用、1頭捕獲'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ammo_ledger (id, user_id, ammo_inventory_id, date, event_type, description, received, paid_out, balance, notes)
SELECT '1ed00001-0000-0000-0000-000000000005'::uuid, u3,
  'ee000001-0000-0000-0000-000000000003'::uuid,
  '2024-08-20', '購入', '.30-06弾購入', 60, 0, 60, '許可証番号: 北海-2024-003'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ammo_ledger (id, user_id, ammo_inventory_id, date, event_type, description, received, paid_out, balance, notes)
SELECT '1ed00001-0000-0000-0000-000000000006'::uuid, u3,
  'ee000001-0000-0000-0000-000000000003'::uuid,
  '2024-09-25', '射撃練習', '帯広射撃場50m練習', 0, 10, 50, 'ライフル50m 1ラウンド'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ammo_ledger (id, user_id, ammo_inventory_id, date, event_type, description, received, paid_out, balance, notes)
SELECT '1ed00001-0000-0000-0000-000000000007'::uuid, u3,
  'ee000001-0000-0000-0000-000000000004'::uuid,
  '2024-09-01', '購入', 'クレー弾購入', 100, 0, 100, 'トラップ練習用'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 免許・資格（各ユーザー5種類）
-- a1c30001-...-001〜005: 山田 花子
-- a1c30001-...-006〜00a: 鈴木 一郎
-- ==================================================

-- 山田 花子
INSERT INTO public.licenses (id, user_id, name, license_number, issued_date, expiry_date, issuer, notes)
SELECT 'a1c30001-0000-0000-0000-000000000001'::uuid, u2,
  '第一種銃猟免許', '長野01-54321', '2024-04-01', '2028-03-31', '長野県知事', ''
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.licenses (id, user_id, name, license_number, issued_date, expiry_date, issuer, notes)
SELECT 'a1c30001-0000-0000-0000-000000000002'::uuid, u2,
  'わな猟免許', '長野わな-2024-0089', '2024-04-01', '2028-03-31', '長野県知事', ''
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.licenses (id, user_id, name, license_number, issued_date, expiry_date, issuer, notes)
SELECT 'a1c30001-0000-0000-0000-000000000003'::uuid, u2,
  '猟銃等講習会修了証', '安全-2023-0078', '2023-08-10', '2026-08-09', '長野県公安委員会', '初心者講習'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.licenses (id, user_id, name, license_number, issued_date, expiry_date, issuer, notes)
SELECT 'a1c30001-0000-0000-0000-000000000004'::uuid, u2,
  '技能講習修了証', '技能-2026-0045', '2026-02-20', '2029-02-19', '長野県公安委員会', '更新時の技能講習'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.licenses (id, user_id, name, license_number, issued_date, expiry_date, issuer, notes)
SELECT 'a1c30001-0000-0000-0000-000000000005'::uuid, u2,
  '射撃教習修了証', '教習-2021-0123', '2021-05-15', NULL, '伊那射撃場', '初回許可取得時'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- 鈴木 一郎
INSERT INTO public.licenses (id, user_id, name, license_number, issued_date, expiry_date, issuer, notes)
SELECT 'a1c30001-0000-0000-0000-000000000006'::uuid, u3,
  '第一種銃猟免許', '北海01-11111', '2022-04-01', '2026-03-31', '北海道知事', '次回更新要確認'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.licenses (id, user_id, name, license_number, issued_date, expiry_date, issuer, notes)
SELECT 'a1c30001-0000-0000-0000-000000000007'::uuid, u3,
  'わな猟免許', '北海わな-2022-0034', '2022-04-01', '2026-03-31', '北海道知事', ''
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.licenses (id, user_id, name, license_number, issued_date, expiry_date, issuer, notes)
SELECT 'a1c30001-0000-0000-0000-000000000008'::uuid, u3,
  '猟銃等講習会修了証', '安全-2021-0055', '2021-02-18', '2024-02-17', '北海道公安委員会', '更新済み'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.licenses (id, user_id, name, license_number, issued_date, expiry_date, issuer, notes)
SELECT 'a1c30001-0000-0000-0000-000000000009'::uuid, u3,
  '技能講習修了証', '技能-2024-0312', '2024-01-15', '2027-01-14', '北海道公安委員会', ''
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.licenses (id, user_id, name, license_number, issued_date, expiry_date, issuer, notes)
SELECT 'a1c30001-0000-0000-0000-00000000000a'::uuid, u3,
  '射撃教習修了証', '教習-2021-0067', '2021-01-20', NULL, '帯広射撃場', '初回許可取得時'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 狩猟者登録（各ユーザー複数シーズン・都道府県）
-- ==================================================

-- 山田 花子
INSERT INTO public.hunting_registrations (id, user_id, season_year, prefecture, license_type, registration_number, valid_from, valid_to, fee_paid, notes)
SELECT 'ee930001-0000-0000-0000-000000000001'::uuid, u2,
  2023, '長野県', '第一種', '長野2023-05678', '2023-11-15', '2024-02-15', 8200, 'ニホンジカ・イノシシ'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_registrations (id, user_id, season_year, prefecture, license_type, registration_number, valid_from, valid_to, fee_paid, notes)
SELECT 'ee930001-0000-0000-0000-000000000002'::uuid, u2,
  2024, '長野県', '第一種', '長野2024-05678', '2024-11-15', '2025-02-15', 8200, 'ニホンジカ・イノシシ等'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_registrations (id, user_id, season_year, prefecture, license_type, registration_number, valid_from, valid_to, fee_paid, notes)
SELECT 'ee930001-0000-0000-0000-000000000003'::uuid, u2,
  2024, '北海道', '第一種', '北海2024-09012', '2024-10-01', '2025-01-31', 16500, 'エゾシカ・ヒグマ以外'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- 鈴木 一郎
INSERT INTO public.hunting_registrations (id, user_id, season_year, prefecture, license_type, registration_number, valid_from, valid_to, fee_paid, notes)
SELECT 'ee930001-0000-0000-0000-000000000004'::uuid, u3,
  2023, '北海道', '第一種', '北海2023-03456', '2023-10-01', '2024-03-31', 16500, ''
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_registrations (id, user_id, season_year, prefecture, license_type, registration_number, valid_from, valid_to, fee_paid, notes)
SELECT 'ee930001-0000-0000-0000-000000000005'::uuid, u3,
  2024, '北海道', '第一種', '北海2024-03456', '2024-11-01', '2025-03-31', 16500, ''
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_registrations (id, user_id, season_year, prefecture, license_type, registration_number, valid_from, valid_to, fee_paid, notes)
SELECT 'ee930001-0000-0000-0000-000000000006'::uuid, u3,
  2024, '長野県', '第一種', '長野2024-06789', '2024-11-15', '2025-02-15', 8200, 'アルプス猟隊参加'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 狩猟記録 (山田 花子) 6件
-- ==================================================
INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000001'::uuid, u2,
  '2024-11-20', '南アルプス南面', '長野県', 'タヌキ', 1, '単独忍び猟', '12番スラッグ弾', '晴れ',
  '初猟！単独で1頭仕留めた',
  'b1b10001-0000-0000-0000-000000000003'::uuid, NULL, 2,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '07:00', '12:00', 5, 13,
  'd1d10001-0000-0000-0000-000000000001'::uuid, 35.6440, 138.2270
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000002'::uuid, u2,
  '2024-11-28', '大雪山東麓', '北海道', 'シカ', 1, '巻き狩り', '12番スラッグ弾', '晴れ',
  '北海道猟友会として初参加。1頭仕留め',
  'b1b10001-0000-0000-0000-000000000001'::uuid, 'a1a10001-0000-0000-0000-000000000001'::uuid, 3,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '06:00', '15:00', -2, 3,
  'd1d10001-0000-0000-0000-000000000001'::uuid, NULL, NULL
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000003'::uuid, u2,
  '2024-12-01', '大雪山北面', '北海道', 'シカ', 1, '巻き狩り', '12番スラッグ弾', '曇り',
  'チーム猟に参加。雪中で1頭',
  'b1b10001-0000-0000-0000-000000000001'::uuid, 'a1a10001-0000-0000-0000-000000000001'::uuid, 2,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '06:00', '14:30', -3, 2,
  'd1d10001-0000-0000-0000-000000000001'::uuid, NULL, NULL
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000004'::uuid, u2,
  '2024-12-20', '南アルプス北面', '長野県', 'イノシシ', 2, '巻き狩り', '12番スラッグ弾', '曇り',
  'アルプス猟隊として初の大型猟。2頭捕獲',
  'b1b10001-0000-0000-0000-000000000003'::uuid, 'a1a10001-0000-0000-0000-000000000002'::uuid, 5,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '06:30', '14:00', 1, 8,
  'd1d10001-0000-0000-0000-000000000001'::uuid, 35.6600, 138.2420
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000005'::uuid, u2,
  '2025-01-05', '伊那谷', '長野県', 'キジ', 2, '待ち猟', '12番スラッグ弾', '晴れ',
  '良い天気の中キジ2羽',
  'b1b10001-0000-0000-0000-000000000003'::uuid, NULL, 4,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '08:00', '13:00', 3, 9,
  'd1d10001-0000-0000-0000-000000000001'::uuid, NULL, NULL
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000006'::uuid, u2,
  '2025-01-25', '南アルプス深山', '長野県', 'イノシシ', 2, '巻き狩り', '12番スラッグ弾', '雪',
  '雪中で2頭捕獲。今シーズン最高の成果',
  'b1b10001-0000-0000-0000-000000000003'::uuid, 'a1a10001-0000-0000-0000-000000000002'::uuid, 4,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '07:00', '15:30', -2, 4,
  'd1d10001-0000-0000-0000-000000000001'::uuid, 35.6700, 138.2150
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 狩猟記録 (鈴木 一郎) 5件
-- ==================================================
INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000007'::uuid, u3,
  '2024-11-28', '大雪山東麓', '北海道', 'イノシシ', 1, '巻き狩り', '.30-06', '晴れ',
  'ライフルで急斜面から飛び出たイノシシを捕獲',
  'b1b10001-0000-0000-0000-000000000001'::uuid, 'a1a10001-0000-0000-0000-000000000001'::uuid, 2,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾',
  '06:00', '15:00', -2, 3,
  'd1d10001-0000-0000-0000-000000000003'::uuid, NULL, NULL
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000008'::uuid, u3,
  '2024-12-01', '大雪山北面', '北海道', 'イノシシ', 1, '巻き狩り', '.30-06', '曇り',
  '北海道猟友会チーム猟。ライフルで1頭',
  'b1b10001-0000-0000-0000-000000000001'::uuid, 'a1a10001-0000-0000-0000-000000000001'::uuid, 1,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾',
  '06:00', '14:30', -3, 2,
  'd1d10001-0000-0000-0000-000000000003'::uuid, NULL, NULL
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000009'::uuid, u3,
  '2025-01-15', '大雪山系', '北海道', 'シカ', 1, '単独忍び猟', '.30-06', '曇り',
  '単独で1頭仕留め。朝イチの移動時間を狙った',
  'b1b10001-0000-0000-0000-000000000001'::uuid, NULL, 2,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾',
  '05:00', '12:00', -5, 1,
  'd1d10001-0000-0000-0000-000000000003'::uuid, NULL, NULL
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-00000000000a'::uuid, u3,
  '2025-01-25', '南アルプス深山', '長野県', 'シカ', 1, '巻き狩り', '.30-06', '雪',
  'アルプス猟隊に参加。ライフルで1頭仕留め',
  'b1b10001-0000-0000-0000-000000000003'::uuid, 'a1a10001-0000-0000-0000-000000000002'::uuid, 2,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾',
  '07:00', '15:30', -2, 4,
  'd1d10001-0000-0000-0000-000000000003'::uuid, NULL, NULL
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-00000000000b'::uuid, u3,
  '2025-02-10', '阿寒湖西岸', '北海道', 'シカ', 0, '巻き狩り', '.30-06', '雪',
  '射撃機会あり、惜しくも取り逃がす',
  'b1b10001-0000-0000-0000-000000000002'::uuid, 'a1a10001-0000-0000-0000-000000000001'::uuid, 2,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾',
  '05:30', '13:30', -8, -2,
  'd1d10001-0000-0000-0000-000000000003'::uuid, NULL, NULL
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 捕獲イベント
-- ==================================================
INSERT INTO public.hunting_catches (id, hunting_record_id, user_id, catch_time, game, count, notes)
SELECT * FROM (VALUES
  ('fc0c0001-0000-0000-0000-000000000001'::uuid, 'f0300001-0000-0000-0000-000000000001'::uuid, (SELECT u2 FROM _demo_ids), '08:30', 'タヌキ',   1, '林道付近の茂み'),
  ('fc0c0001-0000-0000-0000-000000000002'::uuid, 'f0300001-0000-0000-0000-000000000004'::uuid, (SELECT u2 FROM _demo_ids), '08:30', 'イノシシ', 1, '稜線付近'),
  ('fc0c0001-0000-0000-0000-000000000003'::uuid, 'f0300001-0000-0000-0000-000000000004'::uuid, (SELECT u2 FROM _demo_ids), '11:15', 'イノシシ', 1, '谷筋の笹藪'),
  ('fc0c0001-0000-0000-0000-000000000004'::uuid, 'f0300001-0000-0000-0000-000000000006'::uuid, (SELECT u2 FROM _demo_ids), '09:00', 'イノシシ', 1, '沢沿いの斜面'),
  ('fc0c0001-0000-0000-0000-000000000005'::uuid, 'f0300001-0000-0000-0000-000000000006'::uuid, (SELECT u2 FROM _demo_ids), '11:30', 'イノシシ', 1, '落葉松林の中'),
  ('fc0c0001-0000-0000-0000-000000000006'::uuid, 'f0300001-0000-0000-0000-000000000007'::uuid, (SELECT u3 FROM _demo_ids), '09:20', 'イノシシ', 1, '急斜面の茂み'),
  ('fc0c0001-0000-0000-0000-000000000007'::uuid, 'f0300001-0000-0000-0000-000000000009'::uuid, (SELECT u3 FROM _demo_ids), '06:30', 'シカ',     1, '朝の移動ルート上')
) AS v(id, hunting_record_id, user_id, catch_time, game, count, notes)
WHERE user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 目撃記録
-- ==================================================
INSERT INTO public.hunting_sightings (id, hunting_record_id, user_id, game, count, sighting_time, location_notes, sighting_lat, sighting_lng, notes)
SELECT * FROM (VALUES
  ('f5000001-0000-0000-0000-000000000001'::uuid, 'f0300001-0000-0000-0000-000000000004'::uuid, (SELECT u2 FROM _demo_ids), 'イノシシ', 5, '07:00', '南アルプス尾根付近', 35.6650::numeric, 138.2450::numeric, '夜明けと同時に稜線を移動'),
  ('f5000001-0000-0000-0000-000000000002'::uuid, 'f0300001-0000-0000-0000-000000000004'::uuid, (SELECT u2 FROM _demo_ids), 'シカ',     4, '10:00', '渓流沿い',           35.6600::numeric, 138.2360::numeric, 'オス2頭・メス2頭の群れ'),
  ('f5000001-0000-0000-0000-000000000003'::uuid, 'f0300001-0000-0000-0000-000000000006'::uuid, (SELECT u2 FROM _demo_ids), 'イノシシ', 6, '07:30', '南アルプス深山斜面', 35.6720::numeric, 138.2180::numeric, '早朝から斜面を群れで移動'),
  ('f5000001-0000-0000-0000-000000000004'::uuid, 'f0300001-0000-0000-0000-000000000001'::uuid, (SELECT u2 FROM _demo_ids), 'タヌキ',   2, '08:30', '南アルプス南面林道', 35.6430::numeric, 138.2260::numeric, '親子と思われる2頭'),
  ('f5000001-0000-0000-0000-000000000005'::uuid, 'f0300001-0000-0000-0000-000000000009'::uuid, (SELECT u3 FROM _demo_ids), 'シカ',     3, '05:30', '大雪山系山腹',       NULL::numeric,    NULL::numeric,    '夜明け前の移動を確認'),
  ('f5000001-0000-0000-0000-000000000006'::uuid, 'f0300001-0000-0000-0000-00000000000b'::uuid, (SELECT u3 FROM _demo_ids), 'シカ',     5, '06:00', '阿寒湖岸湿地帯',     43.4580::numeric, 144.0920::numeric, '湖面が凍り湿地に集結していた')
) AS v(id, hunting_record_id, user_id, game, count, sighting_time, location_notes, sighting_lat, sighting_lng, notes)
WHERE user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 射撃記録 (山田 花子) 7件 - すべてscore_detail付き
-- 日付: 2024-09-10, 10-15, 11-08, 12-10, 2025-01-20, 02-15, 03-10
-- ==================================================

-- #1 和式トラップ 2024-09-10 score=15
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-000000000001'::uuid, u2,
  '2024-09-10', '伊那射撃場', 'レミントン 870', '12番', 15, 25, 'トラップ初参加。緊張したが15中', 'jp_trap',
  '{"type":"trap","shots":[{"n":1,"hit":true,"dir":"center","shotNum":1},{"n":2,"hit":true,"dir":"right","shotNum":1},{"n":3,"hit":false,"dir":null,"shotNum":null},{"n":4,"hit":true,"dir":"left","shotNum":2},{"n":5,"hit":true,"dir":"center","shotNum":1},{"n":6,"hit":false,"dir":null,"shotNum":null},{"n":7,"hit":true,"dir":"right","shotNum":1},{"n":8,"hit":false,"dir":null,"shotNum":null},{"n":9,"hit":false,"dir":null,"shotNum":null},{"n":10,"hit":true,"dir":"center","shotNum":2},{"n":11,"hit":true,"dir":"left","shotNum":1},{"n":12,"hit":false,"dir":null,"shotNum":null},{"n":13,"hit":false,"dir":null,"shotNum":null},{"n":14,"hit":true,"dir":"right","shotNum":1},{"n":15,"hit":false,"dir":null,"shotNum":null},{"n":16,"hit":true,"dir":"center","shotNum":1},{"n":17,"hit":false,"dir":null,"shotNum":null},{"n":18,"hit":true,"dir":"left","shotNum":2},{"n":19,"hit":true,"dir":"right","shotNum":1},{"n":20,"hit":false,"dir":null,"shotNum":null},{"n":21,"hit":true,"dir":"center","shotNum":1},{"n":22,"hit":true,"dir":"left","shotNum":1},{"n":23,"hit":false,"dir":null,"shotNum":null},{"n":24,"hit":true,"dir":"right","shotNum":2},{"n":25,"hit":true,"dir":"center","shotNum":1}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000001'::uuid, 'クレー射撃用12番散弾'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #2 和式トラップ 2024-10-15 score=18
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-000000000002'::uuid, u2,
  '2024-10-15', '伊那射撃場', 'レミントン 870', '12番', 18, 25, '先月より上達。18中達成', 'jp_trap',
  '{"type":"trap","shots":[{"n":1,"hit":true,"dir":"center","shotNum":1},{"n":2,"hit":true,"dir":"right","shotNum":1},{"n":3,"hit":true,"dir":"left","shotNum":1},{"n":4,"hit":false,"dir":null,"shotNum":null},{"n":5,"hit":true,"dir":"center","shotNum":1},{"n":6,"hit":true,"dir":"right","shotNum":2},{"n":7,"hit":true,"dir":"left","shotNum":1},{"n":8,"hit":false,"dir":null,"shotNum":null},{"n":9,"hit":true,"dir":"center","shotNum":1},{"n":10,"hit":true,"dir":"right","shotNum":1},{"n":11,"hit":false,"dir":null,"shotNum":null},{"n":12,"hit":true,"dir":"left","shotNum":1},{"n":13,"hit":true,"dir":"center","shotNum":2},{"n":14,"hit":true,"dir":"right","shotNum":1},{"n":15,"hit":false,"dir":null,"shotNum":null},{"n":16,"hit":true,"dir":"left","shotNum":1},{"n":17,"hit":true,"dir":"center","shotNum":1},{"n":18,"hit":false,"dir":null,"shotNum":null},{"n":19,"hit":true,"dir":"right","shotNum":1},{"n":20,"hit":true,"dir":"left","shotNum":1},{"n":21,"hit":false,"dir":null,"shotNum":null},{"n":22,"hit":true,"dir":"center","shotNum":1},{"n":23,"hit":true,"dir":"right","shotNum":2},{"n":24,"hit":false,"dir":null,"shotNum":null},{"n":25,"hit":true,"dir":"left","shotNum":1}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000001'::uuid, 'クレー射撃用12番散弾'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #3 和式スキート 2024-11-08 score=13
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-000000000003'::uuid, u2,
  '2024-11-08', '伊那射撃場', 'レミントン 870', '12番', 13, 25, 'スキート初挑戦。難しい！', 'jp_skeet',
  '{"type":"skeet","stations":[{"st":1,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1,"dh":true,"dl":false},{"st":2,"h":true,"h_shotNum":1,"l":true,"l_shotNum":2,"dh":true,"dl":false},{"st":3,"h":true,"h_shotNum":1,"l":false,"l_shotNum":null},{"st":4,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1},{"st":5,"h":false,"h_shotNum":null,"l":true,"l_shotNum":1},{"st":6,"h":false,"h_shotNum":null,"l":false,"l_shotNum":null,"dh":false,"dl":false},{"st":7,"h":true,"h_shotNum":1,"l":false,"l_shotNum":null,"dh":true,"dl":false},{"st":8,"h":true,"h_shotNum":1,"l":false,"l_shotNum":null}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000001'::uuid, 'クレー射撃用12番散弾'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #4 和式スキート 2024-12-10 score=18
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-000000000004'::uuid, u2,
  '2024-12-10', '伊那射撃場', 'レミントン 870', '12番', 18, 25, 'スキート大幅改善。ダブルも決まった', 'jp_skeet',
  '{"type":"skeet","stations":[{"st":1,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1,"dh":true,"dl":true},{"st":2,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1,"dh":true,"dl":true},{"st":3,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1},{"st":4,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1},{"st":5,"h":true,"h_shotNum":1,"l":false,"l_shotNum":null},{"st":6,"h":true,"h_shotNum":1,"l":true,"l_shotNum":2,"dh":false,"dl":false},{"st":7,"h":true,"h_shotNum":1,"l":false,"l_shotNum":null,"dh":true,"dl":false},{"st":8,"h":true,"h_shotNum":1,"l":false,"l_shotNum":null}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000001'::uuid, 'クレー射撃用12番散弾'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #5 和式トラップ 2025-01-20 score=20
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-000000000005'::uuid, u2,
  '2025-01-20', '札幌射撃場', 'レミントン 870', '12番', 20, 25, '自己ベスト更新！20中', 'jp_trap',
  '{"type":"trap","shots":[{"n":1,"hit":true,"dir":"center","shotNum":1},{"n":2,"hit":true,"dir":"right","shotNum":1},{"n":3,"hit":false,"dir":null,"shotNum":null},{"n":4,"hit":true,"dir":"left","shotNum":1},{"n":5,"hit":true,"dir":"center","shotNum":1},{"n":6,"hit":true,"dir":"right","shotNum":1},{"n":7,"hit":true,"dir":"left","shotNum":1},{"n":8,"hit":false,"dir":null,"shotNum":null},{"n":9,"hit":true,"dir":"center","shotNum":2},{"n":10,"hit":true,"dir":"right","shotNum":1},{"n":11,"hit":true,"dir":"left","shotNum":1},{"n":12,"hit":false,"dir":null,"shotNum":null},{"n":13,"hit":true,"dir":"center","shotNum":1},{"n":14,"hit":true,"dir":"right","shotNum":1},{"n":15,"hit":true,"dir":"left","shotNum":1},{"n":16,"hit":true,"dir":"center","shotNum":1},{"n":17,"hit":false,"dir":null,"shotNum":null},{"n":18,"hit":true,"dir":"right","shotNum":1},{"n":19,"hit":true,"dir":"left","shotNum":1},{"n":20,"hit":true,"dir":"center","shotNum":1},{"n":21,"hit":true,"dir":"right","shotNum":1},{"n":22,"hit":false,"dir":null,"shotNum":null},{"n":23,"hit":true,"dir":"left","shotNum":1},{"n":24,"hit":true,"dir":"center","shotNum":1},{"n":25,"hit":true,"dir":"right","shotNum":1}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000001'::uuid, 'クレー射撃用12番散弾'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #6 国際トラップ 2025-02-15 score=19
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-000000000006'::uuid, u2,
  '2025-02-15', '札幌射撃場', 'レミントン 870', '12番', 19, 25, '国際トラップに初挑戦。和式より難しい', 'intl_trap',
  '{"type":"trap","shots":[{"n":1,"hit":true,"dir":"center","shotNum":1},{"n":2,"hit":true,"dir":"right","shotNum":1},{"n":3,"hit":false,"dir":null,"shotNum":null},{"n":4,"hit":true,"dir":"left","shotNum":1},{"n":5,"hit":true,"dir":"center","shotNum":1},{"n":6,"hit":true,"dir":"right","shotNum":1},{"n":7,"hit":true,"dir":"left","shotNum":1},{"n":8,"hit":false,"dir":null,"shotNum":null},{"n":9,"hit":true,"dir":"center","shotNum":1},{"n":10,"hit":true,"dir":"right","shotNum":2},{"n":11,"hit":true,"dir":"left","shotNum":1},{"n":12,"hit":false,"dir":null,"shotNum":null},{"n":13,"hit":true,"dir":"center","shotNum":1},{"n":14,"hit":true,"dir":"right","shotNum":1},{"n":15,"hit":false,"dir":null,"shotNum":null},{"n":16,"hit":true,"dir":"left","shotNum":1},{"n":17,"hit":true,"dir":"center","shotNum":1},{"n":18,"hit":true,"dir":"right","shotNum":1},{"n":19,"hit":true,"dir":"left","shotNum":1},{"n":20,"hit":false,"dir":null,"shotNum":null},{"n":21,"hit":true,"dir":"center","shotNum":1},{"n":22,"hit":true,"dir":"right","shotNum":1},{"n":23,"hit":false,"dir":null,"shotNum":null},{"n":24,"hit":true,"dir":"left","shotNum":1},{"n":25,"hit":true,"dir":"center","shotNum":2}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000001'::uuid, 'クレー射撃用12番散弾'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #7 和式スキート 2025-03-10 score=21
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-000000000007'::uuid, u2,
  '2025-03-10', '伊那射撃場', 'レミントン 870', '12番', 21, 25, 'スキート自己ベスト。ほぼ全ステーション決まった', 'jp_skeet',
  '{"type":"skeet","stations":[{"st":1,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1,"dh":true,"dl":true},{"st":2,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1,"dh":true,"dl":true},{"st":3,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1},{"st":4,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1},{"st":5,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1},{"st":6,"h":true,"h_shotNum":1,"l":true,"l_shotNum":1,"dh":true,"dl":true},{"st":7,"h":true,"h_shotNum":1,"l":false,"l_shotNum":null,"dh":true,"dl":false},{"st":8,"h":true,"h_shotNum":1,"l":false,"l_shotNum":null}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000001'::uuid, 'クレー射撃用12番散弾'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 射撃記録 (鈴木 一郎) 6件 - すべてscore_detail付き
-- 日付: 2024-09-25, 10-28, 11-20, 12-18, 2025-01-15, 02-22
-- ==================================================

-- #8 ライフル50m 2024-09-25 score=72
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-000000000008'::uuid, u3,
  '2024-09-25', '帯広射撃場', 'ブローニング BLR', '.30-06', 72, 10, '50m初挑戦。集弾改善の余地あり', 'rifle_50m',
  '{"type":"target","shots":[{"n":1,"score":7},{"n":2,"score":6},{"n":3,"score":7},{"n":4,"score":8},{"n":5,"score":7},{"n":6,"score":7},{"n":7,"score":8},{"n":8,"score":7},{"n":9,"score":8},{"n":10,"score":7}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #9 和式トラップ 2024-10-28 score=14
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-000000000009'::uuid, u3,
  '2024-10-28', '帯広射撃場', 'ウィンチェスター SXP', '12番', 14, 25, 'トラップ初挑戦。散弾に慣れていない', 'jp_trap',
  '{"type":"trap","shots":[{"n":1,"hit":false,"dir":null,"shotNum":null},{"n":2,"hit":true,"dir":"right","shotNum":1},{"n":3,"hit":false,"dir":null,"shotNum":null},{"n":4,"hit":true,"dir":"left","shotNum":1},{"n":5,"hit":false,"dir":null,"shotNum":null},{"n":6,"hit":true,"dir":"center","shotNum":1},{"n":7,"hit":true,"dir":"right","shotNum":2},{"n":8,"hit":false,"dir":null,"shotNum":null},{"n":9,"hit":true,"dir":"center","shotNum":1},{"n":10,"hit":false,"dir":null,"shotNum":null},{"n":11,"hit":true,"dir":"left","shotNum":1},{"n":12,"hit":false,"dir":null,"shotNum":null},{"n":13,"hit":true,"dir":"center","shotNum":1},{"n":14,"hit":true,"dir":"right","shotNum":1},{"n":15,"hit":false,"dir":null,"shotNum":null},{"n":16,"hit":true,"dir":"left","shotNum":2},{"n":17,"hit":false,"dir":null,"shotNum":null},{"n":18,"hit":true,"dir":"center","shotNum":1},{"n":19,"hit":false,"dir":null,"shotNum":null},{"n":20,"hit":true,"dir":"right","shotNum":1},{"n":21,"hit":true,"dir":"left","shotNum":1},{"n":22,"hit":false,"dir":null,"shotNum":null},{"n":23,"hit":true,"dir":"center","shotNum":1},{"n":24,"hit":false,"dir":null,"shotNum":null},{"n":25,"hit":true,"dir":"right","shotNum":1}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000004'::uuid, 'クレー射撃用12番散弾'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #10 ライフル50m 2024-11-20 score=81
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-00000000000a'::uuid, u3,
  '2024-11-20', '帯広射撃場', 'ブローニング BLR', '.30-06', 81, 10, '着実に上達。81点', 'rifle_50m',
  '{"type":"target","shots":[{"n":1,"score":8},{"n":2,"score":8},{"n":3,"score":8},{"n":4,"score":9},{"n":5,"score":8},{"n":6,"score":8},{"n":7,"score":8},{"n":8,"score":8},{"n":9,"score":8},{"n":10,"score":8}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #11 ライフル50m 2024-12-18 score=85
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-00000000000b'::uuid, u3,
  '2024-12-18', '帯広射撃場', 'ブローニング BLR', '.30-06', 85, 10, '集弾が安定してきた。85点', 'rifle_50m',
  '{"type":"target","shots":[{"n":1,"score":9},{"n":2,"score":9},{"n":3,"score":8},{"n":4,"score":9},{"n":5,"score":8},{"n":6,"score":9},{"n":7,"score":8},{"n":8,"score":9},{"n":9,"score":8},{"n":10,"score":8}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #12 ライフル50m 2025-01-15 score=89
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-00000000000c'::uuid, u3,
  '2025-01-15', '帯広射撃場', 'ブローニング BLR', '.30-06', 89, 10, '自己ベスト更新。89点！', 'rifle_50m',
  '{"type":"target","shots":[{"n":1,"score":9},{"n":2,"score":9},{"n":3,"score":9},{"n":4,"score":9},{"n":5,"score":9},{"n":6,"score":9},{"n":7,"score":9},{"n":8,"score":9},{"n":9,"score":9},{"n":10,"score":8}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- #13 ライフル50m 2025-02-22 score=91
INSERT INTO public.shooting_records (id, user_id, date, location, firearm, caliber, score, rounds, notes, discipline, score_detail, ammo_inventory_id, ammo_name)
SELECT 'f6000001-0000-0000-0000-00000000000d'::uuid, u3,
  '2025-02-22', '帯広射撃場', 'ブローニング BLR', '.30-06', 91, 10, '初の90点台！10点も記録', 'rifle_50m',
  '{"type":"target","shots":[{"n":1,"score":9},{"n":2,"score":9},{"n":3,"score":10},{"n":4,"score":9},{"n":5,"score":9},{"n":6,"score":9},{"n":7,"score":9},{"n":8,"score":9},{"n":9,"score":9},{"n":10,"score":9}]}'::jsonb,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 完了確認
-- ==================================================
SELECT
  'デモデータ挿入完了' AS result,
  (SELECT count(*) FROM public.shooting_records WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids)) AS shooting_records,
  (SELECT count(*) FROM public.hunting_records  WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids)) AS hunting_records,
  (SELECT count(*) FROM public.licenses         WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids)) AS licenses,
  (SELECT count(*) FROM public.hunting_registrations WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids)) AS registrations;

DROP TABLE IF EXISTS _demo_ids;
