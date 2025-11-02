-- Auto-create a profile row when a new user signs up
-- Adjusted to match schema where profiles.id references auth.users.id
-- Safe for repeated runs via create or replace and ON CONFLICT DO NOTHING

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop existing trigger if present to allow re-creation
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger to call that function after a new user is inserted
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
