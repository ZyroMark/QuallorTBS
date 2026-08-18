-- Quallor TBS: core schema
--
-- Mirrors the shapes the app currently keeps in localStorage:
--   quallor_users     -> public.profiles
--   quallor_vehicles  -> public.vehicles / assessments / fleet_requests
--   quallor_bookings  -> public.bookings
--   quallor_settings  -> safety, wallet and operator tables
--
-- Every table is owned by an auth.users row, so the policies in 0002 have
-- something to key off. Apply this file before 0002.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.user_role as enum ('passenger', 'driver', 'operator', 'fleet');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_status as enum ('pending', 'verified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.vehicle_status as enum ('active', 'standby', 'maintenance', 'suspended', 'retired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.vehicle_source as enum ('fleet-manager', 'driver-registration');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assessment_type as enum ('roadworthy', 'safety', 'cleanliness', 'driver-conduct');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assessment_result as enum ('pass', 'conditional', 'fail');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_kind as enum ('add-vehicle', 'assessment', 'repair', 'driver-change', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('open', 'resolved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.trip_type as enum ('commute', 'hiking');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('confirmed', 'in-transit', 'completed', 'cancelled', 'pending-sync');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('cash', 'card', 'app');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invite_status as enum ('invited', 'joined');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payout_schedule as enum ('daily', 'weekly', 'monthly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.app_language as enum ('English', 'isiXhosa', 'Afrikaans');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at honest
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  name            text not null default '',
  email           text not null,
  phone           text not null default '',
  role            public.user_role not null default 'passenger',

  -- driver
  license_number  text,
  vehicle_plate   text,
  vehicle_model   text,
  vehicle_color   text,
  driver_status   public.verification_status,
  driver_earnings numeric(12, 2) not null default 0,
  vehicle_id      uuid,

  -- operator
  company_name    text,
  fleet_size      integer,
  operator_status public.verification_status,

  -- fleet office
  staff_number    text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Partial, so that phone-only signups (which carry a blank email) do not all
-- collide with each other on ''.
create unique index if not exists profiles_email_key
  on public.profiles (lower(email)) where email <> '';
create index if not exists profiles_role_idx on public.profiles (role);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers.
--
-- SECURITY DEFINER with a pinned search_path: these read profiles from inside
-- profiles' own policies, so they must not re-enter RLS or recursion follows.
-- ---------------------------------------------------------------------------

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $fn$
  select role from public.profiles where id = (select auth.uid());
$fn$;

create or replace function public.is_fleet()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(public.current_user_role() = 'fleet', false);
$fn$;

-- ---------------------------------------------------------------------------
-- New signups get a profile automatically, from the metadata the signup form
-- passes to supabase.auth.signUp({ options: { data: { ... } } }).
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into public.profiles (
    id, name, email, phone, role,
    license_number, vehicle_plate, vehicle_model, vehicle_color, driver_status,
    company_name, fleet_size, operator_status, staff_number
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    -- auth.users.email is null for a phone-only signup, and profiles.email is
    -- NOT NULL, so the whole signup would fail without this fallback.
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'passenger'),
    new.raw_user_meta_data ->> 'license_number',
    new.raw_user_meta_data ->> 'vehicle_plate',
    new.raw_user_meta_data ->> 'vehicle_model',
    new.raw_user_meta_data ->> 'vehicle_color',
    case when new.raw_user_meta_data ->> 'role' = 'driver'
         then 'pending'::public.verification_status end,
    new.raw_user_meta_data ->> 'company_name',
    nullif(new.raw_user_meta_data ->> 'fleet_size', '')::integer,
    case when new.raw_user_meta_data ->> 'role' = 'operator'
         then 'pending'::public.verification_status end,
    new.raw_user_meta_data ->> 'staff_number'
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- vehicles: the fleet register
-- ---------------------------------------------------------------------------

create table if not exists public.vehicles (
  id                uuid primary key default gen_random_uuid(),
  plate             text not null,
  model             text not null default 'Toyota Quantum',
  year              integer,
  capacity          integer not null default 15,

  operator_id       uuid references public.profiles (id) on delete set null,
  operator_name     text not null default '',
  driver_id         uuid references public.profiles (id) on delete set null,
  driver_name       text not null default '',
  driver_phone      text not null default '',

  home_rank         text not null default '',
  route             text not null default '',
  status            public.vehicle_status not null default 'standby',
  odometer          integer not null default 0,
  licence_expiry    date,
  permit_number     text,

  suspended_at      timestamptz,
  suspension_reason text,

  -- Vehicles created from a driver's own registration start unverified.
  verified          boolean not null default false,
  source            public.vehicle_source not null default 'fleet-manager',

  added_at          timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists vehicles_plate_key on public.vehicles (upper(plate));
create index if not exists vehicles_operator_idx on public.vehicles (operator_id);
create index if not exists vehicles_driver_idx on public.vehicles (driver_id);
create index if not exists vehicles_status_idx on public.vehicles (status);

drop trigger if exists vehicles_touch on public.vehicles;
create trigger vehicles_touch before update on public.vehicles
  for each row execute function public.touch_updated_at();

-- profiles.vehicle_id points back at the register once a driver is linked.
do $$ begin
  alter table public.profiles
    add constraint profiles_vehicle_fk
    foreign key (vehicle_id) references public.vehicles (id) on delete set null;
exception when duplicate_object then null; end $$;

-- Reads "can this vehicle carry passengers", used by driver and passenger views.
create or replace function public.vehicle_is_roadworthy(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1 from public.vehicles v
    where v.id = target and v.verified and v.status in ('active', 'standby')
  );
$fn$;

-- True when the caller is the operator or the assigned driver of the vehicle.
create or replace function public.can_see_vehicle(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1 from public.vehicles v
    where v.id = target
      and ((select auth.uid()) in (v.operator_id, v.driver_id))
  );
$fn$;

-- ---------------------------------------------------------------------------
-- assessments: inspection history, written by the fleet office only
-- ---------------------------------------------------------------------------

create table if not exists public.assessments (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.vehicles (id) on delete cascade,
  plate       text not null default '',
  type        public.assessment_type not null,
  assessed_at timestamptz not null default now(),
  assessor_id uuid references public.profiles (id) on delete set null,
  assessor    text not null default '',
  score       integer not null default 0,
  result      public.assessment_result not null,
  -- [{ label, status: pass|fail|na, note }]
  items       jsonb not null default '[]'::jsonb,
  notes       text not null default '',
  next_due    date,
  created_at  timestamptz not null default now()
);

create index if not exists assessments_vehicle_idx on public.assessments (vehicle_id, assessed_at desc);

-- ---------------------------------------------------------------------------
-- fleet_requests: an operator's inbox message to the fleet office
-- ---------------------------------------------------------------------------

create table if not exists public.fleet_requests (
  id            uuid primary key default gen_random_uuid(),
  kind          public.request_kind not null,
  operator_id   uuid not null references public.profiles (id) on delete cascade,
  operator_name text not null default '',
  vehicle_id    uuid references public.vehicles (id) on delete set null,
  plate         text,
  detail        text not null default '',
  status        public.request_status not null default 'open',
  raised_at     timestamptz not null default now(),
  resolved_at   timestamptz,
  resolved_by   uuid references public.profiles (id) on delete set null
);

create index if not exists fleet_requests_operator_idx on public.fleet_requests (operator_id, raised_at desc);
create index if not exists fleet_requests_status_idx on public.fleet_requests (status);

-- ---------------------------------------------------------------------------
-- bookings
--
-- booking_ref keeps the QLR-XXXX-XXXX reference the tickets and QR codes use;
-- the uuid id is the actual key. journey_id groups the legs of one trip.
-- ---------------------------------------------------------------------------

create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  booking_ref      text not null unique,

  trip_type        public.trip_type not null,
  from_location    text not null,
  to_location      text not null,

  taxi_id          text not null default '',
  taxi_name        text not null default '',
  vehicle_id       uuid references public.vehicles (id) on delete set null,

  departure_time   text not null default '',
  seat_number      text not null default '',
  fare             numeric(10, 2) not null default 0,

  passenger_id     uuid references public.profiles (id) on delete set null,
  passenger_name   text not null default '',
  passenger_phone  text,

  trip_date        date not null default current_date,
  status           public.booking_status not null default 'confirmed',
  qr_data          text not null default '',
  payment_method   public.payment_method,

  -- Walk-ups taken on board by the gaatjie rather than booked in the app.
  booked_by_driver boolean not null default false,
  created_by       uuid references public.profiles (id) on delete set null,

  journey_id       text,
  leg_index        integer,
  leg_count        integer,

  boarded_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists bookings_passenger_idx on public.bookings (passenger_id, trip_date desc);
create index if not exists bookings_vehicle_idx on public.bookings (vehicle_id, trip_date desc);
create index if not exists bookings_journey_idx on public.bookings (journey_id, leg_index);
create index if not exists bookings_date_idx on public.bookings (trip_date desc);

-- One passenger cannot hold the same seat on the same taxi on the same day.
create unique index if not exists bookings_seat_key
  on public.bookings (taxi_id, trip_date, seat_number)
  where status in ('confirmed', 'in-transit');

drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Safety and personal settings: one row per user
-- ---------------------------------------------------------------------------

create table if not exists public.trusted_contacts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  name             text not null,
  phone            text not null,
  relationship     text not null default '',
  can_see_location boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists trusted_contacts_user_idx on public.trusted_contacts (user_id);

create table if not exists public.safety_settings (
  user_id                       uuid primary key references public.profiles (id) on delete cascade,
  sos_enabled                   boolean not null default true,
  sos_countdown                 integer not null default 5,
  sos_calls_emergency_services  boolean not null default false,
  share_trip_automatically      boolean not null default false,
  share_route_deviations        boolean not null default true,
  biometric_enabled             boolean not null default false,
  password_changed_at           timestamptz,
  updated_at                    timestamptz not null default now()
);

drop trigger if exists safety_settings_touch on public.safety_settings;
create trigger safety_settings_touch before update on public.safety_settings
  for each row execute function public.touch_updated_at();

create table if not exists public.app_preferences (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  push_notifications boolean not null default true,
  sms_notifications  boolean not null default true,
  trip_reminders     boolean not null default true,
  language           public.app_language not null default 'English',
  reduce_motion      boolean not null default false,
  updated_at         timestamptz not null default now()
);

drop trigger if exists app_preferences_touch on public.app_preferences;
create trigger app_preferences_touch before update on public.app_preferences
  for each row execute function public.touch_updated_at();

create table if not exists public.sos_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  booking_id   uuid references public.bookings (id) on delete set null,
  triggered_at timestamptz not null default now(),
  location     text not null default '',
  notified     jsonb not null default '[]'::jsonb,
  resolved     boolean not null default false,
  resolved_at  timestamptz
);

create index if not exists sos_events_user_idx on public.sos_events (user_id, triggered_at desc);
create index if not exists sos_events_open_idx on public.sos_events (resolved) where not resolved;

-- ---------------------------------------------------------------------------
-- Wallet.
--
-- Card details never land here: only a label and the last four digits. The
-- balance is derived from wallet_transactions rather than stored twice.
-- ---------------------------------------------------------------------------

create table if not exists public.payment_methods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       public.payment_method not null default 'card',
  label      text not null default '',
  last4      text check (last4 is null or last4 ~ '^[0-9]{4}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists payment_methods_user_idx on public.payment_methods (user_id);
create unique index if not exists payment_methods_one_default
  on public.payment_methods (user_id) where is_default;

create table if not exists public.wallet_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  booking_id  uuid references public.bookings (id) on delete set null,
  description text not null default '',
  -- Positive for a top up, negative for a fare.
  amount      numeric(10, 2) not null,
  method      text not null default '',
  occurred_at timestamptz not null default now()
);

create index if not exists wallet_transactions_user_idx on public.wallet_transactions (user_id, occurred_at desc);

create or replace function public.wallet_balance(target uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(sum(amount), 0) from public.wallet_transactions where user_id = target;
$fn$;

-- ---------------------------------------------------------------------------
-- Operator settings and routes
-- ---------------------------------------------------------------------------

create table if not exists public.operator_settings (
  operator_id         uuid primary key references public.profiles (id) on delete cascade,
  trading_name        text not null default '',
  registration_number text not null default '',
  vat_number          text not null default '',
  contact_email       text not null default '',
  contact_phone       text not null default '',
  operating_region    text not null default '',

  -- Payout destination. Only bank, holder and last four digits: the full
  -- account number stays with the payment provider.
  payout_bank_name      text not null default '',
  payout_account_last4  text check (payout_account_last4 is null or payout_account_last4 ~ '^[0-9]{4}$'),
  payout_account_holder text not null default '',
  payout_schedule       public.payout_schedule not null default 'weekly',

  -- { maxSpeed, nightDriving, sosAutoEscalate, seatbeltCheckRequired, maxShiftHours }
  policies      jsonb not null default '{}'::jsonb,
  -- { dailyDigest, incidentAlerts, complianceAlerts, payoutAlerts }
  notifications jsonb not null default '{}'::jsonb,

  updated_at timestamptz not null default now()
);

drop trigger if exists operator_settings_touch on public.operator_settings;
create trigger operator_settings_touch before update on public.operator_settings
  for each row execute function public.touch_updated_at();

create table if not exists public.operator_routes (
  id            uuid primary key default gen_random_uuid(),
  operator_id   uuid not null references public.profiles (id) on delete cascade,
  from_location text not null,
  to_location   text not null,
  fare          numeric(10, 2) not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists operator_routes_operator_idx on public.operator_routes (operator_id);
create index if not exists operator_routes_active_idx on public.operator_routes (active) where active;

create table if not exists public.driver_invites (
  id          uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  phone       text not null,
  status      public.invite_status not null default 'invited',
  sent_at     timestamptz not null default now(),
  joined_at   timestamptz
);

create index if not exists driver_invites_operator_idx on public.driver_invites (operator_id);

-- ---------------------------------------------------------------------------
-- Confidentiality gate (src/lib/confidential.ts).
--
-- Append-only: acknowledgements and the access log are evidence, so nothing
-- here is updatable or deletable by the person they describe.
-- ---------------------------------------------------------------------------

create table if not exists public.confidentiality_acknowledgements (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references public.profiles (id) on delete set null,
  version                  text not null default '',
  full_name                text not null default '',
  organisation             text not null default '',
  email                    text not null default '',
  accepted_confidentiality boolean not null default false,
  accepted_popia           boolean not null default false,
  accepted_at              timestamptz not null default now(),
  session_ref              text not null default '',
  user_agent               text not null default '',
  platform                 text not null default '',
  language                 text not null default '',
  time_zone                text not null default '',
  screen                   text not null default ''
);

create index if not exists confidentiality_ack_session_idx
  on public.confidentiality_acknowledgements (session_ref, accepted_at desc);

create table if not exists public.access_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  session_ref text not null default '',
  event       text not null,
  detail      text not null default '',
  occurred_at timestamptz not null default now()
);

create index if not exists access_log_session_idx on public.access_log (session_ref, occurred_at desc);
