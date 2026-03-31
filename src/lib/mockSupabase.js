// =====================================================
// Mock Supabase Client — デモ/テスト用
// =====================================================

// ── デモユーザー ───────────────────────────────────────────
const DEMO_USERS = [
  { id: 'demo-u1', email: 'tanaka@demo.com',  password: 'demo1234' },
  { id: 'demo-u2', email: 'yamada@demo.com',  password: 'demo1234' },
  { id: 'demo-u3', email: 'suzuki@demo.com',  password: 'demo1234' },
]

// ── インメモリDB ───────────────────────────────────────────
let db = {
  profiles: [
    { id: 'demo-u1', display_name: '田中 太郎', is_admin: true,  created_at: '2024-04-01T00:00:00Z' },
    { id: 'demo-u2', display_name: '山田 花子', is_admin: false, created_at: '2024-04-05T00:00:00Z' },
    { id: 'demo-u3', display_name: '鈴木 一郎', is_admin: false, created_at: '2024-05-10T00:00:00Z' },
  ],

  hunting_grounds: [
    { id: 'gnd-1', user_id: 'demo-u1', name: '大雪山系猟区', prefecture: '北海道', address: '上川郡上川町', area_ha: 500, terrain: '山岳',  notes: '積雪期は林道閉鎖', latitude: 43.723, longitude: 142.871, created_at: '2024-09-01T00:00:00Z' },
    { id: 'gnd-2', user_id: 'demo-u1', name: '阿寒の森',     prefecture: '北海道', address: '釧路市阿寒町',  area_ha: 350, terrain: '森林',  notes: '湿地帯あり要注意',   latitude: 43.446, longitude: 144.099, created_at: '2024-09-15T00:00:00Z' },
    { id: 'gnd-3', user_id: 'demo-u2', name: '南アルプス猟区', prefecture: '長野県', address: '伊那市長谷',   area_ha: 800, terrain: '高山',  notes: '11月〜積雪多い',     latitude: 35.644, longitude: 138.227, created_at: '2024-10-01T00:00:00Z' },
  ],

  shooting_ranges: [
    { id: 'rng-1', user_id: 'demo-u1', name: '札幌射撃場',   prefecture: '北海道', address: '札幌市清田区羊ヶ丘',   notes: '公営。クレー各種・ライフル対応', created_at: '2024-09-01T00:00:00Z' },
    { id: 'rng-2', user_id: 'demo-u1', name: '旭川射撃場',   prefecture: '北海道', address: '旭川市神居町',          notes: 'トラップ専用', created_at: '2024-09-01T00:00:00Z' },
    { id: 'rng-3', user_id: 'demo-u2', name: '伊那射撃場',   prefecture: '長野県', address: '伊那市高遠町',          notes: 'クレー専用', created_at: '2024-10-01T00:00:00Z' },
    { id: 'rng-4', user_id: 'demo-u3', name: '帯広射撃場',   prefecture: '北海道', address: '帯広市西22条南8丁目',   notes: 'ライフル専用コースあり', created_at: '2024-09-15T00:00:00Z' },
  ],

  shooting_records: [
    { id: 'sht-1', user_id: 'demo-u1', date: '2024-10-05', range_id: 'rng-1', location: '札幌射撃場', firearm_id: 'gun-1', firearm: 'ブローニングBPS', caliber: '12番', discipline: 'jp_trap',    score: 22, rounds: 25, notes: '和式トラップ練習', ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', score_detail: {type:'trap',shots:[{n:1,hit:true,dir:'right',shotNum:1},{n:2,hit:true,dir:'center',shotNum:1},{n:3,hit:false,dir:null,shotNum:null},{n:4,hit:true,dir:'left',shotNum:2},{n:5,hit:true,dir:'right',shotNum:1},{n:6,hit:true,dir:'center',shotNum:1},{n:7,hit:true,dir:'right',shotNum:1},{n:8,hit:false,dir:null,shotNum:null},{n:9,hit:true,dir:'left',shotNum:1},{n:10,hit:true,dir:'center',shotNum:2},{n:11,hit:true,dir:'right',shotNum:1},{n:12,hit:true,dir:'left',shotNum:1},{n:13,hit:true,dir:'center',shotNum:1},{n:14,hit:false,dir:null,shotNum:null},{n:15,hit:true,dir:'right',shotNum:2},{n:16,hit:true,dir:'left',shotNum:1},{n:17,hit:true,dir:'center',shotNum:1},{n:18,hit:true,dir:'right',shotNum:1},{n:19,hit:true,dir:'center',shotNum:1},{n:20,hit:true,dir:'left',shotNum:2},{n:21,hit:true,dir:'right',shotNum:1},{n:22,hit:true,dir:'center',shotNum:1},{n:23,hit:true,dir:'left',shotNum:1},{n:24,hit:true,dir:'right',shotNum:1},{n:25,hit:true,dir:'center',shotNum:1}]}, created_at: '2024-10-05T09:00:00Z' },
    { id: 'sht-2', user_id: 'demo-u1', date: '2024-11-10', range_id: 'rng-2', location: '旭川射撃場', firearm_id: 'gun-1', firearm: 'ブローニングBPS', caliber: '12番', discipline: 'intl_trap',  score: 23, rounds: 25, notes: '好調、クレーをよく見られた',   ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', score_detail: {type:'trap',shots:[{n:1,hit:true,dir:'center',shotNum:1},{n:2,hit:true,dir:'left',shotNum:1},{n:3,hit:true,dir:'right',shotNum:1},{n:4,hit:true,dir:'center',shotNum:1},{n:5,hit:true,dir:'left',shotNum:1},{n:6,hit:true,dir:'right',shotNum:1},{n:7,hit:true,dir:'center',shotNum:2},{n:8,hit:true,dir:'left',shotNum:1},{n:9,hit:true,dir:'right',shotNum:1},{n:10,hit:false,dir:null,shotNum:null},{n:11,hit:true,dir:'center',shotNum:1},{n:12,hit:true,dir:'left',shotNum:1},{n:13,hit:true,dir:'right',shotNum:1},{n:14,hit:true,dir:'center',shotNum:1},{n:15,hit:true,dir:'left',shotNum:2},{n:16,hit:true,dir:'right',shotNum:1},{n:17,hit:true,dir:'center',shotNum:1},{n:18,hit:true,dir:'left',shotNum:1},{n:19,hit:true,dir:'right',shotNum:1},{n:20,hit:false,dir:null,shotNum:null},{n:21,hit:true,dir:'center',shotNum:1},{n:22,hit:true,dir:'left',shotNum:1},{n:23,hit:true,dir:'right',shotNum:1},{n:24,hit:true,dir:'center',shotNum:2},{n:25,hit:true,dir:'left',shotNum:1}]}, created_at: '2024-11-10T10:00:00Z' },
    { id: 'sht-3', user_id: 'demo-u1', date: '2025-01-05', range_id: 'rng-1', location: '札幌射撃場', firearm_id: 'gun-1', firearm: 'ブローニングBPS', caliber: '12番', discipline: 'jp_trap',    score: 20, rounds: 25, notes: '寒さで体が固まった',         ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', score_detail: null, created_at: '2025-01-05T09:30:00Z' },
    { id: 'sht-4', user_id: 'demo-u1', date: '2025-02-20', range_id: 'rng-1', location: '札幌射撃場', firearm_id: 'gun-1', firearm: 'ブローニングBPS', caliber: '12番', discipline: 'intl_trap',  score: 24, rounds: 25, notes: 'ベストスコア更新！',         ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', score_detail: null, created_at: '2025-02-20T09:00:00Z' },
    { id: 'sht-5', user_id: 'demo-u2', date: '2024-10-15', range_id: 'rng-3', location: '伊那射撃場', firearm_id: 'gun-3', firearm: 'レミントン870',   caliber: '12番', discipline: 'jp_trap',    score: 18, rounds: 25, notes: 'トラップ初参加',             ammo_inventory_id: 'ammo-3', ammo_name: '12番スラッグ弾', score_detail: null, created_at: '2024-10-15T10:00:00Z' },
    { id: 'sht-6', user_id: 'demo-u2', date: '2024-12-10', range_id: 'rng-3', location: '伊那射撃場', firearm_id: 'gun-3', firearm: 'レミントン870',   caliber: '12番', discipline: 'jp_skeet',   score: 21, rounds: 25, notes: 'スキートに挑戦、上達してきた', ammo_inventory_id: 'ammo-3', ammo_name: '12番スラッグ弾', score_detail: {type:'skeet',stations:[{st:1,h:true,h_shotNum:1,l:true,l_shotNum:1,dh:true,dl:false},{st:2,h:true,h_shotNum:1,l:false,l_shotNum:null,dh:true,dl:true},{st:3,h:true,h_shotNum:1,l:true,l_shotNum:2},{st:4,h:true,h_shotNum:1,l:false,l_shotNum:null},{st:5,h:false,h_shotNum:null,l:true,l_shotNum:1},{st:6,h:true,h_shotNum:2,l:true,l_shotNum:1,dh:false,dl:true},{st:7,h:true,h_shotNum:1,l:true,l_shotNum:1,dh:true,dl:null},{st:8,h:true,h_shotNum:1,l:null,l_shotNum:null}]}, created_at: '2024-12-10T10:00:00Z' },
    { id: 'sht-7', user_id: 'demo-u3', date: '2024-11-20', range_id: 'rng-4', location: '帯広射撃場', firearm_id: 'gun-2', firearm: 'ウィンチェスター M70', caliber: '.30-06', discipline: 'rifle_50m', score: 81, rounds: 10, notes: 'ライフル50m練習', ammo_inventory_id: 'ammo-4', ammo_name: '.30-06', score_detail: {type:'target',shots:[{n:1,score:9},{n:2,score:8},{n:3,score:8},{n:4,score:9},{n:5,score:8},{n:6,score:7},{n:7,score:9},{n:8,score:8},{n:9,score:7},{n:10,score:8}]}, created_at: '2024-11-20T09:00:00Z' },
    { id: 'sht-8', user_id: 'demo-u3', date: '2025-01-15', range_id: 'rng-4', location: '帯広射撃場', firearm_id: 'gun-2', firearm: 'ウィンチェスター M70', caliber: '.30-06', discipline: 'rifle_50m', score: 89, rounds: 10, notes: '集弾性が上がってきた', ammo_inventory_id: 'ammo-4', ammo_name: '.30-06', score_detail: {type:'target',shots:[{n:1,score:9},{n:2,score:9},{n:3,score:8},{n:4,score:10},{n:5,score:9},{n:6,score:8},{n:7,score:9},{n:8,score:9},{n:9,score:9},{n:10,score:9}]}, created_at: '2025-01-15T09:00:00Z' },
  ],

  hunting_records: [
    { id: 'hnt-1', user_id: 'demo-u1', date: '2024-11-15', location: '大雪山麓',      prefecture: '北海道', game: 'イノシシ', count: 2, method: '単独忍び猟', ammo_used: '12番スラッグ弾', weather: '晴れ', notes: '早朝から潜伏、2頭確認',   ground_id: 'gnd-1', team_id: null,    rounds_fired: 3, ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', departure_time: '05:30', return_time: '13:00', temperature_min: 1,   temperature_max: 6,  firearm_id: 'gun-1', latitude: 43.7230, longitude: 142.8710, created_at: '2024-11-15T13:00:00Z' },
    { id: 'hnt-2', user_id: 'demo-u1', date: '2024-12-01', location: '大雪山北面',   prefecture: '北海道', game: 'イノシシ', count: 3, method: '巻き狩り',   ammo_used: '12番スラッグ弾', weather: '曇り', notes: '隊で包囲、大成功',       ground_id: 'gnd-1', team_id: 'team-1', rounds_fired: 6, ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', departure_time: '06:00', return_time: '14:30', temperature_min: -3,  temperature_max: 2,  firearm_id: 'gun-1', latitude: 43.7310, longitude: 142.8820, created_at: '2024-12-01T14:30:00Z' },
    { id: 'hnt-3', user_id: 'demo-u1', date: '2025-01-10', location: '阿寒湖畔',    prefecture: '北海道', game: 'シカ',   count: 1, method: '待ち猟',     ammo_used: '12番スラッグ弾', weather: '晴れ', notes: 'エゾシカの群れを待った', ground_id: 'gnd-2', team_id: null,    rounds_fired: 2, ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', departure_time: '04:00', return_time: '11:00', temperature_min: -10, temperature_max: -4, firearm_id: 'gun-1', latitude: 43.4460, longitude: 144.0990, created_at: '2025-01-10T11:00:00Z' },
    { id: 'hnt-4', user_id: 'demo-u1', date: '2025-01-20', location: '大雪山東麓',  prefecture: '北海道', game: 'シカ',   count: 2, method: '単独忍び猟', ammo_used: '12番スラッグ弾', weather: '雪',   notes: '雪中で良い猟ができた',   ground_id: 'gnd-1', team_id: null,    rounds_fired: 3, ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', departure_time: '06:00', return_time: '15:00', temperature_min: -7,  temperature_max: -1, firearm_id: 'gun-1', latitude: 43.7450, longitude: 142.8930, created_at: '2025-01-20T15:00:00Z' },
    { id: 'hnt-5', user_id: 'demo-u2', date: '2024-11-20', location: '南アルプス南面', prefecture: '長野県', game: 'タヌキ', count: 1, method: '単独忍び猟', ammo_used: '12番スラッグ弾', weather: '晴れ', notes: '初猟！',             ground_id: 'gnd-3', team_id: null,    rounds_fired: 2, ammo_inventory_id: 'ammo-3', ammo_name: '12番スラッグ弾', departure_time: '07:00', return_time: '12:00', temperature_min: 5,   temperature_max: 13, firearm_id: 'gun-3', latitude: 35.6440, longitude: 138.2270, created_at: '2024-11-20T12:00:00Z' },
    { id: 'hnt-6', user_id: 'demo-u2', date: '2024-12-01', location: '大雪山北面',  prefecture: '北海道', game: 'シカ',   count: 1, method: '巻き狩り',   ammo_used: '12番スラッグ弾', weather: '曇り', notes: 'チーム猟に参加',       ground_id: 'gnd-1', team_id: 'team-1', rounds_fired: 2, ammo_inventory_id: 'ammo-3', ammo_name: '12番スラッグ弾', departure_time: '06:00', return_time: '14:30', temperature_min: -3,  temperature_max: 2,  firearm_id: 'gun-3', latitude: null, longitude: null, created_at: '2024-12-01T14:31:00Z' },
    { id: 'hnt-7', user_id: 'demo-u2', date: '2025-01-05', location: '伊那谷',      prefecture: '長野県', game: 'キジ',   count: 2, method: '待ち猟',     ammo_used: '12番スラッグ弾', weather: '晴れ', notes: '良い天気の中猟',       ground_id: 'gnd-3', team_id: null,    rounds_fired: 4, ammo_inventory_id: 'ammo-3', ammo_name: '12番スラッグ弾', departure_time: '08:00', return_time: '13:00', temperature_min: 3,   temperature_max: 9,  firearm_id: 'gun-3', latitude: null, longitude: null, created_at: '2025-01-05T13:00:00Z' },
    { id: 'hnt-8', user_id: 'demo-u3', date: '2024-12-01', location: '大雪山北面',  prefecture: '北海道', game: 'イノシシ', count: 1, method: '巻き狩り', ammo_used: '.30-06',         weather: '曇り', notes: 'チーム猟',             ground_id: 'gnd-1', team_id: 'team-1', rounds_fired: 1, ammo_inventory_id: 'ammo-4', ammo_name: '.30-06', departure_time: '06:00', return_time: '14:30', temperature_min: -3,  temperature_max: 2,  firearm_id: null, latitude: null, longitude: null, created_at: '2024-12-01T14:32:00Z' },
    { id: 'hnt-9',  user_id: 'demo-u3', date: '2025-01-15', location: '大雪山系',      prefecture: '北海道', game: 'イノシシ', count: 1, method: '単独忍び猟', ammo_used: '.30-06',         weather: '曇り', notes: '単独で1頭仕留めた',             ground_id: 'gnd-1', team_id: null,    rounds_fired: 2, ammo_inventory_id: 'ammo-4', ammo_name: '.30-06',         departure_time: '05:00', return_time: '12:00', temperature_min:  -5, temperature_max:  1, firearm_id: null,    latitude: null,    longitude: null,    created_at: '2025-01-15T12:00:00Z' },
    // ── 追加チーム猟記録 ────────────────────────────────────────────────────────────────
    // 2024-11-28 team-1 大雪山東麓巻き狩り（u1 主催・u2・u3 参加）
    { id: 'hnt-10', user_id: 'demo-u1', date: '2024-11-28', location: '大雪山東麓',    prefecture: '北海道', game: 'シカ',     count: 2, method: '巻き狩り',   ammo_used: '12番スラッグ弾', weather: '晴れ', notes: '2頭仕留め。山田・鈴木も活躍',   ground_id: 'gnd-1', team_id: 'team-1', rounds_fired: 4, ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', departure_time: '06:00', return_time: '15:00', temperature_min:  -2, temperature_max:  3, firearm_id: 'gun-1', latitude: 43.7280, longitude: 142.8750, created_at: '2024-11-28T15:00:00Z' },
    { id: 'hnt-11', user_id: 'demo-u2', date: '2024-11-28', location: '大雪山東麓',    prefecture: '北海道', game: 'シカ',     count: 1, method: '巻き狩り',   ammo_used: '12番スラッグ弾', weather: '晴れ', notes: '田中さんの猟隊に参加、1頭仕留め', ground_id: 'gnd-1', team_id: 'team-1', rounds_fired: 3, ammo_inventory_id: 'ammo-3', ammo_name: '12番スラッグ弾', departure_time: '06:00', return_time: '15:00', temperature_min:  -2, temperature_max:  3, firearm_id: 'gun-3', latitude: null,    longitude: null,    created_at: '2024-11-28T15:01:00Z' },
    { id: 'hnt-12', user_id: 'demo-u3', date: '2024-11-28', location: '大雪山東麓',    prefecture: '北海道', game: 'イノシシ', count: 1, method: '巻き狩り',   ammo_used: '.30-06',         weather: '晴れ', notes: '急斜面から飛び出たイノシシを捕獲', ground_id: 'gnd-1', team_id: 'team-1', rounds_fired: 2, ammo_inventory_id: 'ammo-4', ammo_name: '.30-06',         departure_time: '06:00', return_time: '15:00', temperature_min:  -2, temperature_max:  3, firearm_id: 'gun-4', latitude: null,    longitude: null,    created_at: '2024-11-28T15:02:00Z' },
    // 2024-12-20 team-2 南アルプス北面巻き狩り（u2 主催・u1 参加）
    { id: 'hnt-13', user_id: 'demo-u2', date: '2024-12-20', location: '南アルプス北面', prefecture: '長野県', game: 'イノシシ', count: 2, method: '巻き狩り',   ammo_used: '12番スラッグ弾', weather: '曇り', notes: 'アルプス猟隊として初の大型猟',   ground_id: 'gnd-3', team_id: 'team-2', rounds_fired: 5, ammo_inventory_id: 'ammo-3', ammo_name: '12番スラッグ弾', departure_time: '06:30', return_time: '14:00', temperature_min:   1, temperature_max:  8, firearm_id: 'gun-3', latitude: 35.6600, longitude: 138.2420, created_at: '2024-12-20T14:00:00Z' },
    { id: 'hnt-14', user_id: 'demo-u1', date: '2024-12-20', location: '南アルプス北面', prefecture: '長野県', game: 'イノシシ', count: 1, method: '巻き狩り',   ammo_used: '12番スラッグ弾', weather: '曇り', notes: 'アルプス猟隊に客員参加',         ground_id: 'gnd-3', team_id: 'team-2', rounds_fired: 3, ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', departure_time: '06:30', return_time: '14:00', temperature_min:   1, temperature_max:  8, firearm_id: 'gun-1', latitude: null,    longitude: null,    created_at: '2024-12-20T14:01:00Z' },
    // 2025-02-10 team-1 阿寒湖西岸巻き狩り（u1 主催・u3 参加）
    { id: 'hnt-15', user_id: 'demo-u1', date: '2025-02-10', location: '阿寒湖西岸',    prefecture: '北海道', game: 'シカ',     count: 3, method: '巻き狩り',   ammo_used: '12番スラッグ弾', weather: '雪',   notes: '今季最高の成果！湖岸に密集していた', ground_id: 'gnd-2', team_id: 'team-1', rounds_fired: 5, ammo_inventory_id: 'ammo-1', ammo_name: '12番スラッグ弾', departure_time: '05:30', return_time: '13:30', temperature_min:  -8, temperature_max: -2, firearm_id: 'gun-1', latitude: 43.4550, longitude: 144.0880, created_at: '2025-02-10T13:30:00Z' },
    { id: 'hnt-16', user_id: 'demo-u3', date: '2025-02-10', location: '阿寒湖西岸',    prefecture: '北海道', game: 'シカ',     count: 0, method: '巻き狩り',   ammo_used: '.30-06',         weather: '雪',   notes: '射撃機会あり、惜しくも取り逃がす',  ground_id: 'gnd-2', team_id: 'team-1', rounds_fired: 2, ammo_inventory_id: 'ammo-4', ammo_name: '.30-06',         departure_time: '05:30', return_time: '13:30', temperature_min:  -8, temperature_max: -2, firearm_id: 'gun-4', latitude: null,    longitude: null,    created_at: '2025-02-10T13:31:00Z' },
    // 2025-01-25 team-3 信州猟隊 南アルプス深山（u2 主催・u3 参加）
    { id: 'hnt-17', user_id: 'demo-u2', date: '2025-01-25', location: '南アルプス深山', prefecture: '長野県', game: 'イノシシ', count: 2, method: '巻き狩り',   ammo_used: '12番スラッグ弾', weather: '雪',   notes: '信州猟隊初出猟！雪中で2頭捕獲',    ground_id: 'gnd-3', team_id: 'team-3', rounds_fired: 4, ammo_inventory_id: 'ammo-3', ammo_name: '12番スラッグ弾', departure_time: '07:00', return_time: '15:30', temperature_min:  -2, temperature_max:  4, firearm_id: 'gun-3', latitude: 35.6700, longitude: 138.2150, created_at: '2025-01-25T15:30:00Z' },
    { id: 'hnt-18', user_id: 'demo-u3', date: '2025-01-25', location: '南アルプス深山', prefecture: '長野県', game: 'シカ',     count: 1, method: '巻き狩り',   ammo_used: '.30-06',         weather: '雪',   notes: '信州猟隊に参加、ライフルで1頭',     ground_id: 'gnd-3', team_id: 'team-3', rounds_fired: 2, ammo_inventory_id: 'ammo-4', ammo_name: '.30-06',         departure_time: '07:00', return_time: '15:30', temperature_min:  -2, temperature_max:  4, firearm_id: 'gun-4', latitude: null,    longitude: null,    created_at: '2025-01-25T15:31:00Z' },
  ],

  hunting_catches: [
    // hnt-2 (2024-12-01 巻き狩り team-1) の捕獲タイムライン
    { id: 'ctch-1', hunting_record_id: 'hnt-2', user_id: 'demo-u1', catch_time: '07:30', game: 'イノシシ', count: 1, notes: '沢沿いで発見',     shooter_user_id: 'demo-u2', catch_lat: 43.7220, catch_lng: 142.8730, created_at: '2024-12-01T07:30:00Z' },
    { id: 'ctch-2', hunting_record_id: 'hnt-2', user_id: 'demo-u1', catch_time: '09:15', game: 'イノシシ', count: 1, notes: '林道付近',         shooter_user_id: 'demo-u3', catch_lat: 43.7270, catch_lng: 142.8790, created_at: '2024-12-01T09:15:00Z' },
    { id: 'ctch-3', hunting_record_id: 'hnt-2', user_id: 'demo-u1', catch_time: '10:45', game: 'イノシシ', count: 1, notes: '尾根で待ち伏せ',   shooter_user_id: 'demo-u1', catch_lat: 43.7180, catch_lng: 142.8660, created_at: '2024-12-01T10:45:00Z' },
    // hnt-1 (2024-11-15 単独忍び猟) の捕獲タイムライン
    { id: 'ctch-4', hunting_record_id: 'hnt-1', user_id: 'demo-u1', catch_time: '06:45', game: 'イノシシ', count: 1, notes: '小屋の裏',         shooter_user_id: null,      catch_lat: 43.7215, catch_lng: 142.8695, created_at: '2024-11-15T06:45:00Z' },
    { id: 'ctch-5', hunting_record_id: 'hnt-1', user_id: 'demo-u1', catch_time: '09:30', game: 'イノシシ', count: 1, notes: '追って2頭目',     shooter_user_id: null,      catch_lat: 43.7245, catch_lng: 142.8725, created_at: '2024-11-15T09:30:00Z' },
    // hnt-10 (2024-11-28 巻き狩り team-1) の捕獲タイムライン
    { id: 'ctch-6', hunting_record_id: 'hnt-10', user_id: 'demo-u1', catch_time: '07:45', game: 'シカ',     count: 1, notes: '林の縁で待機',   shooter_user_id: 'demo-u2', catch_lat: 43.7285, catch_lng: 142.8755, created_at: '2024-11-28T07:45:00Z' },
    { id: 'ctch-7', hunting_record_id: 'hnt-10', user_id: 'demo-u1', catch_time: '10:20', game: 'シカ',     count: 1, notes: '沢を渡ったところ', shooter_user_id: 'demo-u1', catch_lat: 43.7295, catch_lng: 142.8770, created_at: '2024-11-28T10:20:00Z' },
    // hnt-13 (2024-12-20 巻き狩り team-2) の捕獲タイムライン
    { id: 'ctch-8', hunting_record_id: 'hnt-13', user_id: 'demo-u2', catch_time: '08:30', game: 'イノシシ', count: 1, notes: '稜線付近',         shooter_user_id: 'demo-u1', catch_lat: 35.6620, catch_lng: 138.2410, created_at: '2024-12-20T08:30:00Z' },
    { id: 'ctch-9', hunting_record_id: 'hnt-13', user_id: 'demo-u2', catch_time: '11:15', game: 'イノシシ', count: 1, notes: '谷筋の笹藪',       shooter_user_id: 'demo-u2', catch_lat: 35.6580, catch_lng: 138.2380, created_at: '2024-12-20T11:15:00Z' },
    // hnt-15 (2025-02-10 巻き狩り team-1) の捕獲タイムライン
    { id: 'ctch-10', hunting_record_id: 'hnt-15', user_id: 'demo-u1', catch_time: '06:30', game: 'シカ',    count: 2, notes: '湖畔の開けた場所', shooter_user_id: 'demo-u1', catch_lat: 43.4560, catch_lng: 144.0880, created_at: '2025-02-10T06:30:00Z' },
    { id: 'ctch-11', hunting_record_id: 'hnt-15', user_id: 'demo-u1', catch_time: '08:45', game: 'シカ',    count: 1, notes: '林道脇の茂み',     shooter_user_id: 'demo-u3', catch_lat: 43.4540, catch_lng: 144.0860, created_at: '2025-02-10T08:45:00Z' },
    // hnt-17 (2025-01-25 巻き狩り team-3) の捕獲タイムライン
    { id: 'ctch-12', hunting_record_id: 'hnt-17', user_id: 'demo-u2', catch_time: '09:00', game: 'イノシシ', count: 1, notes: '沢沿いの斜面',    shooter_user_id: 'demo-u2', catch_lat: 35.6710, catch_lng: 138.2160, created_at: '2025-01-25T09:00:00Z' },
    { id: 'ctch-13', hunting_record_id: 'hnt-17', user_id: 'demo-u2', catch_time: '11:30', game: 'イノシシ', count: 1, notes: '落葉松林の中',    shooter_user_id: 'demo-u3', catch_lat: 35.6690, catch_lng: 138.2140, created_at: '2025-01-25T11:30:00Z' },
  ],

  ammo_inventory: [
    { id: 'ammo-1', user_id: 'demo-u1', name: '12番スラッグ弾',   caliber: '12番',   type: '実包', quantity: 35, min_quantity: 10, brand: '住友',          notes: 'イノシシ・シカ用', created_at: '2024-09-01T00:00:00Z' },
    { id: 'ammo-2', user_id: 'demo-u1', name: '.30-06ライフル弾', caliber: '.30-06', type: '実包', quantity: 28, min_quantity:  5, brand: 'ウィンチェスター', notes: '長距離用', created_at: '2024-09-01T00:00:00Z' },
    { id: 'ammo-3', user_id: 'demo-u2', name: '12番スラッグ弾',   caliber: '12番',   type: '実包', quantity: 30, min_quantity:  5, brand: 'フェデラル',     notes: '', created_at: '2024-10-01T00:00:00Z' },
    { id: 'ammo-4', user_id: 'demo-u3', name: '.30-06ライフル弾', caliber: '.30-06', type: '実包', quantity: 21, min_quantity: 10, brand: 'レミントン',     notes: '', created_at: '2024-09-15T00:00:00Z' },
  ],

  licenses: [
    { id: 'lic-1', user_id: 'demo-u1', name: '第一種銃猟免許',          license_number: '北海01-12345', issued_date: '2023-04-01', expiry_date: '2027-03-31', issuer: '北海道知事',   notes: '', created_at: '2024-01-01T00:00:00Z' },
    { id: 'lic-2', user_id: 'demo-u1', name: '猟銃所持許可証（散弾銃）', license_number: '札北01-98765', issued_date: '2024-09-01', expiry_date: '2026-08-31', issuer: '北海道警察',   notes: 'ブローニングBPS', created_at: '2024-09-01T00:00:00Z' },
    { id: 'lic-3', user_id: 'demo-u2', name: '第一種銃猟免許',          license_number: '長野01-54321', issued_date: '2024-04-01', expiry_date: '2028-03-31', issuer: '長野県知事',   notes: '', created_at: '2024-04-01T00:00:00Z' },
    { id: 'lic-4', user_id: 'demo-u3', name: '第一種銃猟免許',          license_number: '北海01-11111', issued_date: '2024-04-01', expiry_date: '2026-03-31', issuer: '北海道知事',   notes: '更新要確認', created_at: '2024-04-01T00:00:00Z' },
  ],

  firearms: [
    { id: 'gun-1', user_id: 'demo-u1', name: 'ブローニングBPS 12番', type: '散弾銃', manufacturer: 'Browning', model: 'BPS', serial_number: 'BPS-123456', caliber: '12番', permit_number: '札北01-98765', permit_expiry: '2026-08-31', permit_issuer: '北海道警察 札幌北警察署', safe_storage: '専用ロッカー（スチール製）', notes: 'メインの狩猟銃', created_at: '2024-09-01T00:00:00Z' },
    { id: 'gun-2', user_id: 'demo-u1', name: 'ウィンチェスター M70 .30-06', type: 'ライフル', manufacturer: 'Winchester', model: 'Model 70', serial_number: 'M70-789012', caliber: '.30-06', permit_number: '札北01-88888', permit_expiry: '2027-03-31', permit_issuer: '北海道警察 札幌北警察署', safe_storage: '専用ロッカー（スチール製）', notes: '長距離ライフル', created_at: '2024-09-01T00:00:00Z' },
    { id: 'gun-3', user_id: 'demo-u2', name: 'レミントン 870 12番', type: '散弾銃', manufacturer: 'Remington', model: '870', serial_number: 'R870-345678', caliber: '12番', permit_number: '長野01-22222', permit_expiry: '2028-06-30', permit_issuer: '長野県警察 伊那警察署', safe_storage: '専用ロッカー', notes: '', created_at: '2024-10-01T00:00:00Z' },
    { id: 'gun-4', user_id: 'demo-u3', name: 'ウィンチェスター SXP 12番', type: '散弾銃', manufacturer: 'Winchester', model: 'SXP', serial_number: 'SXP-654321', caliber: '12番', permit_number: '北海01-33333', permit_expiry: '2026-06-30', permit_issuer: '北海道警察 帯広警察署', safe_storage: '専用ロッカー', notes: '', created_at: '2024-09-15T00:00:00Z' },
  ],

  hunting_registrations: [
    { id: 'reg-1', user_id: 'demo-u1', season_year: 2024, prefecture: '北海道', license_type: '第一種', registration_number: '北海2024-01234', valid_from: '2024-11-01', valid_to: '2025-03-31', fee_paid: 16500, notes: 'エゾシカ・ヒグマ・キツネ等', created_at: '2024-10-15T00:00:00Z' },
    { id: 'reg-2', user_id: 'demo-u1', season_year: 2023, prefecture: '北海道', license_type: '第一種', registration_number: '北海2023-00876', valid_from: '2023-11-01', valid_to: '2024-03-31', fee_paid: 16500, notes: '', created_at: '2023-10-10T00:00:00Z' },
    { id: 'reg-3', user_id: 'demo-u2', season_year: 2024, prefecture: '長野県', license_type: '第一種', registration_number: '長野2024-05678', valid_from: '2024-11-15', valid_to: '2025-02-15', fee_paid: 8200, notes: 'ニホンジカ・イノシシ等', created_at: '2024-10-20T00:00:00Z' },
    { id: 'reg-4', user_id: 'demo-u3', season_year: 2024, prefecture: '北海道', license_type: '第一種', registration_number: '北海2024-03456', valid_from: '2024-11-01', valid_to: '2025-03-31', fee_paid: 16500, notes: '', created_at: '2024-10-18T00:00:00Z' },
  ],

  hunting_teams: [
    { id: 'team-1', name: '北海道猟友会', description: '北海道を中心に活動する猟隊。主に大雪山系・阿寒エリアで巻き狩りを実施。', invite_code: 'HOKKAI01', created_by: 'demo-u1', created_at: '2024-09-01T00:00:00Z' },
    { id: 'team-2', name: 'アルプス猟隊', description: '南アルプス周辺で活動。シカ・イノシシの個体数管理に協力。',              invite_code: 'ALPS0001', created_by: 'demo-u2', created_at: '2024-10-01T00:00:00Z' },
    { id: 'team-3', name: '信州猟隊',     description: '長野・山梨エリアを拠点とした少人数精鋭チーム。',                        invite_code: 'SHINSH01', created_by: 'demo-u2', created_at: '2024-11-01T00:00:00Z' },
  ],

  team_members: [
    { id: 'tm-1', team_id: 'team-1', user_id: 'demo-u1', role: 'leader', joined_at: '2024-09-01T00:00:00Z' },
    { id: 'tm-2', team_id: 'team-1', user_id: 'demo-u2', role: 'member', joined_at: '2024-09-05T00:00:00Z' },
    { id: 'tm-3', team_id: 'team-1', user_id: 'demo-u3', role: 'member', joined_at: '2024-09-10T00:00:00Z' },
    { id: 'tm-4', team_id: 'team-2', user_id: 'demo-u2', role: 'leader', joined_at: '2024-10-01T00:00:00Z' },
    { id: 'tm-5', team_id: 'team-2', user_id: 'demo-u1', role: 'member', joined_at: '2024-10-05T00:00:00Z' },
    { id: 'tm-6', team_id: 'team-3', user_id: 'demo-u2', role: 'leader', joined_at: '2024-11-01T00:00:00Z' },
    { id: 'tm-7', team_id: 'team-3', user_id: 'demo-u3', role: 'member', joined_at: '2024-11-03T00:00:00Z' },
  ],

  ammo_ledger: [
    // 購入エントリのみ。払い出し（射撃練習・狩猟使用）は shooting_records / hunting_records から自動集計
    { id: 'ldg-1', ammo_inventory_id: 'ammo-1', user_id: 'demo-u1', date: '2024-09-01', event_type: '購入', description: '銃砲店で購入', received: 161, paid_out: 0, balance: 161, notes: '許可証番号: 札北-2024-001', created_at: '2024-09-01T10:00:00Z' },
    { id: 'ldg-2', ammo_inventory_id: 'ammo-2', user_id: 'demo-u1', date: '2024-09-01', event_type: '購入', description: '銃砲店で購入', received:  28, paid_out: 0, balance:  28, notes: '許可証番号: 札北-2024-002', created_at: '2024-09-01T10:01:00Z' },
    { id: 'ldg-3', ammo_inventory_id: 'ammo-3', user_id: 'demo-u2', date: '2024-10-01', event_type: '購入', description: '銃砲店で購入', received: 100, paid_out: 0, balance: 100, notes: '許可証番号: 長野-2024-001', created_at: '2024-10-01T10:00:00Z' },
    { id: 'ldg-4', ammo_inventory_id: 'ammo-4', user_id: 'demo-u3', date: '2024-09-15', event_type: '購入', description: '銃砲店で購入', received:  50, paid_out: 0, balance:  50, notes: '許可証番号: 北海-2024-003', created_at: '2024-09-15T10:00:00Z' },
  ],

  hunting_sightings: [
    // hnt-2 (2024-12-01 team-1)
    { id: 'sgt-1',  hunting_record_id: 'hnt-2',  user_id: 'demo-u1', sight_time: '06:15', game: 'イノシシ', count:  5, location: '林道入口付近',       sight_lat: 43.7300, sight_lng: 142.8800, notes: '群れで移動中を目撃',     created_at: '2024-12-01T06:15:00Z' },
    { id: 'sgt-2',  hunting_record_id: 'hnt-2',  user_id: 'demo-u1', sight_time: '08:45', game: 'シカ',     count:  2, location: '尾根付近',           sight_lat: 43.7350, sight_lng: 142.8850, notes: '追跡したが逃げられた',   created_at: '2024-12-01T08:45:00Z' },
    // hnt-1 (2024-11-15 単独)
    { id: 'sgt-3',  hunting_record_id: 'hnt-1',  user_id: 'demo-u1', sight_time: '07:00', game: 'イノシシ', count:  3, location: '沢沿い',             sight_lat: 43.7260, sight_lng: 142.8720, notes: '早朝、沢を渡る群れ',     created_at: '2024-11-15T07:00:00Z' },
    // hnt-3 (2025-01-10 単独)
    { id: 'sgt-4',  hunting_record_id: 'hnt-3',  user_id: 'demo-u1', sight_time: '05:30', game: 'シカ',     count:  8, location: '湖畔湿地',           sight_lat: 43.4480, sight_lng: 144.1000, notes: '夜明け前に大群',         created_at: '2025-01-10T05:30:00Z' },
    // hnt-10 (2024-11-28 team-1)
    { id: 'sgt-5',  hunting_record_id: 'hnt-10', user_id: 'demo-u1', sight_time: '06:00', game: 'シカ',     count:  8, location: '大雪山林道付近',     sight_lat: 43.7260, sight_lng: 142.8740, notes: '夜明け直後に大群確認',   created_at: '2024-11-28T06:00:00Z' },
    { id: 'sgt-6',  hunting_record_id: 'hnt-10', user_id: 'demo-u1', sight_time: '09:30', game: 'イノシシ', count:  3, location: '沢沿い下流',         sight_lat: 43.7300, sight_lng: 142.8780, notes: '包囲網をかいくぐられた', created_at: '2024-11-28T09:30:00Z' },
    // hnt-13 (2024-12-20 team-2)
    { id: 'sgt-7',  hunting_record_id: 'hnt-13', user_id: 'demo-u2', sight_time: '07:00', game: 'イノシシ', count:  5, location: '南アルプス尾根付近', sight_lat: 35.6650, sight_lng: 138.2450, notes: '夜明けと同時に稜線を移動', created_at: '2024-12-20T07:00:00Z' },
    { id: 'sgt-8',  hunting_record_id: 'hnt-13', user_id: 'demo-u2', sight_time: '10:00', game: 'シカ',     count:  4, location: '渓流沿い',           sight_lat: 35.6600, sight_lng: 138.2360, notes: 'オス2頭・メス2頭の群れ', created_at: '2024-12-20T10:00:00Z' },
    // hnt-15 (2025-02-10 team-1)
    { id: 'sgt-9',  hunting_record_id: 'hnt-15', user_id: 'demo-u1', sight_time: '05:45', game: 'シカ',     count: 12, location: '阿寒湖岸湿地帯',     sight_lat: 43.4580, sight_lng: 144.0920, notes: '湖面が凍り湿地に集結していた', created_at: '2025-02-10T05:45:00Z' },
    { id: 'sgt-10', hunting_record_id: 'hnt-15', user_id: 'demo-u1', sight_time: '07:15', game: 'シカ',     count:  4, location: '林道カーブ付近',     sight_lat: 43.4520, sight_lng: 144.0850, notes: '逃走個体を確認',         created_at: '2025-02-10T07:15:00Z' },
    // hnt-17 (2025-01-25 team-3)
    { id: 'sgt-11', hunting_record_id: 'hnt-17', user_id: 'demo-u2', sight_time: '07:30', game: 'イノシシ', count:  6, location: '南アルプス深山斜面', sight_lat: 35.6720, sight_lng: 138.2180, notes: '早朝から斜面を群れで移動', created_at: '2025-01-25T07:30:00Z' },
    { id: 'sgt-12', hunting_record_id: 'hnt-17', user_id: 'demo-u2', sight_time: '10:00', game: 'シカ',     count:  3, location: '沢筋の水場付近',     sight_lat: 35.6680, sight_lng: 138.2130, notes: '水を飲みに降りてきた',   created_at: '2025-01-25T10:00:00Z' },
    // hnt-5 (2024-11-20 単独, u2)
    { id: 'sgt-13', hunting_record_id: 'hnt-5',  user_id: 'demo-u2', sight_time: '08:30', game: 'タヌキ',   count:  2, location: '南アルプス南面林道', sight_lat: 35.6430, sight_lng: 138.2260, notes: '親子と思われる2頭',      created_at: '2024-11-20T08:30:00Z' },
    // hnt-7 (2025-01-05 単独, u2)
    { id: 'sgt-14', hunting_record_id: 'hnt-7',  user_id: 'demo-u2', sight_time: '09:15', game: 'キジ',     count:  5, location: '伊那谷農地脇',       sight_lat: null,    sight_lng: null,    notes: 'オス1羽・メス4羽を目撃', created_at: '2025-01-05T09:15:00Z' },
    // hnt-9 (2025-01-15 単独, u3)
    { id: 'sgt-15', hunting_record_id: 'hnt-9',  user_id: 'demo-u3', sight_time: '06:30', game: 'イノシシ', count:  3, location: '大雪山系山腹',       sight_lat: null,    sight_lng: null,    notes: '朝の移動中に群れを確認', created_at: '2025-01-15T06:30:00Z' },
  ],
}

// ── Auth 状態管理 ──────────────────────────────────────────
const DEMO_SESSION_KEY = '__demo_session__'
const authListeners = []

function uid() {
  return Math.random().toString(36).substring(2, 10)
}

function getStoredSession() {
  try {
    const s = sessionStorage.getItem(DEMO_SESSION_KEY)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function saveSession(session) {
  if (session) sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session))
  else sessionStorage.removeItem(DEMO_SESSION_KEY)
  authListeners.forEach(cb => cb(session ? 'SIGNED_IN' : 'SIGNED_OUT', session))
}

// ── テーブルごとのJOIN解決 ─────────────────────────────────
function resolveJoins(table, record) {
  const r = { ...record }
  if (table === 'shooting_records') {
    r.shooting_ranges = r.range_id ? (db.shooting_ranges.find(g => g.id === r.range_id) || null) : null
    r.firearms        = r.firearm_id ? (db.firearms.find(f => f.id === r.firearm_id) || null) : null
  }
  if (table === 'hunting_records') {
    r.hunting_grounds = r.ground_id ? (db.hunting_grounds.find(g => g.id === r.ground_id) || null) : null
    r.hunting_teams   = r.team_id   ? (db.hunting_teams.find(t => t.id === r.team_id)     || null) : null
    r.profiles        = r.user_id   ? (db.profiles.find(p => p.id === r.user_id)           || null) : null
    r.firearms        = r.firearm_id ? (db.firearms.find(f => f.id === r.firearm_id) || null) : null
  }
  if (table === 'hunting_catches') {
    r.shooter = r.shooter_user_id ? (db.profiles.find(p => p.id === r.shooter_user_id) || null) : null
  }
  if (table === 'hunting_sightings') { /* no joins */ }
  if (table === 'ammo_ledger') {
    r.ammo_inventory = r.ammo_inventory_id
      ? (db.ammo_inventory.find(a => a.id === r.ammo_inventory_id) || null) : null
  }
  if (table === 'team_members') {
    r.hunting_teams = r.team_id ? (db.hunting_teams.find(t => t.id === r.team_id) || null) : null
    r.profiles      = r.user_id ? (db.profiles.find(p => p.id === r.user_id)       || null) : null
  }
  return r
}

// ── RLS シミュレーション ──────────────────────────────────
function applyRls(table, records) {
  const session = getStoredSession()
  const userId = session?.user?.id
  if (!userId) return []

  if (table === 'hunting_records') {
    const myTeamIds = db.team_members.filter(m => m.user_id === userId).map(m => m.team_id)
    return records.filter(r =>
      r.user_id === userId || (r.team_id && myTeamIds.includes(r.team_id))
    )
  }
  // hunting_catches / hunting_sightings: allowed if the related hunting_record is visible
  if (table === 'hunting_catches' || table === 'hunting_sightings') {
    const myTeamIds = db.team_members.filter(m => m.user_id === userId).map(m => m.team_id)
    const visibleRecordIds = db.hunting_records
      .filter(r => r.user_id === userId || (r.team_id && myTeamIds.includes(r.team_id)))
      .map(r => r.id)
    return records.filter(r => visibleRecordIds.includes(r.hunting_record_id))
  }
  // team_members: only my own memberships
  if (table === 'team_members') {
    const myTeamIds = records.filter(m => m.user_id === userId).map(m => m.team_id)
    return records.filter(m => myTeamIds.includes(m.team_id))
  }
  return records
}

// ── クエリビルダー ─────────────────────────────────────────
class MockQueryBuilder {
  constructor(table) {
    this.table = table
    this.op = 'select'
    this.payload = null
    this.filters = []
    this.orderField = null
    this.orderAsc = true
    this.isSingle = false
    this._limit = null
    this._needRls = false
  }

  select()  { return this }
  single()  { this.isSingle = true; return this }
  limit(n)  { this._limit = n; return this }

  insert(data) {
    this.op = 'insert'
    this.payload = Array.isArray(data) ? data : [data]
    return this
  }
  update(data) { this.op = 'update'; this.payload = data; return this }
  delete()     { this.op = 'delete'; return this }

  eq(col, val)        { this.filters.push({ col, val, op: 'eq' });  return this }
  in(col, vals)       { this.filters.push({ col, val: vals, op: 'in' }); return this }
  gte(col, val)       { this.filters.push({ col, val, op: 'gte' }); return this }
  lte(col, val)       { this.filters.push({ col, val, op: 'lte' }); return this }
  neq(col, val)       { this.filters.push({ col, val, op: 'neq' }); return this }

  order(field, { ascending = true } = {}) {
    this.orderField = field; this.orderAsc = ascending; return this
  }

  then(resolve, reject) {
    return Promise.resolve(this._execute()).then(resolve, reject)
  }
  catch(h) { return this.then(null, h) }

  _match(record) {
    return this.filters.every(({ col, val, op }) => {
      if (op === 'in')  return Array.isArray(val) && val.includes(record[col])
      if (op === 'gte') return record[col] != null && record[col] >= val
      if (op === 'lte') return record[col] != null && record[col] <= val
      if (op === 'neq') return record[col] !== val
      return record[col] === val // 'eq'
    })
  }

  _sort(data) {
    if (!this.orderField) return data
    const f = this.orderField, asc = this.orderAsc
    return [...data].sort((a, b) => {
      const av = a[f] ?? '', bv = b[f] ?? ''
      const c = av < bv ? -1 : av > bv ? 1 : 0
      return asc ? c : -c
    })
  }

  _execute() {
    let records = db[this.table] || []

    if (this.op === 'select') {
      // RLS: apply only when no user_id filter exists (hunting_records, hunting_catches, team_members)
      const hasUserFilter = this.filters.some(f => f.col === 'user_id')
      if (!hasUserFilter) records = applyRls(this.table, records)

      let data = records.filter(r => this._match(r))
      data = this._sort(data)
      data = data.map(r => resolveJoins(this.table, r))
      if (this._limit) data = data.slice(0, this._limit)
      return { data: this.isSingle ? (data[0] ?? null) : data, error: null }
    }

    if (this.op === 'insert') {
      const inserted = this.payload.map(d => ({
        created_at: new Date().toISOString(),
        ...d,
        id: d.id || ('new-' + uid()),
      }))
      db[this.table] = [...records, ...inserted]
      const withJoins = inserted.map(r => resolveJoins(this.table, r))
      return { data: this.isSingle ? withJoins[0] : withJoins, error: null }
    }

    if (this.op === 'update') {
      db[this.table] = records.map(r => this._match(r) ? { ...r, ...this.payload } : r)
      const updated = (db[this.table] || []).filter(r => this._match(r)).map(r => resolveJoins(this.table, r))
      return { data: this.isSingle ? (updated[0] ?? null) : updated, error: null }
    }

    if (this.op === 'delete') {
      db[this.table] = records.filter(r => !this._match(r))
      return { data: null, error: null }
    }

    return { data: null, error: null }
  }
}

// ── RPC ───────────────────────────────────────────────────
function mockRpc(name, params) {
  const session = getStoredSession()
  const userId = session?.user?.id
  const profile = db.profiles.find(p => p.id === userId)
  const isAdmin = profile?.is_admin === true

  if (name === 'get_all_profiles') {
    if (!isAdmin) return Promise.resolve({ data: null, error: { message: '権限がありません' } })
    const data = DEMO_USERS.map(u => {
      const p = db.profiles.find(p => p.id === u.id) || {}
      return { id: u.id, email: u.email, display_name: p.display_name, is_admin: p.is_admin, created_at: p.created_at }
    })
    return Promise.resolve({ data, error: null })
  }

  if (name === 'set_user_admin') {
    if (!isAdmin) return Promise.resolve({ data: null, error: { message: '権限がありません' } })
    db.profiles = db.profiles.map(p =>
      p.id === params.target_user_id ? { ...p, is_admin: params.admin_status } : p
    )
    return Promise.resolve({ data: null, error: null })
  }

  if (name === 'get_app_stats') {
    if (!isAdmin) return Promise.resolve({ data: null, error: { message: '権限がありません' } })
    return Promise.resolve({
      data: {
        total_users:            db.profiles.length,
        total_hunting_records:  db.hunting_records.length,
        total_game:             db.hunting_records.reduce((s, r) => s + (r.count || 0), 0),
        total_shooting_records: db.shooting_records.length,
        total_rounds_fired:     db.hunting_records.reduce((s, r) => s + (r.rounds_fired || 0), 0),
        total_teams:            db.hunting_teams.length,
      },
      error: null,
    })
  }

  if (name === 'get_all_teams_admin') {
    if (!isAdmin) return Promise.resolve({ data: null, error: { message: '権限がありません' } })
    const data = db.hunting_teams.map(t => {
      const leader = db.profiles.find(p => p.id === t.created_by)
      const member_count = db.team_members.filter(m => m.team_id === t.id).length
      return { ...t, leader_name: leader?.display_name || '不明', member_count }
    })
    return Promise.resolve({ data, error: null })
  }

  return Promise.resolve({ data: null, error: null })
}

// ── モック Supabase エクスポート ───────────────────────────
export const mockSupabase = {
  from(table) {
    return new MockQueryBuilder(table)
  },

  rpc(name, params) {
    return mockRpc(name, params)
  },

  auth: {
    getSession() {
      return Promise.resolve({ data: { session: getStoredSession() } })
    },

    onAuthStateChange(callback) {
      authListeners.push(callback)
      // 即時に現在の状態を通知
      const session = getStoredSession()
      setTimeout(() => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session), 0)
      return {
        data: {
          subscription: {
            unsubscribe() {
              const i = authListeners.indexOf(callback)
              if (i > -1) authListeners.splice(i, 1)
            }
          }
        }
      }
    },

    async signInWithPassword({ email, password }) {
      await new Promise(r => setTimeout(r, 400)) // ローディング演出
      const du = DEMO_USERS.find(u => u.email === email)
      if (!du || du.password !== password) {
        return { data: null, error: new Error('Invalid login credentials') }
      }
      const session = { user: { id: du.id, email: du.email } }
      saveSession(session)
      return { data: { session, user: session.user }, error: null }
    },

    async signUp({ email, password, options }) {
      await new Promise(r => setTimeout(r, 400))
      if (DEMO_USERS.find(u => u.email === email)) {
        return { data: null, error: new Error('User already registered') }
      }
      const newId = 'new-' + uid()
      const displayName = options?.data?.display_name || email.split('@')[0]
      DEMO_USERS.push({ id: newId, email, password })
      db.profiles.push({ id: newId, display_name: displayName, is_admin: false, created_at: new Date().toISOString() })
      const session = { user: { id: newId, email } }
      saveSession(session)
      return { data: { session, user: session.user }, error: null }
    },

    async signOut() {
      saveSession(null)
      return { error: null }
    },
  },
}

export { DEMO_USERS }
