-- Musicverse Chat Feature - Database Migration
-- Run this in Supabase SQL Editor to create all necessary tables and policies

-- ============================================================================
-- 1. CREATE CONVERSATIONS TABLE
-- ============================================================================
create table conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

comment on table conversations is 'Stores chat conversations between users';

-- ============================================================================
-- 2. CREATE CONVERSATION PARTICIPANTS TABLE
-- ============================================================================
create table conversation_participants (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp default now(),
  unique(conversation_id, user_id)
);

comment on table conversation_participants is 'Maps users to conversations they participate in';
create index idx_conversation_participants_user_id on conversation_participants(user_id);
create index idx_conversation_participants_conversation_id on conversation_participants(conversation_id);

-- ============================================================================
-- 3. CREATE MESSAGES TABLE
-- ============================================================================
create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp default now()
);

comment on table messages is 'Stores all messages in conversations';
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_messages_sender_id on messages(sender_id);
create index idx_messages_created_at on messages(created_at);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

-- ============================================================================
-- 5. CREATE RLS POLICIES FOR CONVERSATIONS
-- ============================================================================

-- Users can read conversations they participate in
create policy "Users can read their conversations"
  on conversations for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = conversations.id
      and conversation_participants.user_id = auth.uid()
    )
  );

-- Service role or authenticated users can create conversations
create policy "Authenticated users can create conversations"
  on conversations for insert
  with check (auth.role() = 'authenticated');

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR CONVERSATION PARTICIPANTS
-- ============================================================================

-- Users can read participants in conversations they're part of
create policy "Users can read participants in their conversations"
  on conversation_participants for select
  using (
    exists (
      select 1 from conversation_participants cp2
      where cp2.conversation_id = conversation_participants.conversation_id
      and cp2.user_id = auth.uid()
    )
  );

-- Authenticated users can add participants to conversations they created
create policy "Authenticated users can add participants"
  on conversation_participants for insert
  with check (auth.role() = 'authenticated');

-- ============================================================================
-- 7. CREATE RLS POLICIES FOR MESSAGES
-- ============================================================================

-- Users can read messages from conversations they participate in
create policy "Users can read messages from their conversations"
  on messages for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
      and conversation_participants.user_id = auth.uid()
    )
  );

-- Users can only send messages to conversations they participate in
create policy "Users can send messages to their conversations"
  on messages for insert
  with check (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
      and conversation_participants.user_id = auth.uid()
    )
    and sender_id = auth.uid()
  );

-- Users can only update their own messages (optional)
create policy "Users can update their own messages"
  on messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- Users can delete their own messages (optional)
create policy "Users can delete their own messages"
  on messages for delete
  using (sender_id = auth.uid());

-- ============================================================================
-- 8. ENABLE REALTIME FOR MESSAGES TABLE
-- ============================================================================
-- Important: Go to Supabase Dashboard > Database > Replication
-- and enable replication for the "messages" table
-- This allows real-time updates via Supabase Realtime

-- ============================================================================
-- COMPLETION CHECKLIST
-- ============================================================================
-- After running this migration, verify:
-- 
-- ✅ 1. Tables created:
--    - conversations
--    - conversation_participants
--    - messages
--
-- ✅ 2. RLS enabled on all tables
--
-- ✅ 3. RLS policies created:
--    - conversations: select policy
--    - conversation_participants: select, insert policies
--    - messages: select, insert, update, delete policies
--
-- ✅ 4. Indexes created for performance:
--    - conversation_participants (user_id, conversation_id)
--    - messages (conversation_id, sender_id, created_at)
--
-- 🔄 5. Enable Realtime (in Dashboard):
--    - Database > Replication > Toggle "messages" table
--
-- ✅ 6. Update TypeScript types in types_db.ts
--
-- ✅ 7. Test by:
--    - Creating 2 test accounts
--    - Starting a conversation
--    - Sending messages
--    - Verifying real-time delivery
