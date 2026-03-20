-- Seed invite codes for private demo
-- Run this in Supabase SQL Editor AFTER running schema.sql
-- Copy these codes and distribute them to your beta testers.
-- Each code can only be used once.

insert into public.invite_codes (code) values
  -- Batch 1 — original
  ('WEEKLY-7F2K-PQ9M'),
  ('WEEKLY-3HAX-VN5T'),
  ('WEEKLY-9DRL-BW4J'),
  ('WEEKLY-5MCY-KG8P'),
  ('WEEKLY-2ETZ-FS6N'),
  -- Batch 2 — demo expansion
  ('WEEKLY-4JWR-TX8L'),
  ('WEEKLY-6BPN-HY2G'),
  ('WEEKLY-8CSV-DM3K'),
  ('WEEKLY-1FQA-ZR7W'),
  ('WEEKLY-5ULN-GP4E')
on conflict (code) do nothing;

-- Verify: see all codes and their status
select code, redeemed_by is not null as is_used, created_at
from public.invite_codes
order by created_at;
