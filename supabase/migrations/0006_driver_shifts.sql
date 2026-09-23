-- Quallor TBS: driver clock-in, clock-out and online status
--
-- A shift is the time a driver is working a taxi: it starts when they clock in
-- on the driver device and ends when they clock out, or when the operator's
-- maximum shift length runs out. Within a shift the driver is either online
-- (taking passengers) or offline (on a break). Both used to live only in the
-- browser's localStorage; they are now records the operator can rely on.
--
-- Drivers never write these tables directly. Every change goes through the
-- clock_in, clock_out and set_driver_online functions below, so a driver cannot
-- backdate a shift, extend it past the limit, or clock in on a taxi the fleet
-- office has taken off the road. Every change is also written to
-- driver_shift_events, which is append-only.
--
-- Apply after 0005.

do $$ begin
  create type public.shift_end_reason as enum ('driver', 'shift-limit', 'vehicle-off-road');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shift_event_kind as enum ('clock-in', 'online', 'offline', 'clock-out', 'shift-limit');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.driver_shifts (
  id                uuid primary key default gen_random_uuid(),
  driver_id         uuid not null references public.profiles (id) on delete cascade,
  vehicle_id        uuid references public.vehicles (id) on delete set null,
  plate             text not null default '',

  clocked_in_at     timestamptz not null default now(),
  clocked_out_at    timestamptz,
  end_reason        public.shift_end_reason,

  -- Copied from the operator's policy at clock-in, so a later policy change
  -- does not rewrite a shift that is already running.
  max_shift_hours   integer not null default 12 check (max_shift_hours between 1 and 24),

  online            boolean not null default true,
  online_changed_at timestamptz not null default now(),

  created_at        timestamptz not null default now(),

  check (clocked_out_at is null or clocked_out_at >= clocked_in_at),
  check (clocked_out_at is null or not online)
);

-- One open shift per driver. The driver and gaatjie devices share the driver's
-- account, so both see the same shift.
create unique index if not exists driver_shifts_one_open
  on public.driver_shifts (driver_id) where clocked_out_at is null;
create index if not exists driver_shifts_driver_idx on public.driver_shifts (driver_id, clocked_in_at desc);
create index if not exists driver_shifts_vehicle_idx on public.driver_shifts (vehicle_id, clocked_in_at desc);

create table if not exists public.driver_shift_events (
  id          uuid primary key default gen_random_uuid(),
  shift_id    uuid not null references public.driver_shifts (id) on delete cascade,
  driver_id   uuid not null references public.profiles (id) on delete cascade,
  vehicle_id  uuid references public.vehicles (id) on delete set null,
  kind        public.shift_event_kind not null,
  occurred_at timestamptz not null default now()
);

create index if not exists driver_shift_events_shift_idx on public.driver_shift_events (shift_id, occurred_at);

-- ---------------------------------------------------------------------------
-- Row level security: read-only for everyone. Writes happen only inside the
-- SECURITY DEFINER functions below.
-- ---------------------------------------------------------------------------

alter table public.driver_shifts enable row level security;
alter table public.driver_shift_events enable row level security;

-- 0002's blanket grant only covered the tables that existed then. Select is
-- all a client needs; with no insert, update or delete policy, writes are
-- refused even where Supabase's default privileges would grant them.
grant select on public.driver_shifts, public.driver_shift_events to authenticated;

drop policy if exists driver_shifts_select_own on public.driver_shifts;
create policy driver_shifts_select_own on public.driver_shifts
  for select to authenticated
  using (driver_id = (select auth.uid()));

-- The operator of the vehicle sees who is working it.
drop policy if exists driver_shifts_select_operator on public.driver_shifts;
create policy driver_shifts_select_operator on public.driver_shifts
  for select to authenticated
  using (vehicle_id is not null and public.can_see_vehicle(vehicle_id));

drop policy if exists driver_shifts_select_fleet on public.driver_shifts;
create policy driver_shifts_select_fleet on public.driver_shifts
  for select to authenticated
  using (public.is_fleet());

drop policy if exists driver_shift_events_select_own on public.driver_shift_events;
create policy driver_shift_events_select_own on public.driver_shift_events
  for select to authenticated
  using (driver_id = (select auth.uid()));

drop policy if exists driver_shift_events_select_operator on public.driver_shift_events;
create policy driver_shift_events_select_operator on public.driver_shift_events
  for select to authenticated
  using (vehicle_id is not null and public.can_see_vehicle(vehicle_id));

drop policy if exists driver_shift_events_select_fleet on public.driver_shift_events;
create policy driver_shift_events_select_fleet on public.driver_shift_events
  for select to authenticated
  using (public.is_fleet());

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Closes the driver's open shift if it has run past its limit, stamping the
-- end at the moment the limit was reached rather than at "now". Returns the id
-- of the shift it closed, or null when there was nothing to close.
create or replace function public.close_expired_shift(target_driver uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  s public.driver_shifts;
  limit_at timestamptz;
begin
  select * into s from public.driver_shifts
  where driver_id = target_driver and clocked_out_at is null
  for update;

  if not found then
    return null;
  end if;

  limit_at := s.clocked_in_at + make_interval(hours => s.max_shift_hours);
  if limit_at > now() then
    return null;
  end if;

  update public.driver_shifts
     set clocked_out_at = limit_at, end_reason = 'shift-limit', online = false, online_changed_at = limit_at
   where id = s.id;

  insert into public.driver_shift_events (shift_id, driver_id, vehicle_id, kind, occurred_at)
  values (s.id, s.driver_id, s.vehicle_id, 'shift-limit', limit_at);

  return s.id;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- clock_in: start a shift on the caller's assigned vehicle.
--
-- Idempotent: if the caller is already on shift (for example the gaatjie
-- device clocked in first), the open shift is returned unchanged.
-- ---------------------------------------------------------------------------

create or replace function public.clock_in()
returns public.driver_shifts
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  me       uuid := (select auth.uid());
  prof     public.profiles;
  v        public.vehicles;
  open_s   public.driver_shifts;
  max_h    integer;
begin
  if me is null then
    raise exception 'Sign in before clocking in.' using errcode = '42501';
  end if;

  select * into prof from public.profiles where id = me;
  if prof.role is distinct from 'driver' then
    raise exception 'Only drivers can clock in.' using errcode = '42501';
  end if;

  perform public.close_expired_shift(me);

  select * into open_s from public.driver_shifts where driver_id = me and clocked_out_at is null;
  if found then
    return open_s;
  end if;

  -- The assigned vehicle; drivers who registered before being linked by id
  -- are matched on the plate on their profile, as the app does.
  select * into v from public.vehicles where driver_id = me order by updated_at desc limit 1;
  if not found and coalesce(prof.vehicle_plate, '') <> '' then
    select * into v from public.vehicles where upper(plate) = upper(prof.vehicle_plate) limit 1;
  end if;
  if v.id is null then
    raise exception 'No vehicle is assigned to you yet.' using errcode = 'P0001';
  end if;

  if not v.verified or v.status not in ('active', 'standby')
     or (v.licence_expiry is not null and v.licence_expiry < current_date) then
    raise exception '% is off the road. Contact the Quallor fleet office.', v.plate using errcode = 'P0001';
  end if;

  select coalesce(nullif(os.policies ->> 'maxShiftHours', '')::integer, 12) into max_h
  from public.operator_settings os where os.operator_id = v.operator_id;
  max_h := least(greatest(coalesce(max_h, 12), 1), 24);

  insert into public.driver_shifts (driver_id, vehicle_id, plate, max_shift_hours)
  values (me, v.id, v.plate, max_h)
  returning * into open_s;

  insert into public.driver_shift_events (shift_id, driver_id, vehicle_id, kind)
  values (open_s.id, me, v.id, 'clock-in');

  return open_s;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- clock_out: end the caller's shift. Returns null when there was none open.
-- ---------------------------------------------------------------------------

create or replace function public.clock_out()
returns public.driver_shifts
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  me       uuid := (select auth.uid());
  s        public.driver_shifts;
  expired  uuid;
begin
  if me is null then
    raise exception 'Sign in before clocking out.' using errcode = '42501';
  end if;

  -- A shift that already ran out is closed at its limit, not now.
  expired := public.close_expired_shift(me);
  if expired is not null then
    select * into s from public.driver_shifts where id = expired;
    return s;
  end if;

  update public.driver_shifts
     set clocked_out_at = now(), end_reason = 'driver', online = false, online_changed_at = now()
   where driver_id = me and clocked_out_at is null
  returning * into s;

  if not found then
    return null;
  end if;

  insert into public.driver_shift_events (shift_id, driver_id, vehicle_id, kind)
  values (s.id, me, s.vehicle_id, 'clock-out');

  return s;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- set_driver_online: go online (taking passengers) or offline (on a break)
-- within the current shift. A no-op when the status is unchanged.
-- ---------------------------------------------------------------------------

create or replace function public.set_driver_online(is_online boolean)
returns public.driver_shifts
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  me uuid := (select auth.uid());
  s  public.driver_shifts;
begin
  if me is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  if public.close_expired_shift(me) is not null then
    raise exception 'Your shift reached its time limit. Clock in again to start a new one.' using errcode = 'P0001';
  end if;

  select * into s from public.driver_shifts where driver_id = me and clocked_out_at is null for update;
  if not found then
    raise exception 'Clock in before going online.' using errcode = 'P0001';
  end if;

  if s.online = is_online then
    return s;
  end if;

  -- Going back online on a taxi that has since been taken off the road is
  -- refused; going offline is always allowed.
  if is_online and s.vehicle_id is not null and not public.vehicle_is_roadworthy(s.vehicle_id) then
    raise exception '% is off the road. Contact the Quallor fleet office.', s.plate using errcode = 'P0001';
  end if;

  update public.driver_shifts
     set online = is_online, online_changed_at = now()
   where id = s.id
  returning * into s;

  insert into public.driver_shift_events (shift_id, driver_id, vehicle_id, kind)
  values (s.id, me, s.vehicle_id, case when is_online then 'online' else 'offline' end::public.shift_event_kind);

  return s;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- A vehicle taken off the road by the fleet office ends any shift running on
-- it, so the operator's view never shows a driver working a suspended taxi.
-- ---------------------------------------------------------------------------

create or replace function public.end_shifts_on_grounded_vehicle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if (new.verified and new.status in ('active', 'standby'))
     or (not old.verified or old.status not in ('active', 'standby')) then
    return new;
  end if;

  with closed as (
    update public.driver_shifts
       set clocked_out_at = now(), end_reason = 'vehicle-off-road', online = false, online_changed_at = now()
     where vehicle_id = new.id and clocked_out_at is null
    returning id, driver_id, vehicle_id
  )
  insert into public.driver_shift_events (shift_id, driver_id, vehicle_id, kind)
  select id, driver_id, vehicle_id, 'clock-out' from closed;

  return new;
end;
$fn$;

drop trigger if exists vehicles_end_shifts on public.vehicles;
create trigger vehicles_end_shifts after update of status, verified on public.vehicles
  for each row execute function public.end_shifts_on_grounded_vehicle();

revoke all on function public.close_expired_shift(uuid) from public, anon, authenticated;
revoke all on function public.clock_in() from public, anon;
revoke all on function public.clock_out() from public, anon;
revoke all on function public.set_driver_online(boolean) from public, anon;
grant execute on function public.clock_in() to authenticated;
grant execute on function public.clock_out() to authenticated;
grant execute on function public.set_driver_online(boolean) to authenticated;
