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

create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  storage_path text not null,
  position integer not null default 0 check (position between 0 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, storage_path),
  unique (user_id, position)
);

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
  joined_count integer not null default 1,
  skill_level text not null default 'All levels',
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
alter table public.activities add column if not exists joined_count integer not null default 1;
alter table public.activities add column if not exists skill_level text not null default 'All levels';
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
alter table public.activities drop constraint if exists activities_joined_count_check;
alter table public.activities add constraint activities_joined_count_check
  check (joined_count between 1 and max_people);

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

update public.activities a
set joined_count = least(
  a.max_people,
  1 + (
    select count(*)::integer
    from public.activity_requests r
    where r.activity_id = a.id and r.status = 'accepted'
  )
);

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
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages add constraint messages_body_check
  check (char_length(btrim(body)) between 1 and 2000);

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

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  activity_id uuid references public.activities(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (
    type in (
      'join_request', 'request_accepted', 'request_declined',
      'message', 'activity_updated', 'activity_cancelled', 'safety'
    )
  )
);

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

create or replace function public.invalidate_verification_on_avatar_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.avatar_url is distinct from new.avatar_url and old.selfie_verified then
    new.selfie_verified = false;
    new.verification_status = 'unverified';
    new.verification_rejection_reason = null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_calculate_verification_status on public.profiles;
drop trigger if exists profiles_invalidate_avatar_verification on public.profiles;
create trigger profiles_invalidate_avatar_verification
before update of avatar_url on public.profiles
for each row execute function public.invalidate_verification_on_avatar_change();
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
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid() and email_verified and avatar_url is not null
  ) then
    raise exception 'Verify your email and upload a profile photo before submitting a selfie';
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
  if decision = 'approved' and not exists (
    select 1
    from public.profiles
    where id = target_user and email_verified and avatar_url is not null
  ) then
    raise exception 'The member must verify email and upload a profile photo first';
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
  if (
    select joined_count >= max_people or status <> 'open'
    from public.activities
    where id = request_row.activity_id
    for update
  ) then
    raise exception 'This activity is already full or closed';
  end if;

  update public.activity_requests set status = 'accepted' where id = request_id;
  update public.activities
  set joined_count = joined_count + 1,
      status = case when joined_count + 1 >= max_people then 'full' else status end
  where id = request_row.activity_id;
  insert into public.conversations (activity_id, host_id, participant_id)
  values (request_row.activity_id, request_row.host_id, request_row.requester_id)
  on conflict (activity_id, host_id, participant_id)
  do update set activity_id = excluded.activity_id
  returning id into conversation_id;
  return conversation_id;
end;
$$;

create or replace function public.delete_current_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

create or replace function public.notify_activity_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_name text;
  activity_title text;
begin
  select full_name into requester_name from public.profiles where id = new.requester_id;
  select title into activity_title from public.activities where id = new.activity_id;
  insert into public.notifications (
    user_id, actor_id, activity_id, type, title, body
  ) values (
    new.host_id,
    new.requester_id,
    new.activity_id,
    'join_request',
    'New join request',
    coalesce(requester_name, 'A BuddyUp member') || ' wants to join ' ||
      coalesce(activity_title, 'your activity') || '.'
  );
  return new;
end;
$$;

drop trigger if exists activity_request_notification on public.activity_requests;
create trigger activity_request_notification
after insert on public.activity_requests
for each row execute function public.notify_activity_request();

create or replace function public.notify_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  activity_title text;
begin
  if old.status = new.status or new.status not in ('accepted', 'declined') then
    return new;
  end if;
  select title into activity_title from public.activities where id = new.activity_id;
  insert into public.notifications (
    user_id, actor_id, activity_id, type, title, body
  ) values (
    new.requester_id,
    new.host_id,
    new.activity_id,
    case when new.status = 'accepted' then 'request_accepted' else 'request_declined' end,
    case when new.status = 'accepted' then 'Request accepted' else 'Request update' end,
    case
      when new.status = 'accepted' then
        'You can now chat about ' || coalesce(activity_title, 'the activity') || '.'
      else
        'Your request for ' || coalesce(activity_title, 'the activity') || ' was declined.'
    end
  );
  return new;
end;
$$;

drop trigger if exists activity_request_status_notification on public.activity_requests;
create trigger activity_request_status_notification
after update of status on public.activity_requests
for each row execute function public.notify_request_status();

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_row public.conversations;
  recipient_id uuid;
  sender_name text;
begin
  select * into conversation_row from public.conversations where id = new.conversation_id;
  recipient_id = case
    when new.sender_id = conversation_row.host_id then conversation_row.participant_id
    else conversation_row.host_id
  end;
  select full_name into sender_name from public.profiles where id = new.sender_id;
  insert into public.notifications (
    user_id, actor_id, activity_id, conversation_id, type, title, body
  ) values (
    recipient_id,
    new.sender_id,
    conversation_row.activity_id,
    new.conversation_id,
    'message',
    coalesce(sender_name, 'BuddyUp member'),
    left(new.body, 140)
  );
  return new;
end;
$$;

drop trigger if exists message_notification on public.messages;
create trigger message_notification
after insert on public.messages
for each row execute function public.notify_new_message();

create or replace function public.notify_activity_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = new.status or new.status <> 'cancelled' then
    return new;
  end if;
  insert into public.notifications (
    user_id, actor_id, activity_id, type, title, body
  )
  select
    r.requester_id,
    new.created_by,
    new.id,
    'activity_cancelled',
    'Activity cancelled',
    new.title || ' has been cancelled by the host.'
  from public.activity_requests r
  where r.activity_id = new.id and r.status in ('pending', 'accepted');

  update public.activity_requests
  set status = 'cancelled'
  where activity_id = new.id and status = 'pending';
  return new;
end;
$$;

drop trigger if exists activity_cancelled_notification on public.activities;
create trigger activity_cancelled_notification
after update of status on public.activities
for each row execute function public.notify_activity_cancelled();

create or replace function public.notify_activity_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' then
    return new;
  end if;
  insert into public.notifications (
    user_id, actor_id, activity_id, type, title, body
  )
  select
    r.requester_id,
    new.created_by,
    new.id,
    'activity_updated',
    'Activity details updated',
    new.title || ' has updated time, place, or plan details.'
  from public.activity_requests r
  where r.activity_id = new.id and r.status = 'accepted';
  return new;
end;
$$;

drop trigger if exists activity_updated_notification on public.activities;
create trigger activity_updated_notification
after update of title, description, location_name, activity_date, activity_time, max_people
on public.activities
for each row execute function public.notify_activity_updated();

drop function if exists public.calculate_profile_verification_status();
drop function if exists public.submit_identity_verification(text, text, text, text);

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.invalidate_verification_on_avatar_change() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin_user(uuid) from public, anon, authenticated;
revoke all on function public.users_are_blocked(uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_verified_user(uuid) from public, anon, authenticated;
revoke all on function public.sync_current_email_verification() from public, anon, authenticated;
revoke all on function public.get_current_profile() from public, anon, authenticated;
revoke all on function public.submit_selfie_verification(text) from public, anon, authenticated;
revoke all on function public.review_selfie_verification(uuid, text, text) from public, anon, authenticated;
revoke all on function public.accept_activity_request(uuid) from public, anon, authenticated;
revoke all on function public.delete_current_account() from public, anon, authenticated;
revoke all on function public.notify_activity_request() from public, anon, authenticated;
revoke all on function public.notify_request_status() from public, anon, authenticated;
revoke all on function public.notify_new_message() from public, anon, authenticated;
revoke all on function public.notify_activity_cancelled() from public, anon, authenticated;
revoke all on function public.notify_activity_updated() from public, anon, authenticated;
grant execute on function public.is_admin_user(uuid) to authenticated;
grant execute on function public.users_are_blocked(uuid, uuid) to authenticated;
grant execute on function public.is_verified_user(uuid) to authenticated;
grant execute on function public.sync_current_email_verification() to authenticated;
grant execute on function public.get_current_profile() to authenticated;
grant execute on function public.submit_selfie_verification(text) to authenticated;
grant execute on function public.review_selfie_verification(uuid, text, text) to authenticated;
grant execute on function public.accept_activity_request(uuid) to authenticated;
grant execute on function public.delete_current_account() to authenticated;

create index if not exists activities_feed_idx on public.activities(status, visibility, activity_date, activity_time);
create index if not exists activities_creator_idx on public.activities(created_by);
create index if not exists profile_photos_user_idx on public.profile_photos(user_id, position);
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
create index if not exists notifications_user_idx on public.notifications(user_id, read_at, created_at desc);

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

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
