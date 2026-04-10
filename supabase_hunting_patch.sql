-- ==================================================
-- 狩猟記録 補完パッチ (hunting_records patch)
-- メインSQLがエラー中断して狩猟記録が入らなかった場合に実行
-- 前提: yamada@demo.com / suzuki@demo.com が auth.users に存在すること
-- ==================================================

DROP TABLE IF EXISTS _demo_ids;
CREATE TEMP TABLE _demo_ids AS
SELECT
  (SELECT id FROM auth.users WHERE email = 'yamada@demo.com') AS u2,
  (SELECT id FROM auth.users WHERE email = 'suzuki@demo.com') AS u3;

SELECT
  CASE WHEN u2 IS NULL THEN 'ERROR: yamada 未存在' ELSE 'OK: yamada = ' || u2::text END AS yamada,
  CASE WHEN u3 IS NULL THEN 'ERROR: suzuki 未存在' ELSE 'OK: suzuki = ' || u3::text END AS suzuki
FROM _demo_ids;

-- ==================================================
-- 依存テーブルを必要最低限だけ補完（既存あればスキップ）
-- ==================================================

-- プロフィール
INSERT INTO public.profiles (id, display_name, is_admin)
SELECT u2, '山田 花子', false FROM _demo_ids WHERE u2 IS NOT NULL
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

INSERT INTO public.profiles (id, display_name, is_admin)
SELECT u3, '鈴木 一郎', false FROM _demo_ids WHERE u3 IS NOT NULL
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

-- チーム
INSERT INTO public.hunting_teams (id, name, description, invite_code, created_by)
SELECT 'a1a10001-0000-0000-0000-000000000001'::uuid, '北海道猟友会',
  '北海道を中心に活動する猟隊。大雪山系・阿寒エリアで巻き狩りを実施。', 'HOKKAI01', u2
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_teams (id, name, description, invite_code, created_by)
SELECT 'a1a10001-0000-0000-0000-000000000002'::uuid, 'アルプス猟隊',
  '南アルプス周辺で活動。シカ・イノシシの個体数管理に協力。', 'ALPS0001', u2
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- チームメンバー
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 'a1a10001-0000-0000-0000-000000000001'::uuid, u2, 'leader' FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (team_id, user_id) DO NOTHING;
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 'a1a10001-0000-0000-0000-000000000001'::uuid, u3, 'member' FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (team_id, user_id) DO NOTHING;
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 'a1a10001-0000-0000-0000-000000000002'::uuid, u2, 'leader' FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (team_id, user_id) DO NOTHING;
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 'a1a10001-0000-0000-0000-000000000002'::uuid, u3, 'member' FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (team_id, user_id) DO NOTHING;

-- 猟場
INSERT INTO public.hunting_grounds (id, user_id, name, prefecture, address, area_ha, terrain, notes, latitude, longitude)
SELECT 'b1b10001-0000-0000-0000-000000000001'::uuid, u2, '大雪山系猟区', '北海道', '上川郡上川町', 500, '山岳', '積雪期は林道閉鎖', 43.723, 142.871
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_grounds (id, user_id, name, prefecture, address, area_ha, terrain, notes, latitude, longitude)
SELECT 'b1b10001-0000-0000-0000-000000000002'::uuid, u2, '阿寒の森', '北海道', '釧路市阿寒町', 350, '森林', '湿地帯あり要注意', 43.446, 144.099
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hunting_grounds (id, user_id, name, prefecture, address, area_ha, terrain, notes, latitude, longitude)
SELECT 'b1b10001-0000-0000-0000-000000000003'::uuid, u2, '南アルプス猟区', '長野県', '伊那市長谷', 800, '高山', '11月から積雪多い', 35.644, 138.227
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- 銃器
INSERT INTO public.firearms (id, user_id, name, type, manufacturer, model, serial_number, caliber, mechanism,
  original_permit_date, original_permit_number, permit_date, permit_number, permit_validity_text, renewal_from, renewal_to, notes)
SELECT 'd1d10001-0000-0000-0000-000000000001'::uuid, u2,
  'レミントン 870 12番', '散弾銃', 'Remington', '870', 'R870-345678', '12番', 'ポンプアクション式',
  '2021-06-15', '210060001', '2026-06-20', '210060201', '令和11年の誕生日まで', '2029-04-01', '2029-05-01', ''
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.firearms (id, user_id, name, type, manufacturer, model, serial_number, caliber, mechanism,
  original_permit_date, original_permit_number, permit_date, permit_number, permit_validity_text, renewal_from, renewal_to, notes)
SELECT 'd1d10001-0000-0000-0000-000000000003'::uuid, u3,
  'ブローニング BLR .30-06', 'ライフル', 'Browning', 'BLR', 'BLR-987654', '.30-06', 'レバーアクション式',
  '2022-05-10', '220050001', '2027-05-08', '220050201', '令和12年の誕生日まで', '2030-03-01', '2030-04-01', '狩猟・標的射撃兼用'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- 弾薬在庫
INSERT INTO public.ammo_inventory (id, user_id, name, caliber, type, quantity, min_quantity, brand, notes)
SELECT 'ee000001-0000-0000-0000-000000000002'::uuid, u2, '12番スラッグ弾', '12番', '実包', 24, 5, 'フェデラル', '狩猟用'
FROM _demo_ids WHERE u2 IS NOT NULL ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ammo_inventory (id, user_id, name, caliber, type, quantity, min_quantity, brand, notes)
SELECT 'ee000001-0000-0000-0000-000000000003'::uuid, u3, '.30-06ライフル弾', '.30-06', '実包', 18, 10, 'レミントン', '狩猟・標的射撃兼用'
FROM _demo_ids WHERE u3 IS NOT NULL ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- 狩猟記録を削除して再挿入
-- ==================================================
DELETE FROM public.hunting_sightings WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.hunting_catches    WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);
DELETE FROM public.hunting_records    WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids);

-- ==================================================
-- 狩猟記録 (山田 花子) 6件
-- ==================================================
INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000001'::uuid, u2,
  '2024-11-20', '南アルプス南面', '長野県', 'タヌキ', 1, '単独忍び猟', '12番スラッグ弾', '晴れ',
  '初猟！単独で1頭仕留めた',
  'b1b10001-0000-0000-0000-000000000003'::uuid, NULL, 2,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '07:00', '12:00', 5, 13, 'd1d10001-0000-0000-0000-000000000001'::uuid, 35.6440, 138.2270
FROM _demo_ids WHERE u2 IS NOT NULL;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000002'::uuid, u2,
  '2024-11-28', '大雪山東麓', '北海道', 'シカ', 1, '巻き狩り', '12番スラッグ弾', '晴れ',
  '北海道猟友会として初参加。1頭仕留め',
  'b1b10001-0000-0000-0000-000000000001'::uuid, 'a1a10001-0000-0000-0000-000000000001'::uuid, 3,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '06:00', '15:00', -2, 3, 'd1d10001-0000-0000-0000-000000000001'::uuid, NULL, NULL
FROM _demo_ids WHERE u2 IS NOT NULL;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000003'::uuid, u2,
  '2024-12-01', '大雪山北面', '北海道', 'シカ', 1, '巻き狩り', '12番スラッグ弾', '曇り',
  'チーム猟に参加。雪中で1頭',
  'b1b10001-0000-0000-0000-000000000001'::uuid, 'a1a10001-0000-0000-0000-000000000001'::uuid, 2,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '06:00', '14:30', -3, 2, 'd1d10001-0000-0000-0000-000000000001'::uuid, NULL, NULL
FROM _demo_ids WHERE u2 IS NOT NULL;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000004'::uuid, u2,
  '2024-12-20', '南アルプス北面', '長野県', 'イノシシ', 2, '巻き狩り', '12番スラッグ弾', '曇り',
  'アルプス猟隊として初の大型猟。2頭捕獲',
  'b1b10001-0000-0000-0000-000000000003'::uuid, 'a1a10001-0000-0000-0000-000000000002'::uuid, 5,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '06:30', '14:00', 1, 8, 'd1d10001-0000-0000-0000-000000000001'::uuid, 35.6600, 138.2420
FROM _demo_ids WHERE u2 IS NOT NULL;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000005'::uuid, u2,
  '2025-01-05', '伊那谷', '長野県', 'キジ', 2, '待ち猟', '12番スラッグ弾', '晴れ',
  '良い天気の中キジ2羽',
  'b1b10001-0000-0000-0000-000000000003'::uuid, NULL, 4,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '08:00', '13:00', 3, 9, 'd1d10001-0000-0000-0000-000000000001'::uuid, NULL, NULL
FROM _demo_ids WHERE u2 IS NOT NULL;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000006'::uuid, u2,
  '2025-01-25', '南アルプス深山', '長野県', 'イノシシ', 2, '巻き狩り', '12番スラッグ弾', '雪',
  '雪中で2頭捕獲。今シーズン最高の成果',
  'b1b10001-0000-0000-0000-000000000003'::uuid, 'a1a10001-0000-0000-0000-000000000002'::uuid, 4,
  'ee000001-0000-0000-0000-000000000002'::uuid, '12番スラッグ弾',
  '07:00', '15:30', -2, 4, 'd1d10001-0000-0000-0000-000000000001'::uuid, 35.6700, 138.2150
FROM _demo_ids WHERE u2 IS NOT NULL;

-- ==================================================
-- 狩猟記録 (鈴木 一郎) 5件
-- ==================================================
INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000007'::uuid, u3,
  '2024-11-28', '大雪山東麓', '北海道', 'イノシシ', 1, '巻き狩り', '.30-06', '晴れ',
  'ライフルで急斜面から飛び出たイノシシを捕獲',
  'b1b10001-0000-0000-0000-000000000001'::uuid, 'a1a10001-0000-0000-0000-000000000001'::uuid, 2,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾',
  '06:00', '15:00', -2, 3, 'd1d10001-0000-0000-0000-000000000003'::uuid, NULL, NULL
FROM _demo_ids WHERE u3 IS NOT NULL;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000008'::uuid, u3,
  '2024-12-01', '大雪山北面', '北海道', 'イノシシ', 1, '巻き狩り', '.30-06', '曇り',
  '北海道猟友会チーム猟。ライフルで1頭',
  'b1b10001-0000-0000-0000-000000000001'::uuid, 'a1a10001-0000-0000-0000-000000000001'::uuid, 1,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾',
  '06:00', '14:30', -3, 2, 'd1d10001-0000-0000-0000-000000000003'::uuid, NULL, NULL
FROM _demo_ids WHERE u3 IS NOT NULL;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-000000000009'::uuid, u3,
  '2025-01-15', '大雪山系', '北海道', 'シカ', 1, '単独忍び猟', '.30-06', '曇り',
  '単独で1頭仕留め。朝イチの移動時間を狙った',
  'b1b10001-0000-0000-0000-000000000001'::uuid, NULL, 2,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾',
  '05:00', '12:00', -5, 1, 'd1d10001-0000-0000-0000-000000000003'::uuid, NULL, NULL
FROM _demo_ids WHERE u3 IS NOT NULL;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-00000000000a'::uuid, u3,
  '2025-01-25', '南アルプス深山', '長野県', 'シカ', 1, '巻き狩り', '.30-06', '雪',
  'アルプス猟隊に参加。ライフルで1頭仕留め',
  'b1b10001-0000-0000-0000-000000000003'::uuid, 'a1a10001-0000-0000-0000-000000000002'::uuid, 2,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾',
  '07:00', '15:30', -2, 4, 'd1d10001-0000-0000-0000-000000000003'::uuid, NULL, NULL
FROM _demo_ids WHERE u3 IS NOT NULL;

INSERT INTO public.hunting_records (id, user_id, date, location, prefecture, game, count, method, ammo_used, weather, notes, ground_id, team_id, rounds_fired, ammo_inventory_id, ammo_name, departure_time, return_time, temperature_min, temperature_max, firearm_id, latitude, longitude)
SELECT 'f0300001-0000-0000-0000-00000000000b'::uuid, u3,
  '2025-02-10', '阿寒湖西岸', '北海道', 'シカ', 0, '巻き狩り', '.30-06', '雪',
  '射撃機会あり、惜しくも取り逃がす',
  'b1b10001-0000-0000-0000-000000000002'::uuid, 'a1a10001-0000-0000-0000-000000000001'::uuid, 2,
  'ee000001-0000-0000-0000-000000000003'::uuid, '.30-06ライフル弾',
  '05:30', '13:30', -8, -2, 'd1d10001-0000-0000-0000-000000000003'::uuid, NULL, NULL
FROM _demo_ids WHERE u3 IS NOT NULL;

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
-- 完了確認
-- ==================================================
SELECT
  '狩猟記録パッチ完了' AS result,
  (SELECT count(*) FROM public.hunting_records WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids)) AS hunting_records,
  (SELECT count(*) FROM public.hunting_catches  WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids)) AS catches,
  (SELECT count(*) FROM public.hunting_sightings WHERE user_id IN (SELECT u2 FROM _demo_ids UNION SELECT u3 FROM _demo_ids)) AS sightings;

DROP TABLE IF EXISTS _demo_ids;
