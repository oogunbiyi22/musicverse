# ✅ Google OAuth Configuration Checklist

## Your Configuration Details

### Supabase Project
- **Project ID:** `qtnuhdrhvrmgpljdhfmt`
- **URL:** `https://qtnuhdrhvrmgpljdhfmt.supabase.co`
- **Status:** ✅ Configured in .env.local

### App Configuration
- **Login Page:** `/pages/login.tsx` ✅
- **OAuth Handler:** ✅ Configured
- **Redirect URL:** `http://localhost:3000/profile` ✅
- **Account Picker:** `prompt=select_account` ✅

## Checklist - Complete These Steps

### ☐ Step 1: Google Cloud Console Setup

1. **Go to:** https://console.cloud.google.com/apis/credentials
2. **Find:** Your OAuth 2.0 Client ID for "musicverse"
3. **Edit:** Click the pencil icon
4. **Add Authorized Redirect URIs:**
   ```
   https://qtnuhdrhvrmgpljdhfmt.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   http://192.168.1.160:3000/auth/callback
   ```
5. **Save Changes**
6. **Copy:**
   - Client ID (looks like: `xxx.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-xxx`)

### ☐ Step 2: Supabase Dashboard Setup

1. **Go to:** https://app.supabase.co/project/qtnuhdrhvrmgpljdhfmt/auth/providers
2. **Click:** Google provider
3. **Toggle:** Enable ✅
4. **Paste:**
   - Client ID (from Google Cloud)
   - Client Secret (from Google Cloud)
5. **Save**

### ☐ Step 3: Test Setup

1. **Clear Browser Cache**
   - Chrome: Cmd+Shift+Delete
   - Or hard refresh: Cmd+Shift+R

2. **Go to:** http://localhost:3000/login

3. **Test Options:**
   - ✅ Email/Password Login (should work)
   - ✅ Continue with Google (test this after setup)

4. **Expected Behavior:**
   - Click "Continue with Google"
   - Google account selector opens
   - Select your Google account
   - Redirects to http://localhost:3000/profile
   - Logged in! 🎉

## Verification Checklist

| Item | Status | Notes |
|------|--------|-------|
| Supabase URL | ✅ | qtnuhdrhvrmgpljdhfmt.supabase.co |
| Supabase Key | ✅ | Configured in .env.local |
| Login Page | ✅ | OAuth button present |
| OAuth Handler | ✅ | redirectTo configured |
| Google+ API | ☐ | Must be enabled in Google Cloud |
| OAuth Credentials | ☐ | Must be created in Google Cloud |
| Redirect URIs | ☐ | Must match exactly |
| Client ID in Supabase | ☐ | Must be pasted in Google provider |
| Client Secret in Supabase | ☐ | Must be pasted in Google provider |

## Quick Reference URLs

```
Supabase Auth: https://app.supabase.co/project/qtnuhdrhvrmgpljdhfmt/auth/providers
Google APIs: https://console.cloud.google.com/apis/credentials
Google+ API: https://console.cloud.google.com/apis/library/plus.googleapis.com
Test App: http://localhost:3000/login
```

## If You Hit Issues

### "Unsupported provider" error
- ☐ Make sure you clicked SAVE in Supabase
- ☐ Wait 1-2 minutes
- ☐ Hard refresh browser (Cmd+Shift+R)
- ☐ Clear cache

### "Redirect URL mismatch"
- ☐ Check redirect URI exactly matches
- ☐ No extra spaces or characters
- ☐ Both Google Cloud and Supabase must have same URL

### Google login doesn't redirect
- ☐ Check `redirectTo` is set to `/profile`
- ☐ Check app is running at correct port (3000)
- ☐ Clear browser cache

## Code Summary

**Login page OAuth setup:**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/profile`,
    queryParams: { prompt: 'select_account' }
  }
})
```

**What this does:**
- ✅ Initiates Google OAuth flow
- ✅ Shows Google account picker
- ✅ Redirects to /profile after login
- ✅ Handles errors gracefully

## Next Steps

1. ☐ Complete Google Cloud setup (steps above)
2. ☐ Complete Supabase setup (steps above)
3. ☐ Test Google login
4. ☐ All working? Deploy! 🚀

---

**Configuration Date:** October 28, 2025
**Status:** Ready for final setup
**Next Action:** Complete Google Cloud & Supabase steps above
