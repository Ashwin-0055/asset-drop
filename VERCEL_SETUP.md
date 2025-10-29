# Vercel Deployment Setup & Testing Guide

## 🚀 Vercel Environment Variables Setup

Your deployment is failing because environment variables aren't configured on Vercel. Here's how to fix it:

### Step 1: Add Environment Variables to Vercel

1. **Go to your Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your AssetDrop project

2. **Navigate to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables" in the sidebar

3. **Add ALL these variables:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/google-drive/callback

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Email Configuration (Resend)
RESEND_API_KEY=re_fFsg2xhu_My2cFeDmHMTvuLeHvrfdpoxY
```

**Important:**
- Replace `your-domain.vercel.app` with your actual Vercel domain
- The values should match your `.env.local` file
- Make sure to select "Production", "Preview", and "Development" for each variable

### Step 2: Update Google OAuth Redirect URI

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Select your OAuth 2.0 Client ID

2. **Add Vercel Domain to Authorized Redirect URIs:**
   ```
   https://your-domain.vercel.app/api/google-drive/callback
   ```

3. **Save Changes**

### Step 3: Redeploy on Vercel

After adding environment variables:

1. **Go to Deployments tab** in Vercel dashboard
2. **Click "..." menu** on the latest deployment
3. **Select "Redeploy"**
4. **Wait for build to complete**

OR push new code and it will automatically trigger a deployment.

---

## 🧪 Testing on Vercel Deployment

### Prerequisites Checklist

Before testing, ensure:
- ✅ All environment variables added to Vercel
- ✅ Google OAuth redirect URI updated for Vercel domain
- ✅ Supabase database migrations run (all 4 migrations)
- ✅ Deployment successful (no build errors)

### Migration Status Check

**Run these in Supabase SQL Editor if you haven't:**

```sql
-- Check if migrations are applied
SELECT
  EXISTS(SELECT 1 FROM information_schema.columns
         WHERE table_name = 'assets' AND column_name = 'metadata') as has_metadata,
  EXISTS(SELECT 1 FROM information_schema.columns
         WHERE table_name = 'assets' AND column_name = 'rejection_reason') as has_rejection_reason,
  EXISTS(SELECT 1 FROM information_schema.columns
         WHERE table_name = 'assets' AND column_name = 'approval_remark') as has_approval_remark,
  EXISTS(SELECT 1 FROM information_schema.columns
         WHERE table_name = 'assets' AND column_name = 'client_email') as has_client_email;
```

If any return `false`, run the corresponding migration:
- `002_add_metadata_column.sql`
- `003_add_rejection_reason.sql`
- `004_add_approval_remarks_and_email.sql`

---

## 🔄 Complete Testing Flow on Vercel

### Test 1: Landing Page & Authentication

1. **Visit your Vercel domain:**
   ```
   https://your-domain.vercel.app
   ```

2. **Test Landing Page:**
   - ✅ Page loads without errors
   - ✅ Animations work smoothly
   - ✅ "Get Started" button is visible

3. **Test Login:**
   - Click "Get Started"
   - Enter your email
   - Check inbox for magic link
   - Click magic link
   - ✅ Should redirect to dashboard

### Test 2: Google Drive Connection

1. **Connect Google Drive:**
   - Click profile avatar (top right)
   - Click "Connect Google Drive"
   - ✅ Should redirect to Google OAuth
   - Authorize the app
   - ✅ Should redirect back to dashboard
   - ✅ Green dot should appear next to "Drive Connected"

2. **Verify in Database:**
   - Go to Supabase → Table Editor → user_tokens
   - ✅ Should see your token entry

### Test 3: Project Creation & Form Builder

1. **Create Project:**
   - Dashboard → Click "+ Create Project"
   - Enter:
     - Project Name: "Test Project Vercel"
     - Client Name: "Test Client"
     - Description: "Testing on Vercel deployment"
   - Click "Create"
   - ✅ Should redirect to form builder

2. **Build Form:**
   - Drag "File Upload" to canvas
   - Configure:
     - Label: "Upload Test File"
     - Make it required
   - Drag "Text Input" to canvas
   - Configure:
     - Label: "Enter Your Email"
     - Make it required
   - Click "Save Draft"
   - ✅ Should see success toast
   - ✅ Shareable link should appear

3. **Copy Shareable Link**

### Test 4: Client Portal (Incognito/Private Window)

1. **Open in Incognito:**
   - Open new incognito/private window
   - Paste shareable link
   - ✅ Form should load with your fields

2. **Test File Upload:**
   - **Email field**: Enter `your-test-email@gmail.com`
   - Upload a test file (any small file)
   - Click "Submit Files"
   - ✅ Should see success message

3. **Check Console (F12):**
   - Look for any errors
   - ✅ Should see: "📥 Upload request received"
   - ✅ Should see: "✅ File uploaded to Drive"

### Test 5: Asset Review & Email Notifications

1. **Back in Dashboard:**
   - Go to your project
   - Click "Assets" tab
   - ✅ Should see uploaded file

2. **Manually Add Client Email (Temporary):**
   Since Phase 2 isn't complete, manually add the email:
   - Go to Supabase → Table Editor → assets
   - Find your test asset
   - Edit the row
   - Set `client_email` to your email
   - Save

3. **Approve with Remark:**
   - Click "Approve" button
   - Enter remark: "Great! File looks perfect."
   - Click "Approve Asset"
   - ✅ Should see success toast

4. **Check Your Email:**
   - Wait 30 seconds
   - Check your inbox (the email you used in client_email)
   - ✅ Should receive professional email with:
     - Subject: "Asset Review Complete - Test Project Vercel"
     - Approved section showing your file
     - Your remark displayed

5. **Test Rejection:**
   - Upload another file through the client portal
   - Manually add client_email again in Supabase
   - Click "Reject"
   - Enter reason: "File format incorrect. Please use PNG."
   - Click "Reject Asset"
   - ✅ Check email for rejection notification

### Test 6: Google Drive Verification

1. **Check Your Google Drive:**
   - Go to https://drive.google.com
   - Look for "AssetDrop" folder
   - Open it
   - ✅ Should see "Test Project Vercel" folder
   - ✅ Should see approved file(s)
   - ✅ Rejected file should be deleted

2. **Test Project Deletion:**
   - Go back to dashboard
   - Click "..." on test project
   - Click "Delete"
   - Confirm deletion
   - ✅ Check Google Drive
   - ✅ Project folder should be deleted

---

## 🐛 Troubleshooting Vercel Deployment

### Build Fails with "Missing API key"

**Error:**
```
Error: Missing API key. Pass it to the constructor `new Resend("re_123")`
```

**Solution:**
✅ Fixed! The code now uses a dummy key during build time.
Just redeploy and it should work.

### 500 Error on Login

**Possible Causes:**
1. Supabase environment variables not set correctly
2. Wrong Supabase URL or keys

**Check:**
```bash
# In Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (starts with eyJ)
```

### Google OAuth Fails

**Error:** "Redirect URI mismatch"

**Solution:**
1. Go to Google Cloud Console
2. Add your Vercel domain to Authorized Redirect URIs
3. Make sure it matches exactly: `https://your-domain.vercel.app/api/google-drive/callback`

### Emails Not Sending

**Check:**
1. **Resend API Key set in Vercel?**
   - Go to Settings → Environment Variables
   - Verify RESEND_API_KEY is set

2. **Check Vercel Function Logs:**
   - Go to Deployments → Click on deployment
   - Click "Functions" tab
   - Find `/api/send-review-notification`
   - Check logs for errors

3. **Resend Dashboard:**
   - Go to https://resend.com/emails
   - Check if emails are being sent
   - Look for error messages

### Database Errors

**Error:** "Column does not exist"

**Solution:**
Run missing migration in Supabase SQL Editor:
```sql
-- If metadata column missing:
ALTER TABLE assets ADD COLUMN IF NOT EXISTS metadata JSONB;

-- If rejection_reason missing:
ALTER TABLE assets ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- If approval_remark missing:
ALTER TABLE assets ADD COLUMN IF NOT EXISTS approval_remark TEXT;

-- If client_email missing:
ALTER TABLE assets ADD COLUMN IF NOT EXISTS client_email TEXT;
CREATE INDEX IF NOT EXISTS idx_assets_client_email ON assets(client_email);

-- Reload schema
NOTIFY pgrst, 'reload schema';
```

---

## 📊 Vercel-Specific Considerations

### Environment Variables

**Development vs Production:**
- Set variables for ALL environments (Production, Preview, Development)
- Preview deployments inherit from Production by default

### Function Timeouts

- Hobby plan: 10 second timeout
- Pro plan: 60 second timeout
- File uploads should complete within timeout
- Large files (>50MB) may timeout on Hobby plan

### Cold Starts

- First request after inactivity may be slow (2-5 seconds)
- Subsequent requests are fast
- Normal behavior for serverless functions

### Database Connections

- Next.js API routes don't maintain persistent connections
- Each request creates new Supabase client
- This is normal and expected behavior

---

## ✅ Success Criteria

Your deployment is working correctly if:

1. ✅ Build completes without errors
2. ✅ Landing page loads
3. ✅ Authentication works (magic link login)
4. ✅ Google Drive connection works
5. ✅ Project creation works
6. ✅ Form builder saves to database
7. ✅ Client portal loads and accepts submissions
8. ✅ Files upload to Google Drive
9. ✅ Approval/rejection system works
10. ✅ Email notifications sent successfully
11. ✅ Assets display in dashboard
12. ✅ Activity logs are created

---

## 🎯 Next Steps After Successful Deployment

1. **Custom Domain (Optional):**
   - Vercel Settings → Domains
   - Add your custom domain
   - Update environment variables with new domain
   - Update Google OAuth redirect URI

2. **Monitoring:**
   - Set up Vercel Analytics
   - Monitor function execution times
   - Watch for errors in Vercel logs

3. **Resend Domain (Production):**
   - Add your domain in Resend
   - Configure DNS records
   - Update email sender in `app/api/send-review-notification/route.ts`

4. **Phase 2 Implementation:**
   - Add email input to collection form
   - Implement client portal submission history
   - Add re-upload functionality for rejected files

---

## 📞 Support

**If something doesn't work:**

1. **Check Vercel Logs:**
   - Dashboard → Deployments → Latest Deployment
   - Click "Functions" or "Runtime Logs"

2. **Check Browser Console:**
   - F12 → Console tab
   - Look for red errors

3. **Check Supabase Logs:**
   - Supabase Dashboard → Logs
   - Filter by API or Database

4. **Test Locally First:**
   ```bash
   npm run dev
   ```
   If it works locally but not on Vercel, it's likely an environment variable issue.

---

**Happy Deploying! 🚀**
