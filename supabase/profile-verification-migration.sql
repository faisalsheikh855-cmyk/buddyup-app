alter table public.profiles add column if not exists photo_urls text[] not null default '{}';
alter table public.profiles add column if not exists verification_status text not null default 'not_started';
alter table public.profiles add column if not exists verification_submitted_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_verification_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_verification_status_check
      check (verification_status in ('not_started', 'pending', 'verified', 'rejected'));
  end if;
end
$$;

create table if not exists public.identity_verification_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('drivers_license', 'passport', 'national_id')),
  document_front_path text not null,
  document_back_path text,
  selfie_path text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.identity_verification_submissions enable row level security;

drop policy if exists "Users manage their own profile" on public.profiles;
drop policy if exists "Users create their own unverified profile" on public.profiles;
drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users create their own unverified profile" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id and verification_status = 'not_started');
create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users view their own verification submissions" on public.identity_verification_submissions;
drop policy if exists "Users create their own verification submissions" on public.identity_verification_submissions;
create policy "Users view their own verification submissions" on public.identity_verification_submissions
  for select to authenticated using (auth.uid() = profile_id);
create policy "Users create their own verification submissions" on public.identity_verification_submissions
  for insert to authenticated with check (auth.uid() = profile_id and status = 'pending');

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
  set verification_status = 'pending', verification_submitted_at = now()
  where id = auth.uid();

  return v_submission_id;
end;
$$;

revoke all on function public.submit_identity_verification(text, text, text, text) from public;
grant execute on function public.submit_identity_verification(text, text, text, text) to authenticated;

create index if not exists verification_profile_idx
  on public.identity_verification_submissions(profile_id, created_at desc);

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users upload their own profile photos" on storage.objects;
drop policy if exists "Users update their own profile photos" on storage.objects;
drop policy if exists "Users delete their own profile photos" on storage.objects;
drop policy if exists "Public profile photos are readable" on storage.objects;
drop policy if exists "Users upload their own identity documents" on storage.objects;
drop policy if exists "Users view their own identity documents" on storage.objects;

create policy "Users upload their own profile photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update their own profile photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete their own profile photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Public profile photos are readable" on storage.objects
  for select using (bucket_id = 'profile-photos');
create policy "Users upload their own identity documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users view their own identity documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = auth.uid()::text);

revoke update on public.profiles from authenticated;
grant update (name, age, neighborhood, bio, interests, availability, radius_km, avatar, photo_urls)
  on public.profiles to authenticated;
