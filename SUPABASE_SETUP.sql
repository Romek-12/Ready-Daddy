-- =============================================================================
-- Ready Daddy – Supabase setup
-- Uruchom ten skrypt w Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================================

-- 1. Tabela profilów użytkowników
--    id = auth.users.id (UUID z Supabase Auth)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  conception_date TEXT NOT NULL,         -- format YYYY-MM-DD
  partner_name    TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security – każdy user widzi i edytuje tylko swój profil
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Trigger: automatycznie tworzy profil po rejestracji (opcjonalny)
--    Jeśli nie używasz trigera, profil jest tworzony przez aplikację w register().
-- -----------------------------------------------------------------------------
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, conception_date, partner_name)
--   VALUES (NEW.id, NEW.email, '2024-01-01', '');
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
