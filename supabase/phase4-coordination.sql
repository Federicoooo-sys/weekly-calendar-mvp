-- Phase 4: Coordination features
-- Adds: circle join_code column, updated join RPC

-- ─── Add persistent join code to circles ──────────────────────────────────
-- Owner can set/edit this. Anyone with the code can join.
-- Coexists with one-time invite codes from circle_invites.

alter table circles add column if not exists join_code text unique;

-- ─── Policy: only owner can update their circle (already exists, but ensure join_code is covered) ───

-- ─── Updated RPC: Join circle via code ────────────────────────────────────
-- Now checks BOTH circle_invites.code (one-time) and circles.join_code (persistent).
-- Tries persistent join code first, falls back to one-time invite code.

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
  -- 1. Try persistent circle join code first
  select * into v_circle
  from circles
  where join_code = invite_code;

  if found then
    -- Check not already a member
    if exists (
      select 1 from circle_members
      where circle_id = v_circle.id
      and user_id = auth.uid()
    ) then
      return jsonb_build_object('error', 'You are already a member of this circle');
    end if;

    -- Add as member
    insert into circle_members (circle_id, user_id, role)
    values (v_circle.id, auth.uid(), 'member');

    return jsonb_build_object(
      'success', true,
      'circle_name', v_circle.name,
      'circle_id', v_circle.id
    );
  end if;

  -- 2. Fall back to one-time invite code
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
