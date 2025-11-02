-- Create followers table for social follow feature
create table if not exists public.followers (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  unique(follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

-- Enable RLS
alter table public.followers enable row level security;

-- Anyone can read followers (for public counts/lists)
create policy "Public read followers"
on public.followers
for select
to anon, authenticated
using (true);

-- Users can follow others (insert their own follower_id)
create policy "Users can follow"
on public.followers
for insert
to authenticated
with check (auth.uid() = follower_id);

-- Users can unfollow (delete their own follows)
create policy "Users can unfollow"
on public.followers
for delete
to authenticated
using (auth.uid() = follower_id);

-- Index for performance
create index if not exists followers_follower_id_idx on public.followers(follower_id);
create index if not exists followers_following_id_idx on public.followers(following_id);
