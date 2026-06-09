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
