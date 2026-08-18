-- Quallor TBS: which province a passenger travels in
--
-- The network runs in three metros and the routes do not overlap, so a
-- passenger has to say which one they are in before a destination list means
-- anything. This is an ordinary editable field on the profile: changing it is
-- the user's own business, so guard_privileged_profile_columns leaves it alone.

do $$ begin
  create type public.province as enum ('eastern-cape', 'western-cape', 'gauteng');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists home_province public.province not null default 'eastern-cape';

comment on column public.profiles.home_province is
  'The metro network this account travels in. Scopes every destination list.';

create index if not exists profiles_home_province_idx on public.profiles (home_province);

-- Carry the choice through signup, alongside name, phone and role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into public.profiles (
    id, name, email, phone, role, home_province,
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
    coalesce((new.raw_user_meta_data ->> 'home_province')::public.province, 'eastern-cape'),
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

-- Vehicles belong to a province too, so passenger search does not offer a
-- Khayelitsha commuter a taxi that only runs in Mdantsane.
alter table public.vehicles
  add column if not exists province public.province not null default 'eastern-cape';

create index if not exists vehicles_province_idx on public.vehicles (province, status);

-- The seeded register is all Eastern Cape, which the default already covers.
