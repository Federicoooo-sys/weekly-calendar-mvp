-- Weekly Planner — Day 8 schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ─── Profiles ───────────────────────────────────────────────────────────
-- Stores user metadata beyond what Supabase Auth provides.
-- Created automatically when a new user signs up (via trigger below).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists (idempotent)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── Invite Codes ───────────────────────────────────────────────────────
-- One-time-use access codes for invite-only signup.
-- Format: WEEKLY-XXXX-XXXX

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invite_codes enable row level security;

-- Anyone can check if a code is valid (needed during signup before auth)
-- But they can only see the code and whether it's redeemed, not who redeemed it
create policy "Anyone can validate invite codes"
  on public.invite_codes for select
  using (true);

-- Only the backend (service role) or RPC redeems codes — no direct updates from clients
-- We use an RPC function instead (see below)


-- ─── Events ─────────────────────────────────────────────────────────────
-- Calendar events — one row per event, scoped to a user and week.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  title text not null,
  day_key text not null check (day_key in ('mon','tue','wed','thu','fri','sat','sun')),
  start_time text,  -- "HH:mm" format or null for untimed
  end_time text,    -- "HH:mm" format or null
  category text not null default 'other' check (category in ('work','personal','health','errand','other')),
  status text not null default 'planned' check (status in ('planned','completed','skipped')),
  visibility text not null default 'private' check (visibility in ('private', 'circle')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Users can read own events"
  on public.events for select
  using (auth.uid() = user_id);

create policy "Users can insert own events"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own events"
  on public.events for update
  using (auth.uid() = user_id);

create policy "Users can delete own events"
  on public.events for delete
  using (auth.uid() = user_id);

-- Index for the most common query: "get all events for this user this week"
create index if not exists idx_events_user_week
  on public.events (user_id, week_start);


-- ─── User Preferences ───────────────────────────────────────────────────
-- Theme, language, and other per-user settings.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light',
  language text not null default 'en',
  week_start_day text not null default 'mon',
  timezone text,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can upsert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);


-- ─── RPC: Redeem Invite Code ────────────────────────────────────────────
-- Atomically validates and redeems a code during signup.
-- Called from the client after the user creates their auth account.

create or replace function public.redeem_invite_code(
  invite_code text,
  claiming_user_id uuid
)
returns boolean as $$
declare
  code_row public.invite_codes%rowtype;
begin
  -- Find the code and lock it
  select * into code_row
  from public.invite_codes
  where code = invite_code
  for update;

  -- Code doesn't exist
  if not found then
    return false;
  end if;

  -- Already redeemed
  if code_row.redeemed_by is not null then
    return false;
  end if;

  -- Redeem it
  update public.invite_codes
  set redeemed_by = claiming_user_id,
      redeemed_at = now()
  where id = code_row.id;

  return true;
end;
$$ language plpgsql security definer;
