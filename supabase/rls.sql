alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.activity_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.selfie_verifications enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.safety_checkins enable row level security;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Users manage their own profile" on public.profiles;
drop policy if exists "Users create their own unverified profile" on public.profiles;
drop policy if exists "Users update their own profile" on public.profiles;
drop policy if exists "Profiles visible unless blocked" on public.profiles;
create policy "Profiles visible unless blocked" on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.is_admin_user(auth.uid())
  or (
    not is_blocked
    and not public.users_are_blocked(auth.uid(), id)
  )
);

revoke select on public.profiles from authenticated;
grant select (
  id, full_name, username, city, bio, avatar_url,
  email_verified, phone_verified, selfie_verified, verification_status,
  interests, trust_score, created_at, updated_at
) on public.profiles to authenticated;

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

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
  created_by = auth.uid()
  or public.is_admin_user(auth.uid())
  or (
    visibility = 'public'
    and status in ('open', 'full', 'completed')
    and not public.users_are_blocked(auth.uid(), created_by)
  )
);

drop policy if exists "Verified users create activities" on public.activities;
create policy "Verified users create activities" on public.activities
for insert to authenticated
with check (created_by = auth.uid() and public.is_verified_user(auth.uid()));

drop policy if exists "Creators update activities" on public.activities;
create policy "Creators update activities" on public.activities
for update to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Creators delete activities" on public.activities;
create policy "Creators delete activities" on public.activities
for delete to authenticated
using (created_by = auth.uid());

drop policy if exists "Request participants read requests" on public.activity_requests;
drop policy if exists "Participants view requests" on public.activity_requests;
drop policy if exists "Users request activities" on public.activity_requests;
drop policy if exists "Hosts answer requests" on public.activity_requests;
create policy "Request participants read requests" on public.activity_requests
for select to authenticated
using (requester_id = auth.uid() or host_id = auth.uid() or public.is_admin_user(auth.uid()));

drop policy if exists "Verified users create requests" on public.activity_requests;
create policy "Verified users create requests" on public.activity_requests
for insert to authenticated
with check (
  requester_id = auth.uid()
  and host_id <> auth.uid()
  and public.is_verified_user(auth.uid())
  and host_id = (select created_by from public.activities where id = activity_id and status = 'open')
  and not public.users_are_blocked(auth.uid(), host_id)
);

drop policy if exists "Participants update request status" on public.activity_requests;
create policy "Participants update request status" on public.activity_requests
for update to authenticated
using (host_id = auth.uid() or requester_id = auth.uid())
with check (
  (host_id = auth.uid() and status in ('accepted', 'declined'))
  or (requester_id = auth.uid() and status = 'cancelled')
);

drop policy if exists "Conversation members read conversations" on public.conversations;
drop policy if exists "Members view conversations" on public.conversations;
drop policy if exists "Hosts start conversations" on public.conversations;
create policy "Conversation members read conversations" on public.conversations
for select to authenticated
using (
  host_id = auth.uid()
  or participant_id = auth.uid()
  or public.is_admin_user(auth.uid())
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
      and (c.host_id = auth.uid() or c.participant_id = auth.uid())
  )
);

drop policy if exists "Verified conversation members send messages" on public.messages;
create policy "Verified conversation members send messages" on public.messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and public.is_verified_user(auth.uid())
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.host_id = auth.uid() or c.participant_id = auth.uid())
      and not public.users_are_blocked(c.host_id, c.participant_id)
  )
);

drop policy if exists "Users create selfie verification" on public.selfie_verifications;
create policy "Users create selfie verification" on public.selfie_verifications
for insert to authenticated
with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "Users and admins read selfie verification" on public.selfie_verifications;
create policy "Users and admins read selfie verification" on public.selfie_verifications
for select to authenticated
using (user_id = auth.uid() or public.is_admin_user(auth.uid()));

drop policy if exists "Verified users create reports" on public.reports;
create policy "Verified users create reports" on public.reports
for insert to authenticated
with check (
  reporter_id = auth.uid()
  and reporter_id <> reported_user_id
  and public.is_verified_user(auth.uid())
);

drop policy if exists "Reporters and admins read reports" on public.reports;
create policy "Reporters and admins read reports" on public.reports
for select to authenticated
using (reporter_id = auth.uid() or public.is_admin_user(auth.uid()));

drop policy if exists "Admins update reports" on public.reports;
create policy "Admins update reports" on public.reports
for update to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));

drop policy if exists "Users read own blocks" on public.blocks;
create policy "Users read own blocks" on public.blocks
for select to authenticated
using (blocker_id = auth.uid());

drop policy if exists "Users create own blocks" on public.blocks;
create policy "Users create own blocks" on public.blocks
for insert to authenticated
with check (blocker_id = auth.uid() and blocked_user_id <> auth.uid());

drop policy if exists "Users delete own blocks" on public.blocks;
create policy "Users delete own blocks" on public.blocks
for delete to authenticated
using (blocker_id = auth.uid());

drop policy if exists "Activity members read checkins" on public.safety_checkins;
create policy "Activity members read checkins" on public.safety_checkins
for select to authenticated
using (
  user_id = auth.uid()
  or (public.is_admin_user(auth.uid()) and status = 'issue_reported')
  or exists (
    select 1 from public.activities a
    where a.id = activity_id and a.created_by = auth.uid()
  )
);

drop policy if exists "Activity members create checkins" on public.safety_checkins;
create policy "Activity members create checkins" on public.safety_checkins
for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    exists (select 1 from public.activities a where a.id = activity_id and a.created_by = auth.uid())
    or exists (
      select 1 from public.activity_requests r
      where r.activity_id = safety_checkins.activity_id
        and r.requester_id = auth.uid()
        and r.status = 'accepted'
    )
  )
);

drop policy if exists "Users update own checkins" on public.safety_checkins;
create policy "Users update own checkins" on public.safety_checkins
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
