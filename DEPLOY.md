# Deployment Guide — Weekly Planner

Fastest path to a live demo URL: **Vercel + Supabase** (both free tier).

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In **SQL Editor**, run these scripts in order:
   - `supabase/schema.sql` — core tables (profiles, invite codes, events, preferences)
   - `supabase/phase2-social.sql` — circles, notifications, comments, reactions, shares (if it exists)
   - `supabase/phase3-coordination.sql` — event participants
   - `supabase/seed-invite-codes.sql` — 10 invite codes for your testers
3. Copy your project URL and anon key from **Settings > API**

### Auth Configuration

In **Authentication > URL Configuration**:
- Set **Site URL** to your Vercel deploy URL (e.g., `https://your-app.vercel.app`)
- Add `https://your-app.vercel.app/auth/callback` to **Redirect URLs**

In **Authentication > Email Templates** (optional):
- Customize the confirmation email subject/body for your demo

## 2. Vercel Deployment

1. Push this repo to GitHub (if not already)
2. Go to [vercel.com](https://vercel.com), import the repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon (public) key
4. Deploy — Vercel auto-detects Next.js

### After First Deploy

- Update the Supabase **Site URL** to match your actual Vercel URL
- Test the signup flow with one of the seeded invite codes
- Verify email confirmation works (check Supabase Auth > Users)

## 3. Invite Your Testers

Share with each person:
1. The app URL
2. One invite code from the seed list (each code works once)

Available codes (from `supabase/seed-invite-codes.sql`):
```
WEEKLY-7F2K-PQ9M
WEEKLY-3HAX-VN5T
WEEKLY-9DRL-BW4J
WEEKLY-5MCY-KG8P
WEEKLY-2ETZ-FS6N
WEEKLY-4JWR-TX8L
WEEKLY-6BPN-HY2G
WEEKLY-8CSV-DM3K
WEEKLY-1FQA-ZR7W
WEEKLY-5ULN-GP4E
```

To generate more codes later:
```sql
insert into public.invite_codes (code) values ('WEEKLY-XXXX-XXXX');
```

## 4. Mobile Install (PWA)

On iPhone Safari:
1. Open the app URL
2. Tap Share > Add to Home Screen
3. The app launches in standalone mode (no browser chrome)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Missing Supabase environment variables" | Check env vars in Vercel dashboard |
| Email confirmation link goes to localhost | Update Supabase Site URL and Redirect URLs |
| Invite code rejected | Check `invite_codes` table — code may already be redeemed |
| Blank screen after login | Check Supabase RLS policies are enabled |
| Build fails | Run `npm run build` locally first to catch TypeScript errors |
