# Supabase setup

## What the two keys can and cannot do

The `anon` and `service_role` keys on **Settings → API Keys** are runtime keys.
They authenticate calls to PostgREST, which reads and writes rows in tables that
already exist. Neither of them can run `create table` or `create policy` —
schema changes need the SQL Editor, the Postgres connection string, or a
Management API token. That is why the migrations below are applied by hand
rather than by the app.

- **`anon` / publishable** — goes in `.env.local` as
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` and ships to the browser. That is fine
  *because* every table has RLS enabled; the key by itself grants nothing.
- **`service_role` / secret** — bypasses every policy in `0002_rls_policies.sql`.
  Nothing in this app needs it. Keep it out of the repo, out of chat, and out of
  any `NEXT_PUBLIC_` variable. If it ever leaks, rotate the JWT secret.

## Applying the migrations

Run these once, in order, in **SQL Editor → New query**:

1. `migrations/0001_init_schema.sql` — extensions, enums, tables, indexes,
   triggers, and the `handle_new_user` hook that creates a profile row for every
   new `auth.users` row.
2. `migrations/0002_rls_policies.sql` — enables RLS on all fourteen tables and
   defines every policy.

Both files are re-runnable: types are guarded with `duplicate_object` handlers,
tables use `create table if not exists`, and each policy is dropped before it is
created. Applying them twice is a no-op.

Verify afterwards with:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Every row must read `rowsecurity = true`. Supabase's **Advisors → Security** page
should report no "RLS disabled in public" findings.

## Filling in the environment

`.env.local` already has the placeholders:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The URL is on **Settings → Data API**; the project ref is the subdomain. Restart
`npm run dev` after editing — Next.js reads `.env.local` at boot only.

## Who can see what

| Role | Reach |
| --- | --- |
| passenger | own profile, bookings, wallet, safety settings; roadworthy vehicles and active routes |
| driver | the above, plus the manifest for the vehicle assigned to them, boarding, and walk-up bookings |
| operator | own settings, routes and driver invites; read-only view of their own vehicles and the drivers on them; raises `fleet_requests` |
| fleet | the whole vehicle register, assessments, all requests, SOS events, and the confidentiality log |

Two guard triggers back the policies up where `with check` cannot see the old
row: `guard_privileged_profile_columns` stops a user promoting their own `role`
or verification status, and `guard_booking_columns` stops a passenger rewriting
the fare, taxi or boarding record on a ticket they own.

## Generating types

Once the schema is applied:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/supabase/database.types.ts
```

Then pass the `Database` generic to `createBrowserClient` / `createServerClient`
in `src/lib/supabase/`.

## Not done yet

The app still keeps everything in `localStorage` (`quallor_users`,
`quallor_bookings`, `quallor_vehicles`, `quallor_settings`). The schema mirrors
those shapes so the contexts can be moved across one at a time, but no context
reads from Supabase yet. `AuthContext` is the one to migrate first, since RLS
keys off `auth.uid()` — until real Supabase sessions exist, every policy above
will correctly deny access.
