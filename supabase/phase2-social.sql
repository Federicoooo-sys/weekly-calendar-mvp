-- Phase 2: Social Layer — Reactions, Weekly Shares, Notifications
-- Run this in Supabase SQL Editor AFTER phase1-social.sql.

-- ─── Reactions ───────────────────────────────────────────────────────────
-- Lightweight reactions on shared events. One per user per event.

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '👏', '🔥')),
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

alter table public.reactions enable row level security;

-- Can see reactions on own events or shared events in shared circles
create policy "reaction_select" on public.reactions for select using (
  exists (
    select 1 from public.events e
    where e.id = reactions.event_id
    and (
      e.user_id = auth.uid()
      or (
        e.visibility = 'circle'
        and exists (
          select 1 from public.circle_members cm1
          join public.circle_members cm2 on cm1.circle_id = cm2.circle_id
          where cm1.user_id = e.user_id
          and cm2.user_id = auth.uid()
        )
      )
    )
  )
);

-- Can react on shared events visible to the user
create policy "reaction_insert" on public.reactions for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.events e
    where e.id = reactions.event_id
    and e.visibility = 'circle'
    and (
      e.user_id = auth.uid()
      or exists (
        select 1 from public.circle_members cm1
        join public.circle_members cm2 on cm1.circle_id = cm2.circle_id
        where cm1.user_id = e.user_id
        and cm2.user_id = auth.uid()
      )
    )
  )
);

-- Can update own reactions (change emoji)
create policy "reaction_update" on public.reactions for update
  using (user_id = auth.uid());

-- Can delete own reactions
create policy "reaction_delete" on public.reactions for delete
  using (user_id = auth.uid());

create index if not exists idx_reactions_event
  on public.reactions (event_id);


-- ─── Weekly Shares ───────────────────────────────────────────────────────
-- Intentional summary shares with circle members.
-- Stats are frozen at share time — a snapshot, not live.

create table if not exists public.weekly_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  circle_id uuid not null references public.circles(id) on delete cascade,
  week_start date not null,
  reflection_note text check (reflection_note is null or length(reflection_note) <= 500),
  total_events int not null default 0,
  completed_events int not null default 0,
  skipped_events int not null default 0,
  completion_rate int not null default 0,
  shared_at timestamptz not null default now(),
  unique(user_id, circle_id, week_start)
);

alter table public.weekly_shares enable row level security;

-- Circle members can see shares in their circles
create policy "ws_select" on public.weekly_shares for select using (
  exists (
    select 1 from public.circle_members
    where circle_members.circle_id = weekly_shares.circle_id
    and circle_members.user_id = auth.uid()
  )
);

-- Users can share their own weeks to circles they belong to
create policy "ws_insert" on public.weekly_shares for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.circle_members
    where circle_members.circle_id = weekly_shares.circle_id
    and circle_members.user_id = auth.uid()
  )
);

-- Users can delete their own shares
create policy "ws_delete" on public.weekly_shares for delete
  using (user_id = auth.uid());

create index if not exists idx_weekly_shares_circle
  on public.weekly_shares (circle_id, shared_at desc);


-- ─── Notifications ───────────────────────────────────────────────────────
-- In-app notifications for social events.
-- Created client-side when actions happen. No triggers needed.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('comment', 'reaction', 'member_joined', 'summary_shared')),
  target_id uuid,
  target_label text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Users can read own notifications
create policy "notif_select" on public.notifications for select
  using (user_id = auth.uid());

-- Authenticated users can create notifications (actor_id must be self)
create policy "notif_insert" on public.notifications for insert
  with check (actor_id = auth.uid());

-- Users can mark own notifications as read
create policy "notif_update" on public.notifications for update
  using (user_id = auth.uid());

-- Users can delete own notifications
create policy "notif_delete" on public.notifications for delete
  using (user_id = auth.uid());

create index if not exists idx_notifications_user_read
  on public.notifications (user_id, read, created_at desc);
