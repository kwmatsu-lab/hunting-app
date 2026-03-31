-- =====================================================
-- Schema v7: 所持許可証テーブル・銃許可フィールド追加
-- ★ v1〜v6 を適用済みの環境で実行してください
-- =====================================================

-- 所持許可証テーブル
CREATE TABLE IF NOT EXISTS public.permit_books (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  book_number text,
  original_issue_date date,
  issue_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.permit_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の所持許可証管理" ON public.permit_books
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 銃管理テーブルに新フィールド追加
ALTER TABLE public.firearms
  ADD COLUMN IF NOT EXISTS mechanism text,
  ADD COLUMN IF NOT EXISTS original_permit_date date,
  ADD COLUMN IF NOT EXISTS original_permit_number text,
  ADD COLUMN IF NOT EXISTS permit_date date,
  ADD COLUMN IF NOT EXISTS permit_validity_text text,
  ADD COLUMN IF NOT EXISTS renewal_period_text text,
  ADD COLUMN IF NOT EXISTS safety_training_date date,
  ADD COLUMN IF NOT EXISTS safety_training_cert_no text,
  ADD COLUMN IF NOT EXISTS inspection_date date;
