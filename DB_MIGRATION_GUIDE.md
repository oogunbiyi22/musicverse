# Database Migration Guide - Chat Tables

## 📋 Step-by-Step Instructions

### Step 1: Copy SQL Migration

The migration file is located at: `db/migrations/004_chat_tables.sql`

### Step 2: Run in Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (qtnuhdrhvrmgpljdhfmt)
3. Navigate to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy the entire contents of `004_chat_tables.sql` and paste into the editor
6. Click **"Run"** button (top-right, or Ctrl+Enter)

### Step 3: Verify Tables Created

After running successfully, verify in **Table Editor** (left sidebar):
- ✅ `conversations` table appears
- ✅ `conversation_participants` table appears
- ✅ `messages` table appears

### Step 4: Enable Realtime for Messages

**IMPORTANT:** This enables real-time message delivery

1. Go to **Database** (left sidebar)
2. Click **"Replication"** 
3. Under **Publication "supabase_realtime"**, find the **messages** table
4. Toggle it **ON** (switch to blue)
5. Verify under **"Enabled tables"** that messages appears

### Step 5: Update TypeScript Types

Edit `types_db.ts` and add these type definitions:

```typescript
export type Conversation = {
  id: string
  created_at: string
  updated_at: string
}

export type ConversationParticipant = {
  id: string
  conversation_id: string
  user_id: string
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {...},
      posts: {...},
      followers: {...},
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Conversation, 'id'>>
      },
      conversation_participants: {
        Row: ConversationParticipant
        Insert: Omit<ConversationParticipant, 'id' | 'created_at'>
        Update: Partial<Omit<ConversationParticipant, 'id' | 'created_at'>>
      },
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
    }
  }
}
```

### Step 6: Test the Migration

Create a test script or use Supabase's API testing tool:

```typescript
// Test creating a conversation
const { data: conv, error: convErr } = await supabase
  .from('conversations')
  .insert({})
  .select()
  .single()

if (convErr) console.error('Error creating conversation:', convErr)
else console.log('✅ Conversation created:', conv.id)
```

## 🔄 Rollback (if needed)

If you need to undo this migration, run:

```sql
drop table if exists messages;
drop table if exists conversation_participants;
drop table if exists conversations;
```

## ✅ Verification Checklist

After completion:

- [ ] SQL migration ran successfully (no errors)
- [ ] `conversations` table visible in Table Editor
- [ ] `conversation_participants` table visible in Table Editor
- [ ] `messages` table visible in Table Editor
- [ ] RLS is enabled on all tables (check "Auth" tab in each table)
- [ ] Realtime enabled for messages table in Replication settings
- [ ] TypeScript types updated in types_db.ts
- [ ] `npm run build` passes without errors

## 📊 What Was Created

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `conversations` | Chat rooms | id, created_at, updated_at |
| `conversation_participants` | User membership | id, conversation_id, user_id |
| `messages` | Chat messages | id, conversation_id, sender_id, content, created_at |

### Security (RLS Policies)

✅ **conversations**: Users can only see conversations they're part of
✅ **conversation_participants**: Users can see participants in their conversations
✅ **messages**: Users can only read/write messages in conversations they joined

## 🚀 Next Steps After Migration

1. **Update discover.tsx** with full startConversation logic (currently simplified)
2. **Create /pages/chat/[id].tsx** for chat room UI
3. **Create /pages/messages.tsx** for conversation list
4. **Add Messages link to Navigation.tsx**
5. **Test end-to-end**: Follow a user → Message them → See conversation

## ⚠️ Common Issues

**"RLS policy requires authentication"**
- Make sure you're logged in when testing
- Test as authenticated user, not anonymous

**"Messages not appearing in real-time"**
- Verify replication is enabled for messages table
- Check browser console for WebSocket errors
- Restart dev server: `npm run dev`

**"Type errors after migration"**
- Run `npm run build` to regenerate types
- Clear node_modules: `rm -rf node_modules && npm install`

## 📞 Need Help?

- Check Supabase logs: Dashboard > Logs
- Verify RLS policies: Database > [table] > Auth Policies
- Test API directly in SQL Editor with sample queries
