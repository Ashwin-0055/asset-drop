# Fix: Magic Link "OTP Expired" Error on Vercel

## 🐛 Problem

When clicking magic link from email, you get redirected to:
```
https://asset-drop.vercel.app/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

## ✅ Solution

Your Supabase project doesn't recognize your Vercel domain. You need to configure Supabase to allow authentication from your Vercel URL.

---

## 🔧 Step-by-Step Fix

### Step 1: Configure Supabase Site URL

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration

2. **Update Site URL:**
   - Find "Site URL" field
   - Change from `http://localhost:3000`
   - To: `https://your-vercel-domain.vercel.app`
   - Click "Save"

   **Example:**
   ```
   Before: http://localhost:3000
   After:  https://asset-drop.vercel.app
   ```

### Step 2: Add Redirect URLs

In the same page, scroll down to **"Redirect URLs"** section:

1. **Add your Vercel domain:**
   ```
   https://your-vercel-domain.vercel.app/**
   ```

2. **Keep localhost for development:**
   ```
   http://localhost:3000/**
   ```

3. **Add auth callback (if not already there):**
   ```
   https://your-vercel-domain.vercel.app/api/auth/callback
   ```

4. **Click "Save"**

**Important:** The `/**` at the end is a wildcard that allows all paths under your domain.

### Step 3: Check Email Templates (Optional)

1. **Go to:** Auth → Email Templates
2. **Click on "Magic Link" template**
3. **Verify the link uses:** `{{ .SiteURL }}`

   Should look like:
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
   ```

4. **If it says** `{{ .ConfirmationURL }}`, that's also fine (it's the default)

### Step 4: Test Again

1. **Go to** your Vercel site: `https://your-vercel-domain.vercel.app`
2. **Click "Get Started"**
3. **Enter your email**
4. **Check your inbox**
5. **Click the magic link**
6. ✅ **Should now work!**

---

## 🎯 Quick Verification Checklist

Before testing, verify these settings in Supabase:

**Auth → URL Configuration:**
- [ ] Site URL = `https://your-vercel-domain.vercel.app`
- [ ] Redirect URLs includes `https://your-vercel-domain.vercel.app/**`
- [ ] Redirect URLs includes `http://localhost:3000/**` (for dev)

**Vercel Environment Variables:**
- [ ] NEXT_PUBLIC_SUPABASE_URL is correct
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
- [ ] NEXT_PUBLIC_APP_URL = `https://your-vercel-domain.vercel.app`

---

## 🚨 Common Issues & Solutions

### Issue 1: "Site URL can't be updated"

**Problem:** Supabase locks Site URL after too many auth attempts

**Solution:**
1. Wait 5-10 minutes
2. Clear your browser cookies
3. Try updating again
4. OR contact Supabase support to unlock

### Issue 2: Link still expires immediately

**Problem:** Link used before or clicked twice

**Solution:**
- Each magic link can only be used ONCE
- Request a new magic link
- Click it only once
- Don't click "back" button after clicking link

### Issue 3: Different error code

**If you get `access_denied` without `otp_expired`:**
- Check that your email is verified in Supabase
- Check Auth → Users tab
- Make sure user exists

**If you get `invalid_request`:**
- Check that Site URL is exactly correct
- No trailing slash: ❌ `https://domain.com/`
- Correct: ✅ `https://domain.com`

### Issue 4: Works locally but not on Vercel

**Problem:** localhost configured but Vercel URL not added

**Solution:**
- Add BOTH URLs to Supabase redirect URLs
- Use separate Site URLs for different environments (not recommended)
- OR always use production URL as Site URL

---

## 🔄 Development vs Production Setup

### Option A: Production-First (Recommended)

**Supabase Site URL:** `https://your-vercel-domain.vercel.app`

**Redirect URLs:**
```
https://your-vercel-domain.vercel.app/**
http://localhost:3000/**
```

**Pros:**
- Production always works
- Magic links use production URL
- Local dev still works via redirect URLs

**Cons:**
- Magic links redirect to production even in dev

### Option B: Localhost-First (Development)

**Supabase Site URL:** `http://localhost:3000`

**Redirect URLs:**
```
http://localhost:3000/**
https://your-vercel-domain.vercel.app/**
```

**Pros:**
- Better for local development
- Magic links work locally

**Cons:**
- Production magic links may fail
- Need to change before deploying

### Recommended: Option A (Production-First)

Set production URL as Site URL, add localhost to redirect URLs. This way production always works.

---

## 📧 Email Provider Considerations

### If using custom SMTP in Supabase:

1. **Go to:** Auth → Email Templates → SMTP Settings
2. **Verify sender email** is verified
3. **Check SMTP credentials** are correct
4. **Test email sending** from Supabase dashboard

### If using Supabase default email:

- Works for development
- Limited to 4 emails per hour per project
- Rate limited for production use
- Consider setting up custom SMTP for production

---

## 🧪 Testing the Fix

### Test Flow:

1. **Clear browser cookies** (important!)
   - Chrome: Settings → Privacy → Clear browsing data
   - Select "Cookies" and "Cached images"
   - Time range: "All time"
   - Click "Clear data"

2. **Open incognito/private window**

3. **Go to** `https://your-vercel-domain.vercel.app`

4. **Click "Get Started"**

5. **Enter email and submit**
   - Should see: "Check your email for the magic link"

6. **Check inbox**
   - Should receive email from Supabase
   - Subject: "Confirm your signup" or "Magic Link"

7. **Click the link** (only once!)
   - Should redirect to your Vercel site
   - Should see dashboard
   - ✅ Success!

### Expected Magic Link Format:

```
https://YOUR_PROJECT.supabase.co/auth/v1/verify?
  token=xxxxx&
  type=magiclink&
  redirect_to=https://your-vercel-domain.vercel.app/api/auth/callback
```

The `redirect_to` should match your Vercel domain!

---

## 🔍 Debug: Check Supabase Logs

If still not working:

1. **Go to:** Supabase Dashboard → Logs → Auth Logs
2. **Filter by** your email address
3. **Look for errors** in the recent attempts
4. **Common error messages:**
   - "Invalid redirect URL" = Add URL to allowed list
   - "User not found" = Email not in users table
   - "Token expired" = Link too old (request new one)

---

## 💡 Pro Tips

1. **Magic links expire after 1 hour** - Request new link if expired

2. **Each link works only once** - Don't click twice

3. **Use incognito for testing** - Avoids cookie conflicts

4. **Check spam folder** - Supabase emails sometimes go to spam

5. **Verify email in Supabase** - Go to Auth → Users, check if user exists

6. **Rate limits apply** - Max 4 emails/hour on free tier

7. **PKCE flow** - Supabase now uses PKCE for better security (requires proper redirect URLs)

---

## 📝 Summary Checklist

Before requesting help, verify:

- [ ] Supabase Site URL = Your Vercel domain
- [ ] Redirect URLs include your Vercel domain with `/**`
- [ ] NEXT_PUBLIC_APP_URL in Vercel = Your Vercel domain
- [ ] Cookies cleared before testing
- [ ] Magic link clicked only once
- [ ] Link clicked within 1 hour of receiving
- [ ] Checked Supabase Auth Logs for errors
- [ ] Tested in incognito window

---

## 🎯 Quick Fix (Copy-Paste)

**Replace these values with yours:**

1. **Supabase Dashboard → Auth → URL Configuration:**
   ```
   Site URL: https://asset-drop.vercel.app
   ```

2. **Redirect URLs (add these lines):**
   ```
   https://asset-drop.vercel.app/**
   http://localhost:3000/**
   ```

3. **Save and test!**

---

**After fixing, the magic link login should work perfectly! ✅**
