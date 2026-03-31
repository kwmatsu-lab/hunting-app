-- ================================================
-- 狩猟・射撃管理アプリ Supabase スキーマ
-- Supabase の SQL Editor に貼り付けて実行してください
-- ================================================

-- プロフィール
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "自分のプロフィールのみ閲覧" on public.profiles for select using (auth.uid() = id);
create policy "自分のプロフィールのみ更新" on public.profiles for update using (auth.uid() = id);
create policy "プロフィール作成" on public.profiles for insert with check (auth.uid() = id);

-- 統計用: 全ユーザーのプロフィールを名前だけ閲覧可能にする
create policy "全ユーザーのプロフィール閲覧（名前のみ）" on public.profiles for select using (true);

-- 射撃記録
create table public.shooting_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  location text,
  firearm text,
  caliber text,
  distance numeric,
  score numeric,
  rounds numeric,
  notes text,
  created_at timestamptz default now()
);
alter table public.shooting_records enable row level security;
create policy "自分の射撃記録" on public.shooting_records for all using (auth.uid() = user_id);
-- 統計ページ用: 全員の記録を閲覧可能
create policy "統計用: 全員の射撃記録閲覧" on public.shooting_records for select using (true);

-- 狩猟記録
create table public.hunting_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  location text,
  prefecture text,
  game text,
  count numeric default 0,
  method text,
  ammo_used text,
  weather text,
  notes text,
  created_at timestamptz default now()
);
alter table public.hunting_records enable row level security;
create policy "自分の狩猟記録" on public.hunting_records for all using (auth.uid() = user_id);
create policy "統計用: 全員の狩猟記録閲覧" on public.hunting_records for select using (true);

-- 弾薬・装備在庫
create table public.ammo_inventory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  caliber text,
  type text,
  quantity numeric default 0,
  min_quantity numeric default 0,
  brand text,
  notes text,
  created_at timestamptz default now()
);
alter table public.ammo_inventory enable row level security;
create policy "自分の弾薬在庫" on public.ammo_inventory for all using (auth.uid() = user_id);

-- 免許・許可証
create table public.licenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  license_number text,
  issued_date date,
  expiry_date date not null,
  issuer text,
  notes text,
  created_at timestamptz default now()
);
alter table public.licenses enable row level security;
create policy "自分の免許" on public.licenses for all using (auth.uid() = user_id);

-- 新規ユーザー登録時にプロフィールを自動作成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
