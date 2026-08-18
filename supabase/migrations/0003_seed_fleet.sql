-- Quallor TBS: seed the fleet register
--
-- These are the five vehicles and three assessments the app used to write into
-- localStorage on first run. They live here instead so that every account sees
-- the same register, which is the whole point of moving off the device.
--
-- operator_id is left null: the seeded associations are not Quallor accounts,
-- they are just names on the register until a real operator signs up and the
-- fleet office assigns their vehicles across. operator_name carries the label
-- in the meantime.
--
-- Re-runnable: the unique index on upper(plate) makes a second run a no-op.

insert into public.vehicles
  (plate, model, year, capacity, operator_name, driver_name, driver_phone,
   home_rank, route, status, odometer, licence_expiry, permit_number,
   added_at, verified, source)
values
  ('EC 123-456', 'Toyota Quantum',    2021, 15, 'Border Alliance Taxi Association', 'Sipho Ndlovu',   '+27 63 123 4567', 'Beacon Bay Rank',   'Beacon Bay to Mdantsane',            'active',      143200, '2027-03-14', 'OL-EC-88213', '2025-11-02', true, 'fleet-manager'),
  ('EC 789-012', 'Toyota Quantum',    2019, 15, 'Border Alliance Taxi Association', 'Thabo Mokoena',  '+27 71 234 5678', 'East London CBD',   'East London to King William''s Town', 'active',      221000, '2026-09-30', 'OL-EC-77104', '2025-11-02', true, 'fleet-manager'),
  ('EC 345-678', 'Nissan NV350',      2022, 15, 'Amathole Taxi Council',            'Nomsa Dlamini',  '+27 82 345 6789', 'Southernwood Rank', 'Southernwood to Beacon Bay',          'active',      87600,  '2027-06-21', 'OL-EC-91556', '2026-01-18', true, 'fleet-manager'),
  ('EC 901-234', 'Toyota Quantum',    2017, 15, 'Border Alliance Taxi Association', 'Luyanda Zulu',   '+27 61 456 7890', 'Mdantsane Rank',    'Standing down',                       'maintenance', 314500, '2026-08-29', 'OL-EC-60398', '2025-11-02', true, 'fleet-manager'),
  ('EC 567-890', 'Mercedes Sprinter', 2023, 22, 'Amathole Taxi Council',            'Zanele Khumalo', '+27 73 567 8901', 'Mdantsane Rank',    'Mdantsane to City Centre',            'active',      189000, '2028-01-11', 'OL-EC-93877', '2026-04-06', true, 'fleet-manager')
on conflict (upper(plate)) do nothing;

-- Assessments are attached by plate, since the vehicle ids are generated above.
insert into public.assessments
  (vehicle_id, plate, type, assessed_at, assessor, score, result, items, notes, next_due)
select v.id, v.plate, s.type, s.assessed_at, s.assessor, s.score, s.result, s.items, s.notes, s.next_due
from (values
  ('EC 123-456', 'roadworthy'::public.assessment_type, '2026-07-12'::timestamptz, 'M. Jacobs', 92, 'pass'::public.assessment_result,
   '[{"label":"Brakes and handbrake","status":"pass"},
     {"label":"Tyre tread and pressure","status":"pass"},
     {"label":"Steering and suspension","status":"pass"},
     {"label":"Lights and indicators","status":"pass"},
     {"label":"Windscreen and wipers","status":"pass"},
     {"label":"Exhaust and emissions","status":"pass"}]'::jsonb,
   'Front tyres at 4mm, monitor before the next inspection.', '2027-01-12'::date),

  ('EC 901-234', 'roadworthy'::public.assessment_type, '2026-08-02'::timestamptz, 'M. Jacobs', 54, 'fail'::public.assessment_result,
   '[{"label":"Brakes and handbrake","status":"fail","note":"Rear brake pads below limit"},
     {"label":"Tyre tread and pressure","status":"fail","note":"Left rear tyre below tread depth"},
     {"label":"Steering and suspension","status":"pass"},
     {"label":"Lights and indicators","status":"pass"},
     {"label":"Windscreen and wipers","status":"pass"},
     {"label":"Exhaust and emissions","status":"pass"}]'::jsonb,
   'Vehicle pulled from service until brakes and tyre are replaced.', '2026-08-16'::date),

  ('EC 789-012', 'safety'::public.assessment_type, '2026-08-09'::timestamptz, 'N. Peters', 83, 'conditional'::public.assessment_result,
   '[{"label":"Seatbelts on every seat","status":"pass"},
     {"label":"Fire extinguisher present and charged","status":"pass"},
     {"label":"First aid kit stocked","status":"fail","note":"First aid kit missing burn dressing"},
     {"label":"Emergency exit clear","status":"pass"},
     {"label":"Warning triangle on board","status":"pass"},
     {"label":"Passenger grab handles secure","status":"pass"}]'::jsonb,
   'Restock first aid kit within 7 days.', '2026-08-16'::date)
) as s (plate, type, assessed_at, assessor, score, result, items, notes, next_due)
join public.vehicles v on upper(v.plate) = upper(s.plate)
where not exists (
  select 1 from public.assessments a
  where a.vehicle_id = v.id and a.type = s.type and a.assessed_at = s.assessed_at
);
