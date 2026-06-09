-- ============================================================
-- SCHEMA, FUNCTIONS, AND TRIGGERS
-- Source: supabase/schema.sql
-- ============================================================
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'BuddyUp member',
  username text unique,
  city text,
  bio text not null default '',
  avatar_url text,
  phone text,
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  selfie_verified boolean not null default false,
  verification_status text not null default 'unverified',
  verification_rejection_reason text,
  interests text[] not null default '{}',
  trust_score integer not null default 0,
  is_admin boolean not null default false,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_verification_status_check
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  constraint profiles_trust_score_check check (trust_score between 0 and 100)
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists selfie_verified boolean not null default false;
alter table public.profiles add column if not exists verification_rejection_reason text;
alter table public.profiles add column if not exists trust_score integer not null default 0;
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists email_verified boolean not null default false;
alter table public.profiles add column if not exists phone_verified boolean not null default false;
alter table public.profiles add column if not exists verification_status text not null default 'unverified';
alter table public.profiles alter column full_name set default 'BuddyUp member';

update public.profiles
set full_name = coalesce(nullif(full_name, ''), nullif(to_jsonb(profiles)->>'name', ''), 'BuddyUp member'),
    city = coalesce(city, to_jsonb(profiles)->>'neighborhood'),
    avatar_url = coalesce(avatar_url, to_jsonb(profiles)->>'avatar'),
    phone = coalesce(phone, to_jsonb(profiles)->>'phone_number'),
    selfie_verified = selfie_verified
      or coalesce(to_jsonb(profiles)->>'selfie_verification_status', '') = 'approved'
where full_name is null
   or city is null
   or avatar_url is null
   or phone is null
   or selfie_verified = false;

alter table public.profiles alter column full_name set not null;

alter table public.profiles drop constraint if exists profiles_verification_status_check;
alter table public.profiles add constraint profiles_verification_status_check
  check (verification_status in ('unverified', 'pending', 'verified', 'rejected'));
alter table public.profiles drop constraint if exists profiles_trust_score_check;
alter table public.profiles add constraint profiles_trust_score_check
  check (trust_score between 0 and 100);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'name'
  ) then
    alter table public.profiles alter column name drop not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'age'
  ) then
    alter table public.profiles alter column age drop not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'neighborhood'
  ) then
    alter table public.profiles alter column neighborhood drop not null;
  end if;
end $$;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  city text,
  location_name text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  activity_date date,
  activity_time time,
  max_people integer not null default 2,
  status text not null default 'open',
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_status_check check (status in ('open', 'full', 'cancelled', 'completed')),
  constraint activities_visibility_check check (visibility in ('public', 'private')),
  constraint activities_max_people_check check (max_people between 2 and 100)
);

alter table public.activities add column if not exists created_by uuid references public.profiles(id) on delete cascade;
alter table public.activities add column if not exists description text;
alter table public.activities add column if not exists city text;
alter table public.activities add column if not exists location_name text;
alter table public.activities add column if not exists latitude numeric(9,6);
alter table public.activities add column if not exists longitude numeric(9,6);
alter table public.activities add column if not exists activity_date date;
alter table public.activities add column if not exists activity_time time;
alter table public.activities add column if not exists max_people integer not null default 2;
alter table public.activities add column if not exists status text not null default 'open';
alter table public.activities add column if not exists visibility text not null default 'public';
alter table public.activities add column if not exists updated_at timestamptz not null default now();
alter table public.activities alter column description drop not null;

update public.activities
set created_by = coalesce(created_by, (to_jsonb(activities)->>'host_id')::uuid),
    location_name = coalesce(location_name, to_jsonb(activities)->>'location'),
    max_people = coalesce(max_people, nullif(to_jsonb(activities)->>'spots', '')::integer, 2)
where created_by is null or location_name is null;

do $$
begin
  if not exists (select 1 from public.activities where created_by is null) then
    alter table public.activities alter column created_by set not null;
  end if;
end $$;

alter table public.activities drop constraint if exists activities_status_check;
alter table public.activities add constraint activities_status_check
  check (status in ('open', 'full', 'cancelled', 'completed'));
alter table public.activities drop constraint if exists activities_visibility_check;
alter table public.activities add constraint activities_visibility_check
  check (visibility in ('public', 'private'));
alter table public.activities drop constraint if exists activities_max_people_check;
alter table public.activities add constraint activities_max_people_check
  check (max_people between 2 and 100);

do $$
declare
  legacy_column text;
begin
  foreach legacy_column in array array['host_id', 'location', 'date_label', 'starts_at', 'spots', 'pace']
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'activities' and column_name = legacy_column
    ) then
      execute format('alter table public.activities alter column %I drop not null', legacy_column);
    end if;
  end loop;
end $$;

create table if not exists public.activity_requests (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_requests_status_check
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  unique (activity_id, requester_id)
);

alter table public.activity_requests add column if not exists host_id uuid references public.profiles(id) on delete cascade;
alter table public.activity_requests add column if not exists updated_at timestamptz not null default now();
alter table public.activity_requests alter column message drop not null;

alter table public.activity_requests drop constraint if exists activity_requests_status_check;
alter table public.activity_requests add constraint activity_requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'cancelled'));

update public.activity_requests r
set host_id = a.created_by
from public.activities a
where r.activity_id = a.id and r.host_id is null;

do $$
begin
  if not exists (select 1 from public.activity_requests where host_id is null) then
    alter table public.activity_requests alter column host_id set not null;
  end if;
end $$;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (activity_id, host_id, participant_id)
);

alter table public.conversations add column if not exists host_id uuid references public.profiles(id) on delete cascade;
alter table public.conversations add column if not exists participant_id uuid references public.profiles(id) on delete cascade;

do $$
begin
  if to_regclass('public.conversation_members') is not null then
    update public.conversations c
    set host_id = coalesce(c.host_id, a.created_by),
        participant_id = coalesce(
          c.participant_id,
          (
            select cm.profile_id
            from public.conversation_members cm
            where cm.conversation_id = c.id and cm.profile_id <> a.created_by
            limit 1
          )
        )
    from public.activities a
    where a.id = c.activity_id
      and (c.host_id is null or c.participant_id is null);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from public.conversations where host_id is null or participant_id is null) then
    alter table public.conversations alter column host_id set not null;
    alter table public.conversations alter column participant_id set not null;
  end if;
end $$;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.messages add column if not exists read_at timestamptz;

create table if not exists public.selfie_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  selfie_url text not null,
  status text not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint selfie_verifications_status_check check (status in ('pending', 'approved', 'rejected'))
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint reports_status_check check (status in ('open', 'reviewed', 'dismissed', 'action_taken')),
  constraint reports_different_users_check check (reporter_id <> reported_user_id)
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_user_id),
  constraint blocks_different_users_check check (blocker_id <> blocked_user_id)
);

create table if not exists public.safety_checkins (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint safety_checkins_status_check check (status in ('pending', 'safe', 'issue_reported')),
  unique (activity_id, user_id)
);

alter table public.safety_checkins add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.safety_checkins add column if not exists notes text;
alter table public.safety_checkins add column if not exists updated_at timestamptz not null default now();

alter table public.safety_checkins drop constraint if exists safety_checkins_status_check;

update public.safety_checkins
set user_id = coalesce(user_id, (to_jsonb(safety_checkins)->>'profile_id')::uuid),
    notes = coalesce(notes, to_jsonb(safety_checkins)->>'note'),
    status = case
      when status = 'need_help' then 'issue_reported'
      when status = 'safe' then 'safe'
      else 'pending'
    end
where user_id is null or status = 'need_help';

do $$
begin
  if not exists (select 1 from public.safety_checkins where user_id is null) then
    alter table public.safety_checkins alter column user_id set not null;
  end if;
end $$;

alter table public.safety_checkins add constraint safety_checkins_status_check
  check (status in ('pending', 'safe', 'issue_reported'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_calculate_verification_status on public.profiles;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at before update on public.activities
for each row execute function public.set_updated_at();

drop trigger if exists activity_requests_set_updated_at on public.activity_requests;
create trigger activity_requests_set_updated_at before update on public.activity_requests
for each row execute function public.set_updated_at();

drop trigger if exists safety_checkins_set_updated_at on public.safety_checkins;
create trigger safety_checkins_set_updated_at before update on public.safety_checkins
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, email_verified)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, ''), '@', 1), 'BuddyUp member'),
    'buddy_' || substr(replace(new.id::text, '-', ''), 1, 10),
    new.email_confirmed_at is not null
  )
  on conflict (id) do update
  set email_verified = excluded.email_verified;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email_confirmed_at on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, username, email_verified)
select
  user_record.id,
  coalesce(
    nullif(user_record.raw_user_meta_data->>'full_name', ''),
    split_part(coalesce(user_record.email, ''), '@', 1),
    'BuddyUp member'
  ),
  'buddy_' || substr(replace(user_record.id::text, '-', ''), 1, 10),
  user_record.email_confirmed_at is not null
from auth.users user_record
on conflict (id) do update
set email_verified = excluded.email_verified,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    username = coalesce(public.profiles.username, excluded.username);

create or replace function public.is_admin_user(user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin and not is_blocked from public.profiles where id = user_id), false);
$$;

create or replace function public.users_are_blocked(first_user uuid, second_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = first_user and blocked_user_id = second_user)
       or (blocker_id = second_user and blocked_user_id = first_user)
  );
$$;

create or replace function public.is_verified_user(user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((
    select email_verified
      and avatar_url is not null
      and selfie_verified
      and verification_status = 'verified'
      and not is_blocked
    from public.profiles
    where id = user_id
  ), false);
$$;

create or replace function public.sync_current_email_verification()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  verified boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  select email_confirmed_at is not null into verified from auth.users where id = auth.uid();
  update public.profiles set email_verified = coalesce(verified, false) where id = auth.uid();
  return coalesce(verified, false);
end;
$$;

create or replace function public.get_current_profile()
returns setof public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  user_record auth.users;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into user_record from auth.users where id = auth.uid();

  insert into public.profiles (id, full_name, username, email_verified)
  values (
    user_record.id,
    coalesce(
      nullif(user_record.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(user_record.email, ''), '@', 1),
      'BuddyUp member'
    ),
    'buddy_' || substr(replace(user_record.id::text, '-', ''), 1, 10),
    user_record.email_confirmed_at is not null
  )
  on conflict (id) do update
  set email_verified = excluded.email_verified;

  return query select * from public.profiles where id = auth.uid();
end;
$$;

create or replace function public.submit_selfie_verification(selfie_path text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  verification_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if selfie_path not like auth.uid()::text || '/%' then
    raise exception 'Invalid selfie path';
  end if;

  update public.selfie_verifications
  set status = 'rejected',
      rejection_reason = 'Replaced by a newer submission',
      reviewed_at = now()
  where user_id = auth.uid() and status = 'pending';

  insert into public.selfie_verifications (user_id, selfie_url)
  values (auth.uid(), selfie_path)
  returning id into verification_id;

  update public.profiles
  set selfie_verified = false,
      verification_status = 'pending',
      verification_rejection_reason = null
  where id = auth.uid();

  return verification_id;
end;
$$;

create or replace function public.review_selfie_verification(
  verification_id uuid,
  decision text,
  rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
begin
  if not public.is_admin_user(auth.uid()) then
    raise exception 'Not authorized';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision';
  end if;
  if decision = 'rejected'
     and nullif(trim(review_selfie_verification.rejection_reason), '') is null then
    raise exception 'A rejection reason is required';
  end if;

  update public.selfie_verifications
  set status = decision,
      rejection_reason = case
        when decision = 'rejected' then trim(review_selfie_verification.rejection_reason)
        else null
      end,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = verification_id and status = 'pending'
  returning user_id into target_user;

  if target_user is null then
    raise exception 'Pending verification not found';
  end if;

  update public.profiles
  set selfie_verified = decision = 'approved',
      verification_status = case when decision = 'approved' then 'verified' else 'rejected' end,
      verification_rejection_reason = case
        when decision = 'rejected' then trim(review_selfie_verification.rejection_reason)
        else null
      end,
      trust_score = case when decision = 'approved' then greatest(trust_score, 60) else trust_score end
  where id = target_user;
end;
$$;

drop function if exists public.accept_activity_request(uuid);
create function public.accept_activity_request(request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.activity_requests;
  conversation_id uuid;
begin
  select * into request_row
  from public.activity_requests
  where id = request_id and host_id = auth.uid() and status = 'pending'
  for update;

  if request_row.id is null then
    raise exception 'Request not found or not owned by host';
  end if;
  if public.users_are_blocked(request_row.host_id, request_row.requester_id) then
    raise exception 'This request cannot be accepted';
  end if;

  update public.activity_requests set status = 'accepted' where id = request_id;
  insert into public.conversations (activity_id, host_id, participant_id)
  values (request_row.activity_id, request_row.host_id, request_row.requester_id)
  on conflict (activity_id, host_id, participant_id)
  do update set activity_id = excluded.activity_id
  returning id into conversation_id;
  return conversation_id;
end;
$$;

drop function if exists public.calculate_profile_verification_status();
drop function if exists public.submit_identity_verification(text, text, text, text);

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin_user(uuid) from public, anon, authenticated;
revoke all on function public.users_are_blocked(uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_verified_user(uuid) from public, anon, authenticated;
revoke all on function public.sync_current_email_verification() from public, anon, authenticated;
revoke all on function public.get_current_profile() from public, anon, authenticated;
revoke all on function public.submit_selfie_verification(text) from public, anon, authenticated;
revoke all on function public.review_selfie_verification(uuid, text, text) from public, anon, authenticated;
revoke all on function public.accept_activity_request(uuid) from public, anon, authenticated;
grant execute on function public.is_admin_user(uuid) to authenticated;
grant execute on function public.users_are_blocked(uuid, uuid) to authenticated;
grant execute on function public.is_verified_user(uuid) to authenticated;
grant execute on function public.sync_current_email_verification() to authenticated;
grant execute on function public.get_current_profile() to authenticated;
grant execute on function public.submit_selfie_verification(text) to authenticated;
grant execute on function public.review_selfie_verification(uuid, text, text) to authenticated;
grant execute on function public.accept_activity_request(uuid) to authenticated;

create index if not exists activities_feed_idx on public.activities(status, visibility, activity_date, activity_time);
create index if not exists activities_creator_idx on public.activities(created_by);
create index if not exists activity_requests_host_idx on public.activity_requests(host_id, status, created_at desc);
create index if not exists activity_requests_requester_idx on public.activity_requests(requester_id, created_at desc);
create index if not exists conversations_host_idx on public.conversations(host_id);
create index if not exists conversations_participant_idx on public.conversations(participant_id);
create unique index if not exists conversations_parties_unique_idx
  on public.conversations(activity_id, host_id, participant_id);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists selfie_verifications_pending_idx on public.selfie_verifications(status, created_at);
create index if not exists selfie_verifications_user_idx on public.selfie_verifications(user_id);
create index if not exists selfie_verifications_reviewer_idx on public.selfie_verifications(reviewed_by);
create index if not exists reports_reported_user_idx on public.reports(reported_user_id, created_at desc);
create index if not exists reports_reporter_idx on public.reports(reporter_id);
create index if not exists reports_activity_idx on public.reports(activity_id);
create index if not exists blocks_blocked_user_idx on public.blocks(blocked_user_id);
create index if not exists safety_checkins_issue_idx on public.safety_checkins(status, updated_at desc);
create index if not exists safety_checkins_user_idx on public.safety_checkins(user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- Source: supabase/rls.sql
-- ============================================================
alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.activity_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.selfie_verifications enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.safety_checkins enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.activities from anon, authenticated;
revoke all on table public.activity_requests from anon, authenticated;
revoke all on table public.conversations from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
revoke all on table public.selfie_verifications from anon, authenticated;
revoke all on table public.reports from anon, authenticated;
revoke all on table public.blocks from anon, authenticated;
revoke all on table public.safety_checkins from anon, authenticated;

grant select on table public.activities to authenticated;
grant insert on table public.activities to authenticated;
grant update (
  title, description, category, city, location_name, latitude, longitude,
  activity_date, activity_time, max_people, status, visibility
) on table public.activities to authenticated;
grant delete on table public.activities to authenticated;

grant select, insert on table public.activity_requests to authenticated;
grant update (status) on table public.activity_requests to authenticated;

grant select on table public.conversations to authenticated;
grant select, insert on table public.messages to authenticated;
grant select, insert on table public.selfie_verifications to authenticated;
grant select, insert on table public.reports to authenticated;
grant update (status) on table public.reports to authenticated;
grant select, insert, delete on table public.blocks to authenticated;
grant select, insert on table public.safety_checkins to authenticated;
grant update (status, notes) on table public.safety_checkins to authenticated;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Users manage their own profile" on public.profiles;
drop policy if exists "Users create their own unverified profile" on public.profiles;
drop policy if exists "Users update their own profile" on public.profiles;
drop policy if exists "Profiles visible unless blocked" on public.profiles;
create policy "Profiles visible unless blocked" on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or public.is_admin_user((select auth.uid()))
  or (
    not is_blocked
    and not public.users_are_blocked((select auth.uid()), id)
  )
);

grant select (
  id, full_name, username, city, bio, avatar_url,
  email_verified, phone_verified, selfie_verified, verification_status,
  interests, trust_score, created_at, updated_at
) on public.profiles to authenticated;

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

revoke update on public.profiles from authenticated;
grant update (full_name, username, city, bio, avatar_url, phone, interests)
on public.profiles to authenticated;

drop policy if exists "Visible public activities" on public.activities;
drop policy if exists "Authenticated users browse activities" on public.activities;
drop policy if exists "Hosts create activities" on public.activities;
drop policy if exists "Hosts update activities" on public.activities;
create policy "Visible public activities" on public.activities
for select to authenticated
using (
  created_by = (select auth.uid())
  or public.is_admin_user((select auth.uid()))
  or (
    visibility = 'public'
    and status in ('open', 'full', 'completed')
    and not public.users_are_blocked((select auth.uid()), created_by)
  )
);

drop policy if exists "Verified users create activities" on public.activities;
create policy "Verified users create activities" on public.activities
for insert to authenticated
with check (created_by = (select auth.uid()) and public.is_verified_user((select auth.uid())));

drop policy if exists "Creators update activities" on public.activities;
create policy "Creators update activities" on public.activities
for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

drop policy if exists "Creators delete activities" on public.activities;
create policy "Creators delete activities" on public.activities
for delete to authenticated
using (created_by = (select auth.uid()));

drop policy if exists "Request participants read requests" on public.activity_requests;
drop policy if exists "Participants view requests" on public.activity_requests;
drop policy if exists "Users request activities" on public.activity_requests;
drop policy if exists "Hosts answer requests" on public.activity_requests;
create policy "Request participants read requests" on public.activity_requests
for select to authenticated
using (requester_id = (select auth.uid()) or host_id = (select auth.uid()) or public.is_admin_user((select auth.uid())));

drop policy if exists "Verified users create requests" on public.activity_requests;
create policy "Verified users create requests" on public.activity_requests
for insert to authenticated
with check (
  requester_id = (select auth.uid())
  and host_id <> (select auth.uid())
  and public.is_verified_user((select auth.uid()))
  and host_id = (select created_by from public.activities where id = activity_id and status = 'open')
  and not public.users_are_blocked((select auth.uid()), host_id)
);

drop policy if exists "Participants update request status" on public.activity_requests;
create policy "Participants update request status" on public.activity_requests
for update to authenticated
using (host_id = (select auth.uid()) or requester_id = (select auth.uid()))
with check (
  (host_id = (select auth.uid()) and status in ('accepted', 'declined'))
  or (requester_id = (select auth.uid()) and status = 'cancelled')
);

drop policy if exists "Conversation members read conversations" on public.conversations;
drop policy if exists "Members view conversations" on public.conversations;
drop policy if exists "Hosts start conversations" on public.conversations;
create policy "Conversation members read conversations" on public.conversations
for select to authenticated
using (
  host_id = (select auth.uid())
  or participant_id = (select auth.uid())
  or public.is_admin_user((select auth.uid()))
);

drop policy if exists "Conversation members read messages" on public.messages;
drop policy if exists "Members read messages" on public.messages;
drop policy if exists "Members send messages" on public.messages;
create policy "Conversation members read messages" on public.messages
for select to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.host_id = (select auth.uid()) or c.participant_id = (select auth.uid()))
  )
);

drop policy if exists "Verified conversation members send messages" on public.messages;
create policy "Verified conversation members send messages" on public.messages
for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and public.is_verified_user((select auth.uid()))
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.host_id = (select auth.uid()) or c.participant_id = (select auth.uid()))
      and not public.users_are_blocked(c.host_id, c.participant_id)
  )
);

drop policy if exists "Users create selfie verification" on public.selfie_verifications;
create policy "Users create selfie verification" on public.selfie_verifications
for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists "Users and admins read selfie verification" on public.selfie_verifications;
create policy "Users and admins read selfie verification" on public.selfie_verifications
for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin_user((select auth.uid())));

drop policy if exists "Verified users create reports" on public.reports;
create policy "Verified users create reports" on public.reports
for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and reporter_id <> reported_user_id
  and public.is_verified_user((select auth.uid()))
);

drop policy if exists "Reporters and admins read reports" on public.reports;
create policy "Reporters and admins read reports" on public.reports
for select to authenticated
using (reporter_id = (select auth.uid()) or public.is_admin_user((select auth.uid())));

drop policy if exists "Admins update reports" on public.reports;
create policy "Admins update reports" on public.reports
for update to authenticated
using (public.is_admin_user((select auth.uid())))
with check (public.is_admin_user((select auth.uid())));

drop policy if exists "Users read own blocks" on public.blocks;
create policy "Users read own blocks" on public.blocks
for select to authenticated
using (blocker_id = (select auth.uid()));

drop policy if exists "Users create own blocks" on public.blocks;
create policy "Users create own blocks" on public.blocks
for insert to authenticated
with check (blocker_id = (select auth.uid()) and blocked_user_id <> (select auth.uid()));

drop policy if exists "Users delete own blocks" on public.blocks;
create policy "Users delete own blocks" on public.blocks
for delete to authenticated
using (blocker_id = (select auth.uid()));

drop policy if exists "Activity members read checkins" on public.safety_checkins;
create policy "Activity members read checkins" on public.safety_checkins
for select to authenticated
using (
  user_id = (select auth.uid())
  or (public.is_admin_user((select auth.uid())) and status = 'issue_reported')
  or exists (
    select 1 from public.activities a
    where a.id = activity_id and a.created_by = (select auth.uid())
  )
);

drop policy if exists "Activity members create checkins" on public.safety_checkins;
create policy "Activity members create checkins" on public.safety_checkins
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    exists (select 1 from public.activities a where a.id = activity_id and a.created_by = (select auth.uid()))
    or exists (
      select 1 from public.activity_requests r
      where r.activity_id = safety_checkins.activity_id
        and r.requester_id = (select auth.uid())
        and r.status = 'accepted'
    )
  )
);

drop policy if exists "Users update own checkins" on public.safety_checkins;
create policy "Users update own checkins" on public.safety_checkins
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

do $$
begin
  if to_regclass('public.conversation_members') is not null
     and not exists (
       select 1
       from public.conversations
       where host_id is null or participant_id is null
     ) then
    execute 'drop table public.conversation_members cascade';
  end if;
end $$;

drop function if exists public.is_conversation_member(uuid);
alter table public.activities drop column if exists host_id;

-- ============================================================
-- STORAGE BUCKETS AND POLICIES
-- Source: supabase/storage.sql
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'selfie-verifications',
  'selfie-verifications',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their own profile photos" on storage.objects;
drop policy if exists "Users update their own profile photos" on storage.objects;
drop policy if exists "Users delete their own profile photos" on storage.objects;
drop policy if exists "Public profile photos are readable" on storage.objects;
drop policy if exists "Users upload their own identity documents" on storage.objects;
drop policy if exists "Users view their own identity documents" on storage.objects;
drop policy if exists "Public avatar reads" on storage.objects;

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar" on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar" on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users upload own selfie" on storage.objects;
create policy "Users upload own selfie" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'selfie-verifications'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users and admins read selfie files" on storage.objects;
create policy "Users and admins read selfie files" on storage.objects
for select to authenticated
using (
  bucket_id = 'selfie-verifications'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin_user((select auth.uid()))
  )
);

drop policy if exists "Users delete own pending selfie files" on storage.objects;
create policy "Users delete own pending selfie files" on storage.objects
for delete to authenticated
using (
  bucket_id = 'selfie-verifications'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
