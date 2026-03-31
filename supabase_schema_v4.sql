-- ================================================
-- スキーマ v4: 射撃記録に装弾連携・写真URL追加
-- ================================================

alter table public.shooting_records
  add column if not exists ammo_inventory_id uuid,
  add column if not exists ammo_name text,
  add column if not exists target_photo_url text;

-- Supabase Storage バケット（SQL Editorではなく Storage UIで作成推奨）
-- バケット名: shooting-targets (public)
-- Policy例（Storage > Policies で設定）:
--   INSERT: auth.uid() is not null
--   SELECT: true (公開)
--   DELETE: auth.uid() = owner
