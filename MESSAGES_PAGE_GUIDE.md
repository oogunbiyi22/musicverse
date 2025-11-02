# Messages Page - Implementation Guide

## Issues in Your Code

### ❌ Problem 1: Wrong Import
```typescript
import { supabase } from '@/lib/supabaseClient'  // ❌ Doesn't exist
```
**Fix:**
```typescript
import { supabase } from '@/utils/supabase'  // ✅ Correct
```

### ❌ Problem 2: App Router Directive
```typescript
'use client'  // ❌ Not needed for Pages Router
```
**Fix:** Remove it for Pages Router

### ❌ Problem 3: Router Import Missing
```typescript
// ❌ Missing useRouter
```
**Fix:**
```typescript
import { useRouter } from 'next/router'
```

### ❌ Problem 4: Wrong Query Logic
```typescript
.or(`user1.eq.${user.id},user2.eq.${user.id}`)  // ❌ Wrong schema
```
**Fix:** Based on our chat schema, should query conversation_participants:
```typescript
// Should check conversation_participants table
```

### ❌ Problem 5: Missing Navigation
No Navigation component included.

---

## Corrected Implementation

### Option 1: Simple Messages Page (Quick)

**`pages/messages.tsx`**
```typescript
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import Navigation from '../components/Navigation'

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        // Get conversations where user is a participant
        const { data, error: err } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            conversations (
              id,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (err) throw err

        // Extract conversations and get last message for each
        const convoIds = data?.map(d => d.conversation_id) || []
        
        if (convoIds.length > 0) {
          const { data: messages } = await supabase
            .from('messages')
            .select('id, conversation_id, content, created_at, sender_id, profiles(username)')
            .in('conversation_id', convoIds)
            .order('created_at', { ascending: false })

          // Group by conversation to get latest message
          const lastMessages: Record<string, any> = {}
          messages?.forEach(msg => {
            if (!lastMessages[msg.conversation_id]) {
              lastMessages[msg.conversation_id] = msg
            }
          })

          // Combine conversations with last messages
          const convosWithMessages = data?.map(d => ({
            id: d.conversations.id,
            created_at: d.conversations.created_at,
            updated_at: d.conversations.updated_at,
            lastMessage: lastMessages[d.conversation_id]
          })) || []

          setConversations(convosWithMessages)
        }

        setLoading(false)
      } catch (err: any) {
        console.error('Error loading conversations:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    load()
  }, [router])

  if (loading) return (
    <>
      <Navigation />
      <main className="p-6">Loading messages...</main>
    </>
  )

  if (error) return (
    <>
      <Navigation />
      <main className="p-6 text-red-600">Error: {error}</main>
    </>
  )

  return (
    <>
      <Navigation />
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No messages yet</p>
            <Link
              href="/discover"
              className="text-blue-600 underline"
            >
              Go to Discover to find creators
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((convo) => (
              <Link
                key={convo.id}
                href={`/chat/${convo.id}`}
                className="block border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold">
                      {convo.lastMessage?.profiles?.username || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {convo.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">
                    {convo.lastMessage && 
                      new Date(convo.lastMessage.created_at).toLocaleDateString()
                    }
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
```

---

## Integration Steps

### 1. Add Link to Navigation

**Update `components/Navigation.tsx`:**
```typescript
<Link href="/messages" style={{ textDecoration: 'none', color: router.pathname === '/messages' ? '#000' : '#6b7280' }}>
  Messages
</Link>
```

### 2. Create Database Tables (in Supabase)

If you haven't already, run this SQL:

```sql
-- Conversations table
create table conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Participants table
create table conversation_participants (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp default now(),
  unique(conversation_id, user_id)
);

-- Messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp default now()
);

-- Enable RLS
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

-- RLS Policies
create policy "Users can read messages from their conversations"
  on messages for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
      and conversation_participants.user_id = auth.uid()
    )
  );

create policy "Users can insert messages to their conversations"
  on messages for insert
  with check (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
      and conversation_participants.user_id = auth.uid()
    )
  );

create policy "Users can read their conversations"
  on conversations for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_participants.conversation_id = conversations.id
      and conversation_participants.user_id = auth.uid()
    )
  );
```

### 3. Enable Realtime (in Supabase)

1. Go to Supabase Dashboard
2. Click **Database** → **Replication**
3. Enable replication for: `messages` table

### 4. Create Chat Page

Use the component from `CHAT_FEATURE_GUIDE.md` for `/pages/chat/[id].tsx`

### 5. Add "Message" Button to Profiles

In `/pages/profile.tsx` or `/pages/discover.tsx`:
```typescript
<Link href={`/chat/${profileId}`}>
  <button className="bg-blue-600 text-white px-4 py-2 rounded">
    Message
  </button>
</Link>
```

---

## Implementation Checklist

- ☐ Create Messages page (`pages/messages.tsx`)
- ☐ Create database tables (SQL above)
- ☐ Enable RLS policies
- ☐ Enable Realtime for messages table
- ☐ Create Chat page (`pages/chat/[id].tsx`)
- ☐ Add Messages link to Navigation
- ☐ Add "Message" buttons to profiles
- ☐ Test end-to-end messaging

---

## File Structure

```
pages/
├── messages.tsx          (← NEW: List conversations)
├── chat/
│   └── [id].tsx         (← NEW: Chat room)
├── profile.tsx
├── discover.tsx
└── ...

components/
└── Navigation.tsx       (← UPDATE: Add messages link)
```

---

## Testing Flow

1. **Create 2 test accounts**
2. **Login as User A**
3. **Go to /discover, click Follow on User B's profile**
4. **Go to /messages** (should be empty)
5. **Click "Message" on User B's profile** (creates conversation)
6. **Type a message and send**
7. **Open second browser/private window**
8. **Login as User B**
9. **Go to /messages**
10. **Should see conversation with User A**
11. **Click to open chat**
12. **See User A's message in real-time!**

---

**Status:** Ready to implement
**Estimated Time:** 20 minutes
**Difficulty:** Medium
