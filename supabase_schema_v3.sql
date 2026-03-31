-- ================================================
-- スキーマ v3: 猟場に緯度経度・出猟記録拡張・捕獲イベント
-- ================================================

-- hunting_grounds に緯度経度を追加
alter table public.hunting_grounds
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

-- hunting_records に出猟時間・帰還時間・気温を追加
alter table public.hunting_records
  add column if not exists departure_time text,
  add column if not exists return_time text,
  add column if not exists temperature numeric;

-- 捕獲イベント（出猟中の個別捕獲記録）
create table if not exists public.hunting_catches (
  id uuid default gen_random_uuid() primary key,
  hunting_record_id uuid references public.hunting_records(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  catch_time text,
  game text,
  count integer default 1,
  notes text,
  created_at timestamptz default now()
);
alter table public.hunting_catches enable row level security;
create policy "自分の捕獲記録管理" on public.hunting_catches for all using (auth.uid() = user_id);
create policy "統計用: 捕獲記録閲覧" on public.hunting_catches for select using (true);
