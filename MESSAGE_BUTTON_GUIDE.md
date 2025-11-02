# Message Button - Corrected Implementation

## Issues with Your Code

### ❌ Problem 1: Wrong Schema
```typescript
.or(`user1.eq.${currentUser.id},user2.eq.${profile.user_id}`)
.insert([{ user1: currentUser.id, user2: profile.user_id }])
```
**Issue:** Our schema uses `conversation_participants` table, not `user1`/`user2` fields.

### ❌ Problem 2: Missing Error Handling
No try/catch for database errors.

### ❌ Problem 3: Using `user_id` vs `id`
Profile uses `id` (which maps to `auth.users.id`), not `user_id`.

---

## ✅ Corrected Implementation

### Option 1: For Discover Page

**Update `/pages/discover.tsx`:**

Add this helper function inside the component:

```typescript
const startConversation = async (profileId: string) => {
  try {
    if (!currentUserId || profileId === currentUserId) return

    // Check if conversation already exists
    const { data: existingParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId)

    const currentUserConvos = existingParticipants?.map(p => p.conversation_id) || []

    let existingConvo = null
    if (currentUserConvos.length > 0) {
      const { data: convoWithBothUsers } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', profileId)
        .in('conversation_id', currentUserConvos)
        .limit(1)
        .single()

      existingConvo = convoWithBothUsers
    }

    let convoId: string

    if (existingConvo?.conversation_id) {
      // Use existing conversation
      convoId = existingConvo.conversation_id
    } else {
      // Create new conversation
      const { data: newConvo, error: createErr } = await supabase
        .from('conversations')
        .insert([{}])
        .select()
        .single()

      if (createErr) throw createErr
      convoId = newConvo.id

      // Add both participants
      const { error: addParticipantsErr } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: convoId, user_id: currentUserId },
          { conversation_id: convoId, user_id: profileId }
        ])

      if (addParticipantsErr) throw addParticipantsErr
    }

    router.push(`/chat/${convoId}`)
  } catch (error: any) {
    console.error('Error starting conversation:', error)
    setError(error.message || 'Failed to start conversation')
  }
}
```

Then update the button in the profile card:

```typescript
<button
  onClick={() => startConversation(profile.id)}
  className="mt-2 border px-3 py-1 rounded hover:bg-gray-100"
>
  Message
</button>
```

---

### Option 2: Reusable Hook

Create **`hooks/useConversation.ts`:**

```typescript
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/router'

export const useConversation = () => {
  const router = useRouter()

  const startConversation = async (userId: string, currentUserId: string) => {
    try {
      if (!currentUserId || userId === currentUserId) {
        throw new Error('Invalid user')
      }

      // Get all conversations for current user
      const { data: myConvos, error: myConvosErr } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId)

      if (myConvosErr) throw myConvosErr

      const myConvoIds = myConvos?.map(c => c.conversation_id) || []

      // Check if other user is in any of my conversations
      let sharedConvo = null
      if (myConvoIds.length > 0) {
        const { data, error: sharedErr } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId)
          .in('conversation_id', myConvoIds)
          .limit(1)
          .single()

        if (!sharedErr && data) {
          sharedConvo = data
        }
      }

      let convoId: string

      if (sharedConvo?.conversation_id) {
        // Use existing conversation
        convoId = sharedConvo.conversation_id
      } else {
        // Create new conversation
        const { data: newConvo, error: createErr } = await supabase
          .from('conversations')
          .insert([{}])
          .select()
          .single()

        if (createErr) throw createErr
        convoId = newConvo.id

        // Add participants
        const { error: participantsErr } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: convoId, user_id: currentUserId },
            { conversation_id: convoId, user_id: userId }
          ])

        if (participantsErr) throw participantsErr
      }

      router.push(`/chat/${convoId}`)
    } catch (error: any) {
      console.error('Failed to start conversation:', error)
      throw error
    }
  }

  return { startConversation }
}
```

---

### Option 3: Simple Inline (Minimal)

```typescript
<button
  onClick={async () => {
    try {
      // Check if conversation exists
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId)

      const existingConvoIds = existingParticipants?.map(p => p.conversation_id) || []

      let convoId: string

      if (existingConvoIds.length > 0) {
        const { data: shared } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', profile.id)
          .in('conversation_id', existingConvoIds)
          .limit(1)
          .single()

        if (shared?.conversation_id) {
          convoId = shared.conversation_id
        } else {
          throw new Error('Need to create new conversation')
        }
      } else {
        throw new Error('Need to create new conversation')
      }

      router.push(`/chat/${convoId}`)
    } catch {
      // Create new conversation
      const { data: convo } = await supabase
        .from('conversations')
        .insert([{}])
        .select()
        .single()

      const { error } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: convo.id, user_id: currentUserId },
          { conversation_id: convo.id, user_id: profile.id }
        ])

      if (!error) {
        router.push(`/chat/${convo.id}`)
      }
    }
  }}
  className="mt-2 border px-3 py-1 rounded hover:bg-gray-100"
>
  Message
</button>
```

---

## Database Schema Used

```
conversations
└── id (uuid, PK)
└── created_at
└── updated_at

conversation_participants
├── id (uuid, PK)
├── conversation_id (FK → conversations.id)
├── user_id (FK → auth.users.id)
└── created_at

messages
├── id (uuid, PK)
├── conversation_id (FK → conversations.id)
├── sender_id (FK → auth.users.id)
├── content (text)
└── created_at
```

---

## Integration Checklist

- ☐ Choose implementation option (Option 1, 2, or 3)
- ☐ Add to Discover page profile card
- ☐ Add to Profile view page
- ☐ Test creating conversation
- ☐ Test reopening existing conversation
- ☐ Test messaging flow

---

## What Each Option Does

| Option | Best For | Complexity |
|--------|----------|-----------|
| Option 1 | Quick integration | Low |
| Option 2 | Reusable across pages | Medium |
| Option 3 | Simplest | Low |

**Recommendation:** Use **Option 1** for discover page, **Option 2** if you need it in multiple places.

---

**Status:** Ready to implement
**Files to Update:** `/pages/discover.tsx` (and others if needed)
**Testing:** Create 2 accounts, find each other, click Message
