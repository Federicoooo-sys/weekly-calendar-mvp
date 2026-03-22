-- Phase 5: Circle Chat
-- Run this in Supabase SQL Editor AFTER phase4-coordination.sql.
-- Adds: chat_messages table for group and direct messages within circles.

-- ─── Chat Messages ───────────────────────────────────────────────────────
-- Simple chat scoped to circles. Two modes:
--   Group chat:  dm_pair IS NULL  → visible to all circle members
--   Direct chat: dm_pair = sorted "userId1_userId2" → visible to the pair only
--
-- dm_pair is a deterministic key: sort both user IDs and join with underscore.
-- This ensures the same conversation always has the same key.

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  dm_pair text,  -- null = group chat, "uuid1_uuid2" (sorted) = DM
  content text not null check (length(content) > 0 and length(content) <= 500),
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

-- SELECT: Must be a circle member. For DMs, must be one of the two users.
create policy "chat_select" on public.chat_messages for select using (
  exists (
    select 1 from public.circle_members
    where circle_members.circle_id = chat_messages.circle_id
    and circle_members.user_id = auth.uid()
  )
  and (
    dm_pair is null
    or dm_pair like '%' || auth.uid()::text || '%'
  )
);

-- INSERT: sender_id must be self, must be a circle member.
-- For DMs, both users must be members of the same circle (enforced by dm_pair format).
create policy "chat_insert" on public.chat_messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.circle_members
    where circle_members.circle_id = chat_messages.circle_id
    and circle_members.user_id = auth.uid()
  )
);

-- DELETE: Only own messages
create policy "chat_delete" on public.chat_messages for delete
  using (sender_id = auth.uid());

create index if not exists idx_chat_circle_group
  on public.chat_messages (circle_id, created_at desc)
  where dm_pair is null;

create index if not exists idx_chat_dm
  on public.chat_messages (circle_id, dm_pair, created_at desc)
  where dm_pair is not null;


-- ─── Extend notification types for chat ──────────────────────────────────

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'comment', 'reaction', 'member_joined', 'summary_shared',
    'event_invite', 'join_request', 'participant_response',
    'chat_group', 'chat_dm'
  ));
