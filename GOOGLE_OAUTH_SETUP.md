# Google OAuth Setup Guide

## Error You're Seeing
```
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

This means Google OAuth provider is not enabled in your Supabase project.

## Steps to Enable Google OAuth

### 1. Go to Supabase Dashboard
- Visit: https://app.supabase.com
- Select your **musicverse** project

### 2. Navigate to Authentication
- Click **Authentication** (left sidebar)
- Click **Providers**

### 3. Find and Enable Google
- Scroll down to find **Google**
- Click on it to expand
- Toggle **Enable** to **ON**

### 4. Configure Google Credentials

You need a **Client ID** and **Client Secret** from Google Cloud. Here's how:

#### A. Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Click **Select a Project** at top
3. Click **NEW PROJECT**
4. Name it: `musicverse` (or similar)
5. Click **CREATE**
6. Wait for project to be created (~1 minute)

#### B. Enable Google+ API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for: `Google+ API`
3. Click on **Google+ API**
4. Click **ENABLE**

#### C. Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. If prompted to create OAuth consent screen first:
   - Click **CONFIGURE CONSENT SCREEN**
   - Select **External** (for testing)
   - Click **CREATE**
   - Fill in:
     - **App name:** Musicverse
     - **User support email:** your-email@example.com
     - Click **SAVE AND CONTINUE**
   - On "Scopes" page: Click **SAVE AND CONTINUE**
   - On "Test users" page: Click **SAVE AND CONTINUE**
   - Review and click **BACK TO DASHBOARD**

4. Now go back to **Credentials**
5. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
6. Select **Web application**
7. Fill in **Authorized redirect URIs**:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   (Replace `YOUR_PROJECT_ID` with your Supabase project ID)

   For local testing, also add:
   ```
   http://localhost:3000/auth/callback
   http://192.168.1.160:3000/auth/callback
   ```

8. Click **CREATE**
9. Copy the **Client ID** and **Client Secret**

### 5. Add to Supabase

Back in Supabase Dashboard:

1. In the Google provider section, paste:
   - **Client ID:** (from Google Cloud)
   - **Client Secret:** (from Google Cloud)

2. Under **Authorized redirect URIs** in Supabase, make sure it shows:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```

3. Click **SAVE**

### 6. Configure Redirect URL in Your App

In your code (`pages/login.tsx`), the redirect is already set:

```typescript
redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/profile` : undefined,
```

This will redirect to `/profile` after Google login.

## Finding Your Supabase Project ID

1. Go to Supabase Dashboard
2. Click your project name at top-left
3. Look for **Project ID** in the settings
4. Format: `xxxxxxxxxxxxxxxxxxxx` (looks like a long hash)

## Testing Google OAuth

After setup:

1. Refresh your browser (clear cache if needed)
2. Go to http://localhost:3000/login
3. Click **Continue with Google**
4. You should be prompted to select a Google account
5. After approval, you'll be redirected to `/profile`

## Common Issues

### Issue: "Redirect URL mismatch"
**Solution:** Make sure the redirect URI in Google Cloud Console exactly matches what Supabase shows

### Issue: "Client ID is invalid"
**Solution:** Check you copied the full Client ID from Google Cloud (no spaces)

### Issue: Still getting "Unsupported provider" error
**Solution:**
1. Make sure you clicked **SAVE** in Supabase after adding credentials
2. Wait 1-2 minutes for Supabase to sync
3. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
4. Clear browser cache

### Issue: Account already exists with different sign-in method
**Solution:** This happens if you already signed up with email/password. Either:
- Use the same email for Google login
- Or create a new test account with different email

## Supabase Dashboard Links

- Google+ API enablement: https://console.cloud.google.com/apis/library/plus.googleapis.com
- OAuth Credentials: https://console.cloud.google.com/apis/credentials
- Supabase Auth Providers: https://app.supabase.com/project/_/auth/providers

## Quick Reference

**What you need:**
- ✅ Supabase Project ID
- ✅ Google Client ID
- ✅ Google Client Secret
- ✅ Authorized Redirect URI (from Supabase)

**Testing checklist:**
- ✅ Google provider enabled in Supabase
- ✅ Client ID and Secret added to Supabase
- ✅ Redirect URI configured in Google Cloud
- ✅ Email verification disabled (optional, already done)
- ✅ Browser cache cleared

---

**Status:** 🔧 Requires manual setup in Google Cloud & Supabase
**Estimated time:** 10-15 minutes
