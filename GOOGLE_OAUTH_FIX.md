# Fix: Google OAuth "Error 400: redirect_uri_mismatch"

## 🐛 The Error

```
Sign in with Google
Access blocked: Assetdrop's request is invalid

Error 400: redirect_uri_mismatch
```

## 🎯 What This Means

Google is rejecting your OAuth request because:
- The redirect URI your app is sending doesn't match what's configured in Google Cloud Console
- Google is very strict about exact URI matching (even `/` at the end matters!)

---

## ✅ Complete Fix (5 Steps)

### Step 1: Check What URI Your App Is Using

1. **Check Vercel Environment Variable:**
   - Go to: Vercel Dashboard → Settings → Environment Variables
   - Look for: `GOOGLE_REDIRECT_URI`
   - **It should be:** `https://asset-drop.vercel.app/api/google-drive/callback`

2. **If it's wrong or missing:**
   - Click "Edit" or "Add New"
   - Set to: `https://asset-drop.vercel.app/api/google-drive/callback`
   - Select: Production, Preview, Development (all three)
   - Click "Save"
   - **Redeploy** your app

### Step 2: Find Your Google Cloud Project

1. **Go to:** https://console.cloud.google.com
2. **Sign in** with the Google account that created the OAuth app
3. **Select your project** from the dropdown at top
   - Look for your project name (might be "AssetDrop" or similar)

### Step 3: Configure Authorized Redirect URIs

1. **Go to:** APIs & Services → Credentials
   - Direct link: https://console.cloud.google.com/apis/credentials

2. **Find your OAuth 2.0 Client ID**
   - Look under "OAuth 2.0 Client IDs"
   - Should be named something like "Web client 1" or "AssetDrop"
   - Click on it to edit

3. **Scroll to "Authorized redirect URIs"**

4. **Add BOTH of these URIs** (one per line):
   ```
   https://asset-drop.vercel.app/api/google-drive/callback
   http://localhost:3000/api/google-drive/callback
   ```

5. **Click "Save"** at the bottom

**⚠️ IMPORTANT:**
- Must use your **permanent** Vercel URL (without random characters)
- Must be **exact match** - no extra slashes, no typos
- Must be **HTTPS** for production (HTTP only for localhost)

### Step 4: Verify OAuth Consent Screen

1. **Go to:** OAuth consent screen (in left sidebar)
2. **Check Status:**
   - If it says "Testing" → Add your test users' emails
   - If it says "Published" → You're good to go

3. **If in Testing mode:**
   - Scroll to "Test users"
   - Click "+ Add Users"
   - Add: `hustlerashwin2400@gmail.com` (your email)
   - Click "Save"

### Step 5: Test the Connection

1. **Wait 1-2 minutes** (Google needs time to propagate changes)

2. **Clear browser cookies** or use incognito window

3. **Go to:** https://asset-drop.vercel.app

4. **Login** to your dashboard

5. **Click profile avatar** (top right)

6. **Click "Connect Google Drive"**

7. ✅ **Should redirect to Google and work!**

---

## 🔍 Debug: Find the Mismatch

If still not working, let's find what URI is being sent vs what Google expects:

### Method 1: Check the Error Details

1. When you see the error, click "error details" link
2. Look for:
   ```
   Redirect URI: https://...  ← What your app sent
   ```
3. Compare with what's in Google Console

### Method 2: Check Browser Network Tab

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Click "Connect Google Drive"**
4. **Look for request to:** `accounts.google.com/o/oauth2/v2/auth`
5. **Check the `redirect_uri` parameter** in the URL
6. **This is what your app is sending** - must match Google Console exactly

### Method 3: Check Environment Variable

**In Vercel:**
```bash
# Go to Vercel → Settings → Environment Variables
# Check GOOGLE_REDIRECT_URI value

Should be: https://asset-drop.vercel.app/api/google-drive/callback
```

**In your local .env.local:**
```bash
# Check if this is correct
GOOGLE_REDIRECT_URI=https://asset-drop.vercel.app/api/google-drive/callback

# For local development:
# GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-drive/callback
```

---

## 🚨 Common Mistakes

### Mistake 1: Using Deployment URL Instead of Permanent URL

❌ **Wrong:**
```
https://asset-drop-abc123.vercel.app/api/google-drive/callback
```

✅ **Correct:**
```
https://asset-drop.vercel.app/api/google-drive/callback
```

### Mistake 2: Trailing Slash

❌ **Wrong:**
```
https://asset-drop.vercel.app/api/google-drive/callback/
```

✅ **Correct:**
```
https://asset-drop.vercel.app/api/google-drive/callback
```

### Mistake 3: HTTP Instead of HTTPS

❌ **Wrong (for production):**
```
http://asset-drop.vercel.app/api/google-drive/callback
```

✅ **Correct:**
```
https://asset-drop.vercel.app/api/google-drive/callback
```

### Mistake 4: Wrong Path

❌ **Wrong:**
```
https://asset-drop.vercel.app/api/google/callback
https://asset-drop.vercel.app/api/auth/google
```

✅ **Correct:**
```
https://asset-drop.vercel.app/api/google-drive/callback
```

### Mistake 5: Environment Variable Not Set on Vercel

- You have it in `.env.local` locally ✅
- But forgot to add it to Vercel environment variables ❌
- Result: App uses wrong URL on Vercel

**Fix:** Add to Vercel → Settings → Environment Variables

---

## 📋 Complete Checklist

Before testing, verify ALL these match:

### 1. Google Cloud Console
**Location:** https://console.cloud.google.com/apis/credentials

**OAuth 2.0 Client ID → Authorized redirect URIs:**
- [ ] `https://asset-drop.vercel.app/api/google-drive/callback`
- [ ] `http://localhost:3000/api/google-drive/callback`

### 2. Vercel Environment Variables
**Location:** Vercel → Settings → Environment Variables

- [ ] `GOOGLE_REDIRECT_URI=https://asset-drop.vercel.app/api/google-drive/callback`
- [ ] Set for Production, Preview, Development
- [ ] No typos, no trailing slash

### 3. Other Required Vercel Variables
- [ ] `GOOGLE_CLIENT_ID=your_client_id`
- [ ] `GOOGLE_CLIENT_SECRET=your_client_secret`
- [ ] `NEXT_PUBLIC_APP_URL=https://asset-drop.vercel.app`

### 4. OAuth Consent Screen
- [ ] Status is "Testing" or "Published"
- [ ] Your email added to test users (if Testing)
- [ ] All required scopes are added

---

## 🎓 Understanding OAuth Redirect URIs

### What is a Redirect URI?

When you click "Connect Google Drive":
1. Your app redirects you to Google
2. You login and authorize
3. **Google redirects you BACK to this URI** with auth code
4. Your app exchanges auth code for access token

### Why Must They Match Exactly?

**Security!** Google verifies:
- The URI is pre-approved (in Google Console)
- No one can redirect to a malicious site
- Prevents OAuth hijacking attacks

This is why even a single `/` difference causes rejection.

### The Full OAuth Flow

```
1. User clicks "Connect Drive"
   ↓
2. App redirects to:
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=...
     redirect_uri=https://asset-drop.vercel.app/api/google-drive/callback
     scope=...
   ↓
3. User authorizes in Google
   ↓
4. Google redirects to:
   https://asset-drop.vercel.app/api/google-drive/callback?code=...
   ↓
5. Your API route receives the code
   ↓
6. Your app exchanges code for tokens
   ↓
7. Tokens saved to database
   ↓
8. User redirected to dashboard
```

**If redirect_uri doesn't match → Flow breaks at step 4**

---

## 🧪 Test Your Configuration

### Quick Test Script

Run this in your browser console while on Google's OAuth page:

```javascript
// Extract redirect_uri from current URL
const url = new URL(window.location.href);
const redirect = url.searchParams.get('redirect_uri');
console.log('App is requesting:', redirect);

// This should match what's in Google Console!
```

### Manual Verification

1. **What your app sends:** Check Vercel env var `GOOGLE_REDIRECT_URI`
2. **What Google expects:** Check Google Console → Credentials → OAuth Client → Authorized redirect URIs
3. **Must be identical!**

---

## 🔄 If You Changed the URL

**After changing redirect URI in Google Console:**
1. **Wait 1-2 minutes** for changes to propagate
2. **Clear browser cookies**
3. **Use incognito window** to test
4. **Try again**

**After changing Vercel environment variables:**
1. **Redeploy** the app (or push new code)
2. Environment variables only update on new deployments
3. Old deployments keep old values

---

## 💡 Pro Tips

1. **Keep both localhost and production URIs** in Google Console
   - Allows local development and production to work
   - No need to switch between them

2. **Use permanent Vercel URL everywhere**
   - In Google Console
   - In Vercel environment variables
   - Never use deployment-specific URLs

3. **Check OAuth consent screen**
   - Must add test users if in "Testing" status
   - Or publish the app (requires verification for production)

4. **Exact match is required**
   - Case sensitive
   - No trailing slashes
   - HTTPS vs HTTP matters
   - Every character must match

5. **Environment variables need redeploy**
   - Changes don't apply to existing deployments
   - Must trigger new deployment

---

## 🐛 Still Not Working?

### Double-check these:

1. **Correct Google Account?**
   - Using same Google account that created OAuth app?
   - Signed in to Google Cloud Console with correct account?

2. **Correct Project?**
   - Selected right project in Google Cloud Console?
   - Check project name at top of console

3. **Correct OAuth Client?**
   - You might have multiple OAuth clients
   - Make sure you're editing the right one
   - Check the Client ID matches your env var

4. **Propagation Time:**
   - Google changes can take 1-2 minutes
   - Wait a bit and try again

5. **Vercel Deployment:**
   - Did you redeploy after changing env vars?
   - Check deployment logs for errors

---

## 📞 Quick Reference

**Your Correct Configuration:**

```bash
# Vercel Environment Variables
GOOGLE_CLIENT_ID=your_client_id_from_google
GOOGLE_CLIENT_SECRET=your_client_secret_from_google
GOOGLE_REDIRECT_URI=https://asset-drop.vercel.app/api/google-drive/callback
NEXT_PUBLIC_APP_URL=https://asset-drop.vercel.app

# Google Cloud Console
# Authorized redirect URIs:
https://asset-drop.vercel.app/api/google-drive/callback
http://localhost:3000/api/google-drive/callback
```

**Steps to Fix:**
1. ✅ Add URIs to Google Console
2. ✅ Set GOOGLE_REDIRECT_URI in Vercel
3. ✅ Redeploy
4. ✅ Wait 1-2 minutes
5. ✅ Test in incognito

---

**After following these steps, Google OAuth should work perfectly!** ✅

If you still see the error, check the "error details" link on Google's page - it will tell you exactly what URI mismatch occurred.
