-- ---------------------------------------------------------------------------
-- Confidentiality gate: let signed-out visitors file their acknowledgement.
--
-- The gate in `ConfidentialLayer` wraps the whole application and is shown
-- before anything else, including the sign-in screen, so almost every person
-- who accepts the undertaking is still `anon` at that moment. 0002 gave both
-- record-keeping tables an insert policy for `authenticated` only, which meant
-- the acknowledgement and the access trail were silently dropped for exactly
-- the visitors the gate exists to record.
--
-- `anon` may insert and nothing more: no select, no update, no delete, and the
-- row it writes may not claim to belong to a profile.
-- ---------------------------------------------------------------------------

grant insert on public.confidentiality_acknowledgements to anon;
grant insert on public.access_log to anon;

drop policy if exists confidentiality_ack_insert_anon on public.confidentiality_acknowledgements;
create policy confidentiality_ack_insert_anon on public.confidentiality_acknowledgements
  for insert to anon
  with check (user_id is null);

drop policy if exists access_log_insert_anon on public.access_log;
create policy access_log_insert_anon on public.access_log
  for insert to anon
  with check (user_id is null);
