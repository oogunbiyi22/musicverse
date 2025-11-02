-- Add file_path column to messages for private storage flow
alter table if exists public.messages
  add column if not exists file_path text;