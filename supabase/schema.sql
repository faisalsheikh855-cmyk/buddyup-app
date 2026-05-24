create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age integer not null check (age >= 18),
  neighborhood text not null,
  bio text default '',
  interests text[] not null default '{}',
  availability text not null default 'Flexible',
  radius_km integer not null default 8 check (radius_km between 1 and 50),
  avatar text,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  location text not null,
  distance_km numeric(5,1) default 0,
  date_label text not null,
  starts_at text not null,
  spots integer not null check (spots > 0),
  pace text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_requests (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (activity_id, requester_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (conversation_id, profile_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.activity_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and profile_id = auth.uid()
  );
$$;

create or replace function public.accept_activity_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.activity_requests;
  v_conversation_id uuid;
begin
  select r.* into v_request
  from public.activity_requests r
  join public.activities a on a.id = r.activity_id
  where r.id = p_request_id and a.host_id = auth.uid();

  if v_request.id is null then
    raise exception 'Request not found or not owned by host';
  end if;

  update public.activity_requests set status = 'accepted' where id = p_request_id;
  insert into public.conversations (activity_id) values (v_request.activity_id) returning id into v_conversation_id;
  insert into public.conversation_members (conversation_id, profile_id)
  values (v_conversation_id, auth.uid()), (v_conversation_id, v_request.requester_id);
  return v_conversation_id;
end;
$$;

revoke all on function public.accept_activity_request(uuid) from public;
revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.accept_activity_request(uuid) to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;

create policy "Authenticated users can view profiles" on public.profiles for select to authenticated using (true);
create policy "Users manage their own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Authenticated users browse activities" on public.activities for select to authenticated using (true);
create policy "Hosts create activities" on public.activities for insert to authenticated with check (auth.uid() = host_id);
create policy "Hosts update activities" on public.activities for update to authenticated using (auth.uid() = host_id) with check (auth.uid() = host_id);

create policy "Participants view requests" on public.activity_requests for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = (select host_id from public.activities where id = activity_id));
create policy "Users request activities" on public.activity_requests for insert to authenticated with check (auth.uid() = requester_id);
create policy "Hosts answer requests" on public.activity_requests for update to authenticated
  using (auth.uid() = (select host_id from public.activities where id = activity_id));

create policy "Members view conversations" on public.conversations for select to authenticated
  using (public.is_conversation_member(id));
create policy "Hosts start conversations" on public.conversations for insert to authenticated
  with check (auth.uid() = (select host_id from public.activities where id = activity_id));
create policy "Members view conversation memberships" on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id));
create policy "Hosts add conversation members" on public.conversation_members for insert to authenticated
  with check (exists (select 1 from public.conversations c join public.activities a on a.id = c.activity_id where c.id = conversation_id and a.host_id = auth.uid()));
create policy "Members read messages" on public.messages for select to authenticated
  using (public.is_conversation_member(messages.conversation_id));
create policy "Members send messages" on public.messages for insert to authenticated
  with check (auth.uid() = sender_id and public.is_conversation_member(messages.conversation_id));

create index if not exists activities_created_at_idx on public.activities(created_at desc);
create index if not exists requests_activity_idx on public.activity_requests(activity_id);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);
