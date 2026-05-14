# Munim — One-time setup

## 1. Apply the database schema

The MCP Supabase server bound to this Claude session doesn't have access to your
Supabase organisation, so the schema has to be pasted once into your project's
Studio SQL editor. **You'll never have to do this again.**

1. Open <https://supabase.com/dashboard/project/fpqqftgnvkhhywemcpak/sql/new>
2. Paste the contents of each file in order and click **Run**:
   - `supabase/migrations/0001_init.sql`  — tables
   - `supabase/migrations/0002_seed_categories.sql` — seed categories
   - `supabase/migrations/0003_triggers.sql` — venture→lending auto-link
   - `supabase/migrations/0004_view_balance.sql` — running cash balance

You can paste all four into a single editor tab if you prefer — the order matters.

## 2. Run the app

```
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to `/login`.
Password: **GoAwayGay**

## 3. (Optional) Production cron

`vercel.json` already declares a daily cron at 00:05 UTC that hits
`/api/cron/subscriptions` to auto-generate expenses for due subscriptions.
In production we check `x-cron-secret` against `SESSION_SECRET`.

For manual sync any time, the Subscriptions page has a **Sync due this month**
button that calls the same idempotent function.

## Files reference

```
src/
  middleware.ts                       cookie gate
  app/(auth)/login/page.tsx           password gate
  app/(app)/                          authed routes
    page.tsx                          dashboard
    income/, expenses/, bills/,
    subscriptions/, investments/,
    lending/, ventures/, settings/
    ventures/[id]/page.tsx            the big detail page
  app/api/cron/subscriptions/route.ts cron endpoint
  app/api/logout/route.ts             clears cookie
  actions/                            server actions per domain
  lib/
    supabase/server.ts, types.ts
    auth/session.ts                   HMAC cookie
    money.ts, dates.ts, ventures.ts, queries.ts, utils.ts
  components/
    ui/                               primitives
    nav/sidebar.tsx
    money/amount.tsx
    venture/add-contribution.tsx
    page-header.tsx, delete-button.tsx, settle-dialog.tsx

supabase/migrations/                  paste these once
```

## Notes

- All money stored as **paise (₹ × 100)** in `bigint`. UI converts to rupees.
- Single-user. Service role key on the server, no RLS needed.
- Auto-linking: when a venture contribution makes someone over/underpay
  their share, a `lendings` row is created automatically by a trigger.
  Cash position is correctly reflected because we exclude `source='venture_auto'`
  rows from `v_balance` (the cash already moved when the contribution was logged).
