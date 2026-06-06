alter table public.profiles add column if not exists email_verified boolean not null default false;
alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists phone_verified boolean not null default false;
alter table public.profiles add column if not exists selfie_verification_status text not null default 'not_started';

update public.profiles
set verification_status = 'unverified'
where verification_status = 'not_started';

alter table public.profiles drop constraint if exists profiles_verification_status_check;
alter table public.profiles
  add constraint profiles_verification_status_check
  check (verification_status in ('unverified', 'pending', 'verified', 'rejected'));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_selfie_verification_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_selfie_verification_status_check
      check (selfie_verification_status in ('not_started', 'pending', 'approved', 'rejected'));
  end if;
end
$$;

update public.profiles p
set email_verified = (u.email_confirmed_at is not null)
from auth.users u
where u.id = p.id;

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  reason text not null check (length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);

create table if not exists public.selfie_verification_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  selfie_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_user_id),
  check (blocker_id <> blocked_user_id)
);

create table if not exists public.safety_checkins (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('safe', 'need_help')),
  note text,
  created_at timestamptz not null default now(),
  unique (activity_id, profile_id)
);

alter table public.user_reports enable row level security;
alter table public.user_blocks enable row level security;
alter table public.safety_checkins enable row level security;
alter table public.selfie_verification_submissions enable row level security;

create or replace function public.calculate_profile_verification_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.selfie_verification_status = 'rejected' then
    new.verification_status := 'rejected';
  elsif new.email_verified = true
    and nullif(trim(new.phone_number), '') is not null
    and nullif(trim(new.avatar), '') is not null
    and new.selfie_verification_status = 'approved' then
    new.verification_status := 'verified';
  elsif new.selfie_verification_status = 'pending' then
    new.verification_status := 'pending';
  else
    new.verification_status := 'unverified';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_calculate_verification_status on public.profiles;
create trigger profiles_calculate_verification_status
before insert or update on public.profiles
for each row execute function public.calculate_profile_verification_status();

create or replace function public.is_profile_verified(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.verification_status = 'verified'
      and p.email_verified = true
      and nullif(trim(p.phone_number), '') is not null
      and nullif(trim(p.avatar), '') is not null
      and p.selfie_verification_status = 'approved'
  );
$$;

create or replace function public.sync_current_email_verification()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_verified boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select email_confirmed_at is not null into v_verified
  from auth.users
  where id = auth.uid();

  update public.profiles
  set email_verified = coalesce(v_verified, false)
  where id = auth.uid();

  return coalesce(v_verified, false);
end;
$$;

create or replace function public.submit_selfie_verification(p_selfie_path text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission_id uuid;
  v_user_prefix text := auth.uid()::text || '/';
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_selfie_path not like v_user_prefix || '%' then
    raise exception 'Invalid selfie path';
  end if;

  insert into public.selfie_verification_submissions (profile_id, selfie_path)
  values (auth.uid(), p_selfie_path)
  returning id into v_submission_id;

  update public.profiles
  set verification_status = 'pending',
      selfie_verification_status = 'pending',
      verification_submitted_at = now()
  where id = auth.uid();

  return v_submission_id;
end;
$$;

create or replace function public.submit_identity_verification(
  p_document_type text,
  p_document_front_path text,
  p_document_back_path text,
  p_selfie_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission_id uuid;
  v_user_prefix text := auth.uid()::text || '/';
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_document_type not in ('drivers_license', 'passport', 'national_id') then
    raise exception 'Unsupported document type';
  end if;

  if p_document_front_path not like v_user_prefix || '%'
    or p_selfie_path not like v_user_prefix || '%'
    or (p_document_back_path is not null and p_document_back_path not like v_user_prefix || '%') then
    raise exception 'Invalid document path';
  end if;

  insert into public.identity_verification_submissions (
    profile_id,
    document_type,
    document_front_path,
    document_back_path,
    selfie_path
  )
  values (
    auth.uid(),
    p_document_type,
    p_document_front_path,
    p_document_back_path,
    p_selfie_path
  )
  returning id into v_submission_id;

  update public.profiles
  set verification_status = 'pending',
      selfie_verification_status = 'pending',
      verification_submitted_at = now()
  where id = auth.uid();

  return v_submission_id;
end;
$$;

revoke all on function public.is_profile_verified(uuid) from public;
revoke all on function public.sync_current_email_verification() from public;
revoke all on function public.submit_selfie_verification(text) from public;
revoke all on function public.submit_identity_verification(text, text, text, text) from public;
grant execute on function public.is_profile_verified(uuid) to authenticated;
grant execute on function public.sync_current_email_verification() to authenticated;
grant execute on function public.submit_selfie_verification(text) to authenticated;
grant execute on function public.submit_identity_verification(text, text, text, text) to authenticated;

drop policy if exists "Hosts create activities" on public.activities;
create policy "Hosts create activities" on public.activities for insert to authenticated
  with check (auth.uid() = host_id and public.is_profile_verified(auth.uid()));

drop policy if exists "Users request activities" on public.activity_requests;
create policy "Users request activities" on public.activity_requests for insert to authenticated
  with check (auth.uid() = requester_id and public.is_profile_verified(auth.uid()));

drop policy if exists "Users create reports" on public.user_reports;
drop policy if exists "Users view their own reports" on public.user_reports;
drop policy if exists "Users manage their blocks" on public.user_blocks;
drop policy if exists "Users manage their safety checkins" on public.safety_checkins;
drop policy if exists "Users view their own selfie submissions" on public.selfie_verification_submissions;
drop policy if exists "Users create their own selfie submissions" on public.selfie_verification_submissions;
create policy "Users create reports" on public.user_reports for insert to authenticated
  with check (auth.uid() = reporter_id);
create policy "Users view their own reports" on public.user_reports for select to authenticated
  using (auth.uid() = reporter_id);
create policy "Users manage their blocks" on public.user_blocks for all to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);
create policy "Users manage their safety checkins" on public.safety_checkins for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
create policy "Users view their own selfie submissions" on public.selfie_verification_submissions
  for select to authenticated using (auth.uid() = profile_id);
create policy "Users create their own selfie submissions" on public.selfie_verification_submissions
  for insert to authenticated with check (auth.uid() = profile_id and status = 'pending');

create index if not exists user_reports_reported_idx on public.user_reports(reported_user_id, created_at desc);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_user_id);
create index if not exists safety_checkins_activity_idx on public.safety_checkins(activity_id);
create index if not exists selfie_verification_profile_idx
  on public.selfie_verification_submissions(profile_id, created_at desc);

revoke update on public.profiles from authenticated;
grant update (name, age, neighborhood, bio, interests, availability, radius_km, avatar, photo_urls, phone_number)
  on public.profiles to authenticated;
