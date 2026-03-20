-- Phase 1: Social / Accountability Layer
-- Run this in Supabase SQL Editor AFTER the Day 8 schema.
-- Adds: circles, circle_members, circle_invites, comments, event visibility

-- ─── Allow authenticated users to read all profiles ──────────────────────
-- Needed so circle members can see each other's display names.
-- Safe for an invite-only app with trusted users.

create policy "Authenticated users can read profiles"
  on public.profiles for select
  using (auth.uid() is not null);


-- ─── Event visibility ────────────────────────────────────────────────────
-- Add visibility column to events. All existing events become "private".

alter table public.events
  add column if not exists visibility text not null default 'private'
  check (visibility in ('private', 'circle'));


-- ─── Circles ─────────────────────────────────────────────────────────────

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) > 0 and length(name) <= 60),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.circles enable row level security;

-- Members can see circles they belong to
create policy "circle_select" on public.circles for select using (
  exists (
    select 1 from public.circle_members
    where circle_members.circle_id = circles.id
    and circle_members.user_id = auth.uid()
  )
);

create policy "circle_insert" on public.circles for insert
  with check (owner_id = auth.uid());

create policy "circle_update" on public.circles for update
  using (owner_id = auth.uid());

create policy "circle_delete" on public.circles for delete
  using (owner_id = auth.uid());


-- ─── Circle Members ──────────────────────────────────────────────────────

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique(circle_id, user_id)
);

alter table public.circle_members enable row level security;

-- Members can see who else is in their circles
create policy "cm_select" on public.circle_members for select using (
  exists (
    select 1 from public.circle_members cm2
    where cm2.circle_id = circle_members.circle_id
    and cm2.user_id = auth.uid()
  )
);

-- Owner can add members (used during circle creation for self-insert)
-- Also allow self-insert (used during invite redemption via RPC)
create policy "cm_insert" on public.circle_members for insert
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.circles
      where circles.id = circle_members.circle_id
      and circles.owner_id = auth.uid()
    )
  );

-- Members can leave; owner can remove
create policy "cm_delete" on public.circle_members for delete using (
  user_id = auth.uid()
  or exists (
    select 1 from public.circles
    where circles.id = circle_members.circle_id
    and circles.owner_id = auth.uid()
  )
);

create index if not exists idx_circle_members_user
  on public.circle_members (user_id);


-- ─── Circle Invites ──────────────────────────────────────────────────────

create table if not exists public.circle_invites (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  invited_by uuid not null references auth.users(id),
  code text not null unique,
  claimed_by uuid references auth.users(id),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.circle_invites enable row level security;

-- Circle members can see invites for their circles
create policy "ci_select" on public.circle_invites for select using (
  exists (
    select 1 from public.circle_members
    where circle_members.circle_id = circle_invites.circle_id
    and circle_members.user_id = auth.uid()
  )
);

-- Circle members can create invites
create policy "ci_insert" on public.circle_invites for insert with check (
  invited_by = auth.uid()
  and exists (
    select 1 from public.circle_members
    where circle_members.circle_id = circle_invites.circle_id
    and circle_members.user_id = auth.uid()
  )
);


-- ─── Comments ────────────────────────────────────────────────────────────

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(content) > 0 and length(content) <= 500),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

-- Can read comments on own events or shared events in shared circles
create policy "comment_select" on public.comments for select using (
  exists (
    select 1 from public.events e
    where e.id = comments.event_id
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

-- Can comment on shared events visible to the user
create policy "comment_insert" on public.comments for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.events e
    where e.id = comments.event_id
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

-- Can delete own comments
create policy "comment_delete" on public.comments for delete
  using (user_id = auth.uid());

create index if not exists idx_comments_event
  on public.comments (event_id);


-- ─── Events: circle read policy ──────────────────────────────────────────
-- Allows circle members to read shared events from fellow members.

create policy "events_circle_read" on public.events for select using (
  visibility = 'circle'
  and exists (
    select 1 from public.circle_members cm1
    join public.circle_members cm2 on cm1.circle_id = cm2.circle_id
    where cm1.user_id = events.user_id
    and cm2.user_id = auth.uid()
    and cm1.user_id != cm2.user_id
  )
);


-- ─── RPC: Join circle via invite code ────────────────────────────────────
-- Atomically validates, redeems the invite, and adds the user as a member.

create or replace function public.join_circle_by_code(invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite circle_invites%rowtype;
  v_circle circles%rowtype;
begin
  -- Find and lock the invite
  select * into v_invite
  from circle_invites
  where code = invite_code
  and claimed_by is null
  for update;

  if not found then
    return jsonb_build_object('error', 'Invalid or already used invite code');
  end if;

  -- Check not already a member
  if exists (
    select 1 from circle_members
    where circle_id = v_invite.circle_id
    and user_id = auth.uid()
  ) then
    return jsonb_build_object('error', 'You are already a member of this circle');
  end if;

  -- Claim the invite
  update circle_invites
  set claimed_by = auth.uid(), claimed_at = now()
  where id = v_invite.id;

  -- Add as member
  insert into circle_members (circle_id, user_id, role)
  values (v_invite.circle_id, auth.uid(), 'member');

  -- Return circle info
  select * into v_circle from circles where id = v_invite.circle_id;

  return jsonb_build_object(
    'success', true,
    'circle_name', v_circle.name,
    'circle_id', v_circle.id
  );
end;
$$;
