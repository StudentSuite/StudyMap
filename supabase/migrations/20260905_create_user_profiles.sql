-- First-run onboarding questionnaire answers. One row per user, plain
-- scalar columns so they stay queryable (no JSON blob to unnest).
-- Run this once against the project's Supabase database (SQL editor or
-- `supabase db push`). Requires dashboard/CLI access this repo's Claude
-- session did not have, so it ships as a migration file instead of being
-- applied automatically.

create table if not exists public.user_profiles (
  user_id          uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  graduation_year  int,
  board            text,
  field            text,
  country          text,
  referral_source  text,
  referral_other   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint user_profiles_graduation_year_check
    check (graduation_year is null or graduation_year between 2024 and 2040),
  constraint user_profiles_board_check
    check (board is null or board in
      ('IB','IGCSE','CBSE','ICSE','A-Levels','AP','State board','Other')),
  constraint user_profiles_field_check
    check (field is null or field in
      ('STEM','Humanities','Commerce','Arts','Undecided')),
  constraint user_profiles_country_check
    check (country is null or country in
      ('IN','US','GB','CA','AU','SG','DE','FR','CN','JP','KR','BR','ZA','Other')),
  constraint user_profiles_referral_source_check
    check (referral_source is null or referral_source in
      ('GitHub','Google','Instagram','Friend or school','Reddit','Other'))
);

alter table public.user_profiles enable row level security;

create policy "own profile is selectable" on public.user_profiles
  for select using (auth.uid() = user_id);
create policy "own profile is insertable" on public.user_profiles
  for insert with check (auth.uid() = user_id);
create policy "own profile is updatable" on public.user_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
