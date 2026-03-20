-- Phase 3: Lightweight Coordination Layer
-- Run this in Supabase SQL Editor AFTER phase2-social.sql.
-- Adds: event_participants table for invites, join requests, and shared participation.

-- ─── Event Participants ────────────────────────────────────────────────
-- Unified table for invitations, join requests, and participation.
-- Status flow:
--   Invite:      owner creates row (status=invited) → recipient accepts/declines
--   Ask-to-join: viewer creates row (status=requested) → owner accepts/declines
--   Final:       accepted or declined

create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 'invite' = owner invited this user; 'request' = user asked to join
  role text not null check (role in ('invite', 'request')),
  status text not null check (status in ('invited', 'requested', 'accepted', 'declined')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, user_id)
);

alter table public.event_participants enable row level security;

-- Users can see participant rows for events they own or are a participant of,
-- or for shared events visible to them via circle membership.
create policy "ep_select" on public.event_participants for select using (
  -- You are the participant
  user_id = auth.uid()
  -- You own the event
  or exists (
    select 1 from public.events e
    where e.id = event_participants.event_id
    and e.user_id = auth.uid()
  )
  -- You can see the event via circle membership
  or exists (
    select 1 from public.events e
    where e.id = event_participants.event_id
    and e.visibility = 'circle'
    and exists (
      select 1 from public.circle_members cm1
      join public.circle_members cm2 on cm1.circle_id = cm2.circle_id
      where cm1.user_id = e.user_id
      and cm2.user_id = auth.uid()
    )
  )
);

-- Insert: either you're inviting someone to your own event (role=invite),
-- or you're requesting to join someone else's shared event (role=request, user_id=self).
create policy "ep_insert" on public.event_participants for insert with check (
  -- Request to join: user_id must be self, event must be shared circle event
  (
    role = 'request'
    and user_id = auth.uid()
    and status = 'requested'
    and exists (
      select 1 from public.events e
      where e.id = event_participants.event_id
      and e.visibility = 'circle'
      and e.user_id != auth.uid()
      and exists (
        select 1 from public.circle_members cm1
        join public.circle_members cm2 on cm1.circle_id = cm2.circle_id
        where cm1.user_id = e.user_id
        and cm2.user_id = auth.uid()
      )
    )
  )
  or
  -- Invite: invited_by must be self, must own the event, event must be circle visibility
  (
    role = 'invite'
    and status = 'invited'
    and invited_by = auth.uid()
    and exists (
      select 1 from public.events e
      where e.id = event_participants.event_id
      and e.user_id = auth.uid()
      and e.visibility = 'circle'
    )
    -- Invitee must be in a shared circle with the event owner
    and exists (
      select 1 from public.circle_members cm1
      join public.circle_members cm2 on cm1.circle_id = cm2.circle_id
      where cm1.user_id = auth.uid()
      and cm2.user_id = event_participants.user_id
    )
  )
);

-- Update: only status and updated_at can change.
-- Event owner can accept/decline requests; participant can accept/decline invites.
create policy "ep_update" on public.event_participants for update using (
  -- You are the participant (can accept/decline invites sent to you)
  user_id = auth.uid()
  -- You own the event (can accept/decline join requests)
  or exists (
    select 1 from public.events e
    where e.id = event_participants.event_id
    and e.user_id = auth.uid()
  )
);

-- Delete: event owner or the participant themselves can remove
create policy "ep_delete" on public.event_participants for delete using (
  user_id = auth.uid()
  or exists (
    select 1 from public.events e
    where e.id = event_participants.event_id
    and e.user_id = auth.uid()
  )
);

create index if not exists idx_ep_event on public.event_participants (event_id);
create index if not exists idx_ep_user on public.event_participants (user_id, status);


-- ─── Extend notification types ─────────────────────────────────────────
-- Add new notification types for coordination flows.

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'comment', 'reaction', 'member_joined', 'summary_shared',
    'event_invite', 'join_request', 'participant_response'
  ));
