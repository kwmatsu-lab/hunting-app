-- ================================================
-- スキーマ追加（v2）: 猟場管理 + 狩猟記録の拡張
-- Supabase SQL Editor で実行してください
-- ================================================

-- 猟場テーブル
create table if not exists public.hunting_grounds (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  prefecture text,
  address text,
  area_ha numeric,
  terrain text,       -- 山林 / 農地 / 河川 / 海岸 / 雑種地
  notes text,
  created_at timestamptz default now()
);

alter table public.hunting_grounds enable row level security;
create policy "自分の猟場管理" on public.hunting_grounds for all using (auth.uid() = user_id);
create policy "統計用: 全猟場閲覧" on public.hunting_grounds for select using (true);

-- hunting_records に猟場・発射弾数・装弾リンクを追加
alter table public.hunting_records
  add column if not exists ground_id uuid references public.hunting_grounds(id) on delete set null,
  add column if not exists rounds_fired numeric,
  add column if not exists ammo_inventory_id uuid,
  add column if not exists ammo_name text;
