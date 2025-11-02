-- Collaborative playback sessions table
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  file_url text not null,
  is_playing boolean not null default false,
  current_time integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

-- Read: allow public reads (adjust to 'authenticated' if needed)
create policy if not exists sessions_select_public
on public.sessions for select
to public
using (true);

-- Insert: authenticated only
create policy if not exists sessions_insert_auth
on public.sessions for insert
to authenticated
with check (true);

-- Update: authenticated only
create policy if not exists sessions_update_auth
on public.sessions for update
to authenticated
using (true)
with check (true);

-- Helpful index for realtime updates
create index if not exists idx_sessions_updated_at on public.sessions(updated_at);
