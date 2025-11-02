-- Session membership & roles for voice permissions
create table if not exists public.session_members (
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','moderator','speaker','listener')) default 'listener',
  can_speak boolean not null default false,
  inserted_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table public.session_members enable row level security;

-- Read: allow authenticated users to read membership (adjust if you need stricter privacy)
create policy if not exists "members read"
  on public.session_members for select
  to authenticated using (true);

-- Join: users can add themselves as listener
create policy if not exists "self join as listener"
  on public.session_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'listener'
    and can_speak = false
  );

-- Leave: users can delete their own membership
create policy if not exists "self leave"
  on public.session_members for delete
  to authenticated
  using (user_id = auth.uid());

-- Manage: owners or moderators can update roles/can_speak for a session
create policy if not exists "owners or moderators manage"
  on public.session_members for update
  to authenticated
  using (
    exists (
      select 1 from public.sessions s
      left join public.session_members sm on sm.session_id = s.id and sm.user_id = auth.uid()
      where s.id = session_id
        and (s.created_by = auth.uid() or sm.role in ('owner','moderator'))
    )
  )
  with check (
    exists (
      select 1 from public.sessions s
      left join public.session_members sm on sm.session_id = s.id and sm.user_id = auth.uid()
      where s.id = session_id
        and (s.created_by = auth.uid() or sm.role in ('owner','moderator'))
    )
  );
