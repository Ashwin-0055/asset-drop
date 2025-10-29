# Vercel Permanent URL Setup Guide

## 🎯 The Problem You're Experiencing

You noticed the URL changes after every deployment:
```
Deployment 1: asset-drop-abc123.vercel.app
Deployment 2: asset-drop-def456.vercel.app
Deployment 3: asset-drop-ghi789.vercel.app
```

This is breaking your Supabase authentication! ❌

## ✅ The Solution: Use Your PERMANENT Production URL

Vercel gives you **TWO types of URLs**:

### 1. Deployment URLs (Temporary) ❌
- **Format:** `project-name-random123.vercel.app`
- **Changes** every deployment
- **Purpose:** Preview specific deployments
- **Don't use these for configuration!**

### 2. Production URL (Permanent) ✅
- **Format:** `project-name.vercel.app`
- **Never changes**
- **Purpose:** Your main production site
- **Use this for all configurations!**

---

## 🔍 Find Your Permanent Production URL

### Method 1: Vercel Dashboard

1. **Go to:** https://vercel.com/dashboard
2. **Click** on your "asset-drop" project
3. **Look at the top** - you'll see:
   ```
   Domains
   asset-drop.vercel.app  (Production)
   └─ This is your PERMANENT URL ✅

   Deployments
   asset-drop-abc123.vercel.app  (Latest)
   └─ This changes every time ❌
   ```

4. **Your permanent URL is:** `asset-drop.vercel.app`

### Method 2: Settings → Domains

1. **Go to:** Project → Settings → Domains
2. **You'll see your production domain:**
   ```
   asset-drop.vercel.app
   Status: ✅ Active
   ```

This URL **NEVER changes** - use this one!

---

## 🔧 Configure Everything with Permanent URL

Now use `asset-drop.vercel.app` (without the random suffix) in ALL configurations:

### 1. Supabase Configuration

**Go to:** Supabase Dashboard → Auth → URL Configuration

**Site URL:**
```
https://asset-drop.vercel.app
```

**Redirect URLs:**
```
https://asset-drop.vercel.app/**
http://localhost:3000/**
```

**Save changes**

### 2. Vercel Environment Variables

**Go to:** Vercel → Settings → Environment Variables

**Update these:**
```bash
NEXT_PUBLIC_APP_URL=https://asset-drop.vercel.app
GOOGLE_REDIRECT_URI=https://asset-drop.vercel.app/api/google-drive/callback
```

**Save and redeploy**

### 3. Google Cloud OAuth

**Go to:** https://console.cloud.google.com/apis/credentials

**Authorized redirect URIs:**
```
https://asset-drop.vercel.app/api/google-drive/callback
```

**Save**

---

## 📝 Summary: What URL to Use Where

| Service | Setting | URL to Use |
|---------|---------|------------|
| **Supabase** | Site URL | `https://asset-drop.vercel.app` |
| **Supabase** | Redirect URLs | `https://asset-drop.vercel.app/**` |
| **Vercel** | NEXT_PUBLIC_APP_URL | `https://asset-drop.vercel.app` |
| **Vercel** | GOOGLE_REDIRECT_URI | `https://asset-drop.vercel.app/api/google-drive/callback` |
| **Google Cloud** | Authorized redirect URI | `https://asset-drop.vercel.app/api/google-drive/callback` |
| **Resend** | From email domain | `asset-drop.vercel.app` (if using custom domain) |

**Key Rule:** Always use `asset-drop.vercel.app` (permanent), never `asset-drop-xyz123.vercel.app` (temporary)

---

## 🚀 After Updating All Configurations

1. **Redeploy on Vercel** (to pick up new env variables)
2. **Clear browser cookies**
3. **Test in incognito window:**
   - Visit: `https://asset-drop.vercel.app`
   - Click "Get Started"
   - Enter email
   - Click magic link from email
   - ✅ Should work now!

---

## 🎨 Optional: Add a Custom Domain

Want `assetdrop.com` instead of `asset-drop.vercel.app`?

### Step 1: Add Domain to Vercel

1. **Go to:** Vercel → Settings → Domains
2. **Click:** "Add Domain"
3. **Enter:** `assetdrop.com` or `www.assetdrop.com`
4. **Configure DNS** as instructed by Vercel

### Step 2: Update All Configurations

Replace `asset-drop.vercel.app` with your custom domain everywhere:
- Supabase Site URL
- Supabase Redirect URLs
- Vercel environment variables
- Google OAuth
- Resend (if using)

**Example:**
```
Before: https://asset-drop.vercel.app
After:  https://assetdrop.com
```

---

## 🔍 Understanding Vercel Deployment URLs

### What Are Deployment URLs For?

**Deployment URLs (the changing ones) are for:**
- ✅ Preview branches (e.g., `feature-xyz`)
- ✅ Testing specific deployments before they go live
- ✅ Sharing work-in-progress with team
- ✅ Rollback testing

**They are NOT for:**
- ❌ Production use
- ❌ Configuration in external services
- ❌ Sharing with end users

### Production vs Deployment

```
Production URL (Permanent):
https://asset-drop.vercel.app
├─ Always points to latest production deployment
├─ Never changes
└─ Use this for configuration

Deployment URLs (Temporary):
https://asset-drop-abc123.vercel.app (Deploy 1)
https://asset-drop-def456.vercel.app (Deploy 2)
https://asset-drop-ghi789.vercel.app (Deploy 3)
├─ Unique per deployment
├─ Changes every time
└─ Use only for preview/testing
```

### How It Works

1. You push code to GitHub
2. Vercel creates new deployment with unique URL: `asset-drop-xyz123.vercel.app`
3. After build succeeds, **your production URL automatically points to it**
4. Production URL: `asset-drop.vercel.app` → points to latest deployment
5. Users always access via production URL
6. Old deployment URLs remain accessible for history/rollback

---

## 🎯 Quick Checklist

Before testing, verify:

**Vercel Dashboard:**
- [ ] Found permanent production URL (Settings → Domains)
- [ ] Updated NEXT_PUBLIC_APP_URL environment variable
- [ ] Updated GOOGLE_REDIRECT_URI environment variable
- [ ] Redeployed after changing env variables

**Supabase Dashboard:**
- [ ] Site URL = `https://asset-drop.vercel.app`
- [ ] Redirect URLs includes permanent URL with `/**`
- [ ] No deployment-specific URLs in configuration

**Google Cloud Console:**
- [ ] Authorized redirect URI uses permanent URL
- [ ] No deployment-specific URLs

**Testing:**
- [ ] Using incognito/private window
- [ ] Visiting permanent URL (not deployment URL)
- [ ] Cookies cleared
- [ ] Magic link clicked only once

---

## 🐛 Troubleshooting

### "Which URL should I visit?"

**Always visit:** `https://asset-drop.vercel.app`

**Don't visit:** `https://asset-drop-abc123.vercel.app`

The deployment-specific URLs are created automatically but you should ignore them for normal use.

### "How do I know which is my permanent URL?"

**Check Vercel Dashboard → Settings → Domains**

The domain without random characters is your permanent one:
- ✅ `asset-drop.vercel.app` (permanent)
- ❌ `asset-drop-7a8b9c0d.vercel.app` (temporary)

### "Can I change my permanent URL?"

Your permanent Vercel subdomain is based on your project name:
- Project name: `asset-drop`
- Permanent URL: `asset-drop.vercel.app`

To change it:
1. Rename project in Vercel (Settings → General)
2. OR add a custom domain

### "What if I already configured with deployment URL?"

**Fix it now:**
1. Go to Supabase and update Site URL to permanent URL
2. Update environment variables in Vercel
3. Update Google OAuth redirect URI
4. Redeploy
5. Test with new permanent URL

---

## 📊 Comparison Table

| Aspect | Deployment URL | Production URL |
|--------|---------------|----------------|
| **Format** | `project-xyz123.vercel.app` | `project.vercel.app` |
| **Changes?** | ✅ Yes, every deploy | ❌ No, stays same |
| **Purpose** | Preview/testing | Production use |
| **Auto-redirects?** | ❌ No | ✅ Yes, to latest |
| **Configure in Supabase?** | ❌ Never | ✅ Always |
| **Share with users?** | ❌ No | ✅ Yes |
| **SSL Certificate** | ✅ Auto | ✅ Auto |

---

## 🎓 Key Takeaways

1. **Vercel gives you a permanent production URL** - `project-name.vercel.app`
2. **Deployment URLs are temporary previews** - ignore them for configuration
3. **Always use permanent URL in:**
   - Supabase Site URL
   - Environment variables
   - OAuth redirect URIs
   - Any external service configuration
4. **Your permanent URL points to the latest deployment automatically**
5. **Old deployment URLs remain accessible but don't use them**

---

## ✅ Success Checklist

You've configured everything correctly when:

- [ ] All configurations use `asset-drop.vercel.app` (no random suffix)
- [ ] Magic link login works
- [ ] Google OAuth works
- [ ] Emails send successfully
- [ ] File uploads work
- [ ] No changing URLs after redeployment
- [ ] Users can bookmark and return to same URL

---

**Your permanent URL is: `https://asset-drop.vercel.app`**

**Use this everywhere! Never use deployment-specific URLs for configuration!**

---

**Need help finding your permanent URL? Check Vercel Dashboard → Settings → Domains** 🚀
