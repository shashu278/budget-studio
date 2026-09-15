-- Additive compatibility columns so this app (formerly a disconnected,
-- unauthenticated "paste any Supabase project" client) can read and write
-- the SAME transactions/goals rows as the Next.js BudgetIQ app, through
-- the same Row Level Security policies, instead of its own guessed
-- schema and a service_role-key workaround.
--
-- Safe to re-run. Nothing here removes or renames an existing column, so
-- the Next.js app keeps working unmodified; these columns are simply
-- null/false for rows it doesn't populate.
--
-- How to apply: paste into the Supabase Dashboard's SQL Editor for this
-- project (the same one 0001_schema_and_rls.sql was applied to) and run
-- it once, or `supabase db push` if you use the CLI.

-- ---------------------------------------------------------------------
-- transactions: this app also tracks free-text notes and a payment
-- method per transaction; the original schema didn't have a home for
-- either.
-- ---------------------------------------------------------------------
alter table public.transactions add column if not exists notes text;
alter table public.transactions add column if not exists payment_method text;

-- The original CHECK only allowed daily/weekly/monthly/yearly. This app
-- also supports 'biweekly' recurring transactions.
alter table public.transactions drop constraint if exists transactions_recurring_frequency_check;
alter table public.transactions add constraint transactions_recurring_frequency_check
  check (recurring_frequency in ('daily', 'weekly', 'biweekly', 'monthly', 'yearly') or recurring_frequency is null);

-- ---------------------------------------------------------------------
-- goals: this app models a goal's category tag, free-text notes, and a
-- completion timestamp, none of which existed on the shared goals table.
-- ---------------------------------------------------------------------
alter table public.goals add column if not exists category text;
alter table public.goals add column if not exists notes text;
alter table public.goals add column if not exists completed_at timestamptz;

comment on column public.goals.emoji is
  'Free-text icon identifier. Holds a literal emoji from the Next.js app or a Lucide icon name (e.g. "ShieldCheck") from the AI Studio app — each app renders whichever form it understands and falls back to a default icon otherwise.';
