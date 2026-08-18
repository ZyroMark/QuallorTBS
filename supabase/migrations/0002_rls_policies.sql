-- Quallor TBS: row level security
--
-- Default posture is deny. Every table below has RLS enabled and no policy for
-- the `anon` role, so an unauthenticated caller holding the publishable key
-- reads nothing. Access is granted per role from the profiles table.
--
-- Who can do what, in one paragraph: a passenger owns their own profile,
-- bookings, wallet and safety settings and nothing else. A driver additionally
-- reads and boards the bookings on the vehicle assigned to them. An operator
-- reads the slice of the register that belongs to them and raises requests, but
-- never edits the register. The fleet office owns the register outright and is
-- the only role that can verify, suspend or assess a vehicle.
--
-- Apply 0001 before this file.

-- ---------------------------------------------------------------------------
-- Relationship helpers.
--
-- SECURITY DEFINER so that a policy on table A can consult table B without
-- needing a policy on B for the caller, and without recursing.
-- ---------------------------------------------------------------------------

-- True when `target` is a driver assigned to one of the caller's vehicles.
create or replace function public.is_my_driver(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1 from public.vehicles v
    where v.operator_id = (select auth.uid()) and v.driver_id = target
  );
$fn$;

-- True when the caller is the assigned driver of `target`. This is the gaatjie
-- check: boarding a passenger is a driver action, not an operator one.
create or replace function public.drives_vehicle(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1 from public.vehicles v
    where v.id = target and v.driver_id = (select auth.uid())
  );
$fn$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists profiles_select_fleet on public.profiles;
create policy profiles_select_fleet on public.profiles
  for select to authenticated
  using (public.is_fleet());

drop policy if exists profiles_select_my_drivers on public.profiles;
create policy profiles_select_my_drivers on public.profiles
  for select to authenticated
  using (public.is_my_driver(id));

-- The auth trigger normally writes this row; the policy covers a manual repair.
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists profiles_update_fleet on public.profiles;
create policy profiles_update_fleet on public.profiles
  for update to authenticated
  using (public.is_fleet())
  with check (public.is_fleet());

-- WITH CHECK cannot see the old row, so the columns that decide privilege are
-- guarded by a trigger instead. Without this, `profiles_update_own` would let
-- any passenger set their own role to 'fleet' and take the register.
create or replace function public.guard_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  -- No auth.uid() means this is not an end-user request at all: the SQL editor,
  -- a migration, or a service_role job. Those already bypass RLS, so blocking
  -- them here would only stop the fleet office verifying a driver by script.
  if (select auth.uid()) is null or public.is_fleet() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.driver_status is distinct from old.driver_status
     or new.operator_status is distinct from old.operator_status
     or new.staff_number is distinct from old.staff_number
     or new.driver_earnings is distinct from old.driver_earnings
     or new.vehicle_id is distinct from old.vehicle_id
  then
    raise exception 'Only the fleet office can change role, verification status, earnings or vehicle assignment.'
      using errcode = '42501';
  end if;

  return new;
end;
$fn$;

drop trigger if exists profiles_guard_privileged on public.profiles;
create trigger profiles_guard_privileged before update on public.profiles
  for each row execute function public.guard_privileged_profile_columns();

-- ---------------------------------------------------------------------------
-- vehicles
--
-- Passengers need to see what can carry them, so roadworthy vehicles are
-- readable by any signed-in user. Everything else is owner or fleet only.
-- ---------------------------------------------------------------------------

alter table public.vehicles enable row level security;

drop policy if exists vehicles_select_roadworthy on public.vehicles;
create policy vehicles_select_roadworthy on public.vehicles
  for select to authenticated
  using (verified and status in ('active', 'standby'));

drop policy if exists vehicles_select_own on public.vehicles;
create policy vehicles_select_own on public.vehicles
  for select to authenticated
  using ((select auth.uid()) in (operator_id, driver_id));

drop policy if exists vehicles_select_fleet on public.vehicles;
create policy vehicles_select_fleet on public.vehicles
  for select to authenticated
  using (public.is_fleet());

drop policy if exists vehicles_insert_fleet on public.vehicles;
create policy vehicles_insert_fleet on public.vehicles
  for insert to authenticated
  with check (public.is_fleet());

-- A driver registering through /driver/register creates their own record. It
-- lands unverified and off the road until the fleet office checks the papers.
drop policy if exists vehicles_insert_driver_registration on public.vehicles;
create policy vehicles_insert_driver_registration on public.vehicles
  for insert to authenticated
  with check (
    source = 'driver-registration'
    and driver_id = (select auth.uid())
    and verified = false
    and status = 'standby'
    and suspended_at is null
  );

-- Deliberately fleet-only: an operator asks for a change via fleet_requests.
drop policy if exists vehicles_update_fleet on public.vehicles;
create policy vehicles_update_fleet on public.vehicles
  for update to authenticated
  using (public.is_fleet())
  with check (public.is_fleet());

drop policy if exists vehicles_delete_fleet on public.vehicles;
create policy vehicles_delete_fleet on public.vehicles
  for delete to authenticated
  using (public.is_fleet());

-- ---------------------------------------------------------------------------
-- assessments
-- ---------------------------------------------------------------------------

alter table public.assessments enable row level security;

drop policy if exists assessments_select_related on public.assessments;
create policy assessments_select_related on public.assessments
  for select to authenticated
  using (public.can_see_vehicle(vehicle_id));

drop policy if exists assessments_select_fleet on public.assessments;
create policy assessments_select_fleet on public.assessments
  for select to authenticated
  using (public.is_fleet());

drop policy if exists assessments_write_fleet on public.assessments;
create policy assessments_write_fleet on public.assessments
  for all to authenticated
  using (public.is_fleet())
  with check (public.is_fleet());

-- ---------------------------------------------------------------------------
-- fleet_requests
-- ---------------------------------------------------------------------------

alter table public.fleet_requests enable row level security;

drop policy if exists fleet_requests_select_own on public.fleet_requests;
create policy fleet_requests_select_own on public.fleet_requests
  for select to authenticated
  using (operator_id = (select auth.uid()));

drop policy if exists fleet_requests_select_fleet on public.fleet_requests;
create policy fleet_requests_select_fleet on public.fleet_requests
  for select to authenticated
  using (public.is_fleet());

drop policy if exists fleet_requests_insert_own on public.fleet_requests;
create policy fleet_requests_insert_own on public.fleet_requests
  for insert to authenticated
  with check (operator_id = (select auth.uid()) and status = 'open');

-- An operator can still correct a request while the fleet office has not
-- picked it up; once resolved it is closed to them.
drop policy if exists fleet_requests_update_own_open on public.fleet_requests;
create policy fleet_requests_update_own_open on public.fleet_requests
  for update to authenticated
  using (operator_id = (select auth.uid()) and status = 'open')
  with check (operator_id = (select auth.uid()) and status = 'open');

drop policy if exists fleet_requests_update_fleet on public.fleet_requests;
create policy fleet_requests_update_fleet on public.fleet_requests
  for update to authenticated
  using (public.is_fleet())
  with check (public.is_fleet());

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------

alter table public.bookings enable row level security;

drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own on public.bookings
  for select to authenticated
  using ((select auth.uid()) in (passenger_id, created_by));

-- The manifest: the driver and the operator of the vehicle see its bookings.
drop policy if exists bookings_select_vehicle on public.bookings;
create policy bookings_select_vehicle on public.bookings
  for select to authenticated
  using (vehicle_id is not null and public.can_see_vehicle(vehicle_id));

drop policy if exists bookings_select_fleet on public.bookings;
create policy bookings_select_fleet on public.bookings
  for select to authenticated
  using (public.is_fleet());

drop policy if exists bookings_insert_passenger on public.bookings;
create policy bookings_insert_passenger on public.bookings
  for insert to authenticated
  with check (
    passenger_id = (select auth.uid())
    and created_by = (select auth.uid())
    and booked_by_driver = false
    and boarded_at is null
    and (vehicle_id is null or public.vehicle_is_roadworthy(vehicle_id))
  );

-- Walk-ups: the gaatjie books a passenger who has no app account, so
-- passenger_id is null and the driver is recorded as the creator.
drop policy if exists bookings_insert_walk_up on public.bookings;
create policy bookings_insert_walk_up on public.bookings
  for insert to authenticated
  with check (
    booked_by_driver = true
    and created_by = (select auth.uid())
    and public.drives_vehicle(vehicle_id)
  );

drop policy if exists bookings_update_own on public.bookings;
create policy bookings_update_own on public.bookings
  for update to authenticated
  using (passenger_id = (select auth.uid()))
  with check (passenger_id = (select auth.uid()));

-- Boarding a passenger, from the seat map or the QR scanner.
drop policy if exists bookings_update_driver on public.bookings;
create policy bookings_update_driver on public.bookings
  for update to authenticated
  using (vehicle_id is not null and public.drives_vehicle(vehicle_id))
  with check (vehicle_id is not null and public.drives_vehicle(vehicle_id));

-- A passenger owns their ticket but must not rewrite the fare or move the
-- booking onto another taxi after the fact.
create or replace function public.guard_booking_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if (select auth.uid()) is null
     or public.is_fleet()
     or public.drives_vehicle(old.vehicle_id)
  then
    return new;
  end if;

  if new.fare is distinct from old.fare
     or new.vehicle_id is distinct from old.vehicle_id
     or new.taxi_id is distinct from old.taxi_id
     or new.booking_ref is distinct from old.booking_ref
     or new.boarded_at is distinct from old.boarded_at
     or new.payment_method is distinct from old.payment_method
  then
    raise exception 'A passenger may change the status of their booking, not its fare, taxi or boarding record.'
      using errcode = '42501';
  end if;

  return new;
end;
$fn$;

drop trigger if exists bookings_guard_columns on public.bookings;
create trigger bookings_guard_columns before update on public.bookings
  for each row execute function public.guard_booking_columns();

-- ---------------------------------------------------------------------------
-- Personal settings: strictly owner-only, no fleet override. A trusted contact
-- list and an SOS history are the user's, not the company's.
-- ---------------------------------------------------------------------------

alter table public.trusted_contacts enable row level security;

drop policy if exists trusted_contacts_own on public.trusted_contacts;
create policy trusted_contacts_own on public.trusted_contacts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter table public.safety_settings enable row level security;

drop policy if exists safety_settings_own on public.safety_settings;
create policy safety_settings_own on public.safety_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter table public.app_preferences enable row level security;

drop policy if exists app_preferences_own on public.app_preferences;
create policy app_preferences_own on public.app_preferences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- sos_events: the one place the fleet office reads a passenger's safety data,
-- because somebody has to answer the alarm.
-- ---------------------------------------------------------------------------

alter table public.sos_events enable row level security;

drop policy if exists sos_events_select_own on public.sos_events;
create policy sos_events_select_own on public.sos_events
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists sos_events_select_fleet on public.sos_events;
create policy sos_events_select_fleet on public.sos_events
  for select to authenticated
  using (public.is_fleet());

drop policy if exists sos_events_insert_own on public.sos_events;
create policy sos_events_insert_own on public.sos_events
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists sos_events_update_own on public.sos_events;
create policy sos_events_update_own on public.sos_events
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists sos_events_update_fleet on public.sos_events;
create policy sos_events_update_fleet on public.sos_events
  for update to authenticated
  using (public.is_fleet())
  with check (public.is_fleet());

-- ---------------------------------------------------------------------------
-- Wallet
-- ---------------------------------------------------------------------------

alter table public.payment_methods enable row level security;

drop policy if exists payment_methods_own on public.payment_methods;
create policy payment_methods_own on public.payment_methods
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter table public.wallet_transactions enable row level security;

-- A ledger: rows are added and read, never edited or removed.
drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
create policy wallet_transactions_select_own on public.wallet_transactions
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists wallet_transactions_insert_own on public.wallet_transactions;
create policy wallet_transactions_insert_own on public.wallet_transactions
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Operator settings and routes
-- ---------------------------------------------------------------------------

alter table public.operator_settings enable row level security;

drop policy if exists operator_settings_own on public.operator_settings;
create policy operator_settings_own on public.operator_settings
  for all to authenticated
  using (operator_id = (select auth.uid()))
  with check (operator_id = (select auth.uid()));

drop policy if exists operator_settings_select_fleet on public.operator_settings;
create policy operator_settings_select_fleet on public.operator_settings
  for select to authenticated
  using (public.is_fleet());

alter table public.operator_routes enable row level security;

-- Passengers search on these, so an active route is readable by anyone signed in.
drop policy if exists operator_routes_select_active on public.operator_routes;
create policy operator_routes_select_active on public.operator_routes
  for select to authenticated
  using (active);

drop policy if exists operator_routes_own on public.operator_routes;
create policy operator_routes_own on public.operator_routes
  for all to authenticated
  using (operator_id = (select auth.uid()))
  with check (operator_id = (select auth.uid()));

drop policy if exists operator_routes_select_fleet on public.operator_routes;
create policy operator_routes_select_fleet on public.operator_routes
  for select to authenticated
  using (public.is_fleet());

alter table public.driver_invites enable row level security;

drop policy if exists driver_invites_own on public.driver_invites;
create policy driver_invites_own on public.driver_invites
  for all to authenticated
  using (operator_id = (select auth.uid()))
  with check (operator_id = (select auth.uid()));

drop policy if exists driver_invites_select_fleet on public.driver_invites;
create policy driver_invites_select_fleet on public.driver_invites
  for select to authenticated
  using (public.is_fleet());

-- ---------------------------------------------------------------------------
-- Confidentiality gate: append-only evidence.
--
-- Insert is open to any signed-in caller and there is no update or delete
-- policy at all, so a record cannot be altered or erased after the fact. Only
-- the fleet office reads them back.
-- ---------------------------------------------------------------------------

alter table public.confidentiality_acknowledgements enable row level security;

drop policy if exists confidentiality_ack_insert on public.confidentiality_acknowledgements;
create policy confidentiality_ack_insert on public.confidentiality_acknowledgements
  for insert to authenticated
  with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists confidentiality_ack_select_own on public.confidentiality_acknowledgements;
create policy confidentiality_ack_select_own on public.confidentiality_acknowledgements
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists confidentiality_ack_select_fleet on public.confidentiality_acknowledgements;
create policy confidentiality_ack_select_fleet on public.confidentiality_acknowledgements
  for select to authenticated
  using (public.is_fleet());

alter table public.access_log enable row level security;

drop policy if exists access_log_insert on public.access_log;
create policy access_log_insert on public.access_log
  for insert to authenticated
  with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists access_log_select_fleet on public.access_log;
create policy access_log_select_fleet on public.access_log
  for select to authenticated
  using (public.is_fleet());

-- ---------------------------------------------------------------------------
-- Grants.
--
-- Supabase grants these by default for new tables in `public`, but stating them
-- explicitly means the migration does not depend on project defaults. RLS, not
-- the grant, is what actually decides access: `anon` holds no policy on any
-- table above and therefore reads nothing.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
