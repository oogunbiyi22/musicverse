-- Add creator and open-voice flag to sessions
alter table if exists public.sessions
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists voice_open boolean not null default false;

-- Optional index for quick lookups by creator
create index if not exists sessions_created_by_idx on public.sessions(created_by);
