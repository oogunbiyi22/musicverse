-- RLS policies for profiles and posts tables matching the app behavior
-- Profiles: public read; users can insert/update their own profile
-- Posts: public read; owners can insert/update/delete their posts

-- Enable RLS
alter table if exists public.profiles enable row level security;
alter table if exists public.posts enable row level security;

-- Drop existing policies (safe re-apply)
-- Profiles
drop policy if exists "Public read profiles" on public.profiles;
drop policy if exists "User can insert own profile" on public.profiles;
drop policy if exists "User can update own profile" on public.profiles;

-- Posts
drop policy if exists "Public read posts" on public.posts;
drop policy if exists "Insert own posts" on public.posts;
drop policy if exists "Update own posts" on public.posts;
drop policy if exists "Delete own posts" on public.posts;

-- Create policies
-- PROFILES
create policy "Public read profiles"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "User can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "User can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- POSTS
create policy "Public read posts"
on public.posts
for select
to anon, authenticated
using (true);

create policy "Insert own posts"
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Update own posts"
on public.posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Delete own posts"
on public.posts
for delete
to authenticated
using (auth.uid() = user_id);
