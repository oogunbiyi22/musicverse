-- Create wave_comments table for timestamped audio comments
create table if not exists public.wave_comments (
  id uuid primary key default gen_random_uuid(),
  file_url text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text,
  comment text not null,
  timestamp integer not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.wave_comments enable row level security;

-- Policies
-- Read: allow anyone to read comments (adjust if you prefer auth-only)
create policy if not exists wave_comments_select_public
on public.wave_comments for select
to public
using (true);

-- Insert: only authenticated users can add comments, and must match user_id
create policy if not exists wave_comments_insert_auth
on public.wave_comments for insert
to authenticated
with check (auth.uid() = user_id);

-- Optional index to speed up lookups by file
create index if not exists idx_wave_comments_file_url
on public.wave_comments(file_url);
