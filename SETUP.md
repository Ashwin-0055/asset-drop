# AssetDrop Setup Guide

Complete step-by-step instructions to get AssetDrop running.

---

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Supabase

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name it "AssetDrop" (or your preferred name)
   - Choose a strong database password
   - Select your region
   - Wait for project to provision (~2 minutes)

2. **Get API Keys**
   - Go to Settings → API
   - Copy the following:
     - Project URL (looks like: `https://xxxxx.supabase.co`)
     - Anon/Public key (`eyJhbGci...`)
     - Service Role key (`eyJhbGci...` - different from anon key)

3. **Run Database Migration**
   - Go to SQL Editor in Supabase Dashboard
   - Click "+ New Query"
   - Copy entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and click "Run"
   - Should see success message: "AssetDrop database schema created successfully!"

### Step 3: Set Up Google Drive API

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Click "Select a project" → "New Project"
   - Name it "AssetDrop"
   - Click "Create"

2. **Enable Google Drive API**
   - In the Cloud Console, search for "Google Drive API"
   - Click "Enable"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill in:
     - App name: `AssetDrop`
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Add scopes:
     - `.../auth/drive.file`
     - `.../auth/userinfo.profile`
   - Click "Save and Continue"
   - Add test users (your email)
   - Click "Save and Continue"

4. **Create OAuth Credentials**
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "AssetDrop Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
   - Click "Create"
   - **Copy Client ID and Client Secret** (you'll need these next)

### Step 4: Create Environment File

Create `.env.local` in project root:

```env
# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Google OAuth (from Step 3)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Replace all placeholder values with your actual keys!**

### Step 5: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ✅ Verify Setup

### Test Authentication

1. Click "Get Started" on landing page
2. Enter your email
3. Check email for magic link
4. Click link → should redirect to dashboard

### Test Google Drive Connection

1. In dashboard, you should see a prompt to connect Google Drive
2. Click "Connect Google Drive"
3. Sign in with Google
4. Grant permissions
5. Should see green dot indicating connection

### Test Project Creation

1. Click "+ Create Project"
2. Drag form components
3. Click "Publish"
4. Copy shareable link
5. Open in incognito window
6. Upload a test file
7. Check your Google Drive → should see "AssetDrop" folder with file

---

## 🐛 Troubleshooting

### "Invalid API Key" Error

**Problem**: Supabase keys are incorrect or not loaded

**Solutions**:
- Double-check keys in `.env.local`
- Restart dev server: `Ctrl+C` then `npm run dev`
- Ensure keys start with `eyJhbGci...`
- No extra spaces or quotes around keys

### Google OAuth "Redirect URI Mismatch"

**Problem**: Redirect URI doesn't match Google Cloud settings

**Solutions**:
- Go to Google Cloud Console → Credentials
- Edit OAuth 2.0 Client
- Ensure redirect URI is EXACTLY: `http://localhost:3000/api/auth/google/callback`
- No trailing slash
- Must match `.env.local` exactly

### "Access Denied" When Connecting Google Drive

**Problem**: OAuth consent screen not configured or app not verified

**Solutions**:
- Add your email as a test user in OAuth consent screen
- Ensure Drive API is enabled
- Check that required scopes are added
- Try with a different Google account

### Magic Link Email Not Received

**Problem**: Email not configured in Supabase

**Solutions**:
- Check spam folder
- Go to Supabase → Authentication → Email Templates
- Test email delivery in Supabase dashboard
- For production, configure SMTP settings

### Database Migration Failed

**Problem**: SQL syntax error or permission issue

**Solutions**:
- Ensure you're pasting in SQL Editor (not API docs)
- Check for any existing tables: `SELECT * FROM projects;`
- If tables exist, either drop them or skip migration
- Verify you're using project owner account

### File Upload Fails

**Problem**: Google Drive permissions or token expiry

**Solutions**:
- Disconnect and reconnect Google Drive
- Check browser console for errors
- Verify file size < 50MB
- Ensure Google Drive has available storage space

### Port 3000 Already in Use

**Problem**: Another process using port 3000

**Solutions**:
```bash
# Find and kill process on Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Or use a different port
npm run dev -- -p 3001
```

---

## 🚢 Production Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add all environment variables from `.env.local`
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
   - Click "Deploy"

3. **Update Google OAuth**
   - Go to Google Cloud Console → Credentials
   - Add production redirect URI: `https://your-app.vercel.app/api/auth/google/callback`
   - Update `GOOGLE_REDIRECT_URI` in Vercel environment variables

4. **Configure Supabase for Production**
   - Go to Supabase → Authentication → URL Configuration
   - Add your Vercel URL to allowed redirect URLs

---

## 📧 Email Configuration (Production)

For production, configure custom SMTP:

1. Go to Supabase → Settings → Auth
2. Scroll to SMTP Settings
3. Enter your SMTP details (Gmail, SendGrid, etc.)
4. Customize email templates in Authentication → Email Templates

---

## 🔒 Security Checklist

Before going live:

- [ ] All environment variables are set in production
- [ ] `.env.local` is in `.gitignore`
- [ ] Google OAuth is verified (remove test mode)
- [ ] Supabase RLS policies are enabled
- [ ] Service role key is never exposed to client
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled (Vercel/Supabase)
- [ ] Error logging is set up (Sentry, etc.)

---

## 📞 Need Help?

If you encounter issues not covered here:

1. Check browser console for errors
2. Check Supabase logs (Database → Logs)
3. Check Vercel logs (if deployed)
4. Review Next.js error messages

---

**You're all set! Happy building with AssetDrop! 🚀**
