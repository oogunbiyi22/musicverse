# 🔐 Google OAuth - Quick Setup Checklist

## The Error You're Getting
```
"Unsupported provider: provider is not enabled"
```
**Cause:** Google OAuth provider not configured in Supabase

## ✅ Quick Setup (5 Steps)

### Step 1: Enable Google in Supabase ⭐
1. Go to: https://app.supabase.com/project/_/auth/providers
2. Find **Google**
3. Toggle **Enable** → ON
4. (Don't worry about Client ID yet, we'll get that from Google)

### Step 2: Get Google Credentials
1. Go to: https://console.cloud.google.com/
2. Create new project called "Musicverse"
3. Go to **APIs & Services** → **Library**
4. Search and enable: **Google+ API**

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Choose **Web application**
4. Add Authorized Redirect URI:
   ```
   https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback
   ```
   (Find YOUR_PROJECT_ID in Supabase Project Settings)
5. Click **CREATE**
6. Copy **Client ID** and **Client Secret**

### Step 4: Paste into Supabase
1. Go back to: https://app.supabase.com/project/_/auth/providers
2. Click **Google** provider
3. Paste:
   - **Client ID:** [from Google Cloud]
   - **Client Secret:** [from Google Cloud]
4. Click **SAVE**

### Step 5: Test It!
1. Hard refresh: http://localhost:3000/login (Cmd+Shift+R)
2. Click **Continue with Google**
3. Should work now! 🎉

## 📝 Finding Your Supabase Project ID

In Supabase Dashboard:
1. Click your project name (top-left)
2. Go to **Project Settings** (gear icon)
3. Look for **Project ID** under **General**
4. Copy it (looks like: `xxxxxxxxxxxxxxxxxxx`)

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Still getting "Unsupported provider" error | Wait 1-2 min after clicking SAVE in Supabase, then refresh |
| "Redirect URI mismatch" error | Make sure redirect URI exactly matches what Supabase shows |
| Google login doesn't redirect | Check that redirectTo URL is correct |
| Can't create Google OAuth credentials | Make sure Google+ API is enabled first |

## ✨ After Setup

You can:
- ✅ Login with email/password
- ✅ Sign up with email/password  
- ✅ Login with Google (after setup)
- ✅ Auto-confirmed accounts (no email verification needed)

## Links You'll Need

| Service | Link |
|---------|------|
| Supabase Auth | https://app.supabase.com/project/_/auth/providers |
| Google Cloud Console | https://console.cloud.google.com |
| Google+ API | https://console.cloud.google.com/apis/library/plus.googleapis.com |
| OAuth Credentials | https://console.cloud.google.com/apis/credentials |

---

**Time to complete:** ~10 minutes  
**Difficulty:** Easy  
**Result:** Full OAuth login working ✓
