-- Harden user_places / user_home to match the app contract (#170).
--
-- Follows 20260701_create_user_places.sql. Ships as a separate migration so
-- the checksum of the original file stays stable for databases where it was
-- already applied.
--
-- Notes on the UPDATE policy: `using (auth.uid() = user_id)` with no explicit
-- WITH CHECK already blocks reassigning a row to another user, because
-- Postgres reuses the USING expression as the check and evaluates it against
-- the NEW row. The explicit WITH CHECK below is documentation + insurance:
-- it keeps that invariant true even if someone later adds a second update
-- policy or edits this one without re-deriving the semantics.
--
-- Constraint deployment (review feedback): ADD CONSTRAINT ... CHECK validates
-- every existing row under an ACCESS EXCLUSIVE lock, so a single legacy row
-- with a retired `type` (the imp_locations -> other_places rename predates
-- this) or an out-of-range coordinate would fail mid-deploy and block
-- everything behind it. Two mitigations:
--   1. unknown types are first normalized to 'other_places' (the bucket the
--      app already uses for anything unmapped);
--   2. constraints ship as NOT VALID + a separate VALIDATE step: the table is
--      only briefly locked for catalog changes, and any surviving bad row
--      surfaces as a clean validation failure instead of a locked-table
--      timeout.

update user_places
  set type = 'other_places'
  where type not in (
    'library',
    'other_places',
    'airport',
    'sat_centre',
    'foreign_lang_exam_centre',
    'gov_offices'
  );

alter table user_places
  add constraint user_places_type_check
  check (type in (
    'library',
    'other_places',
    'airport',
    'sat_centre',
    'foreign_lang_exam_centre',
    'gov_offices'
  )) not valid;

alter table user_places validate constraint user_places_type_check;

alter table user_places
  add constraint user_places_lat_check
  check (lat between -90 and 90) not valid;
alter table user_places validate constraint user_places_lat_check;
alter table user_places
  add constraint user_places_lng_check
  check (lng between -180 and 180) not valid;
alter table user_places validate constraint user_places_lng_check;

alter table user_home
  add constraint user_home_lat_check
  check (lat between -90 and 90) not valid;
alter table user_home validate constraint user_home_lat_check;
alter table user_home
  add constraint user_home_lng_check
  check (lng between -180 and 180) not valid;
alter table user_home validate constraint user_home_lng_check;

drop policy if exists "Users can update their own places" on user_places;
create policy "Users can update their own places"
  on user_places for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own home" on user_home;
create policy "Users can update their own home"
  on user_home for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
