# 🏥 Keep Services Active Guide

This guide explains how AssetDrop stays active automatically, preventing service pauses during periods of inactivity.

---

## 🚨 The Problem

When your app is unused for weeks/months, free-tier services can pause or deactivate:

| Service | Free Tier Issue | Consequence |
|---------|----------------|-------------|
| **Supabase** | Pauses after 7 days of inactivity | Database becomes unavailable |
| **SendGrid** | Can deactivate after 6+ months unused | Email sending stops working |
| **Google OAuth** | Tokens expire if not refreshed | Users can't connect Drive |

**Result:** Your app breaks when you (or a client) try to use it after months.

---

## ✅ The Solution: Automated Health Checks

AssetDrop automatically keeps services active using **cron-job.org** (100% free external service).

### How It Works

```
Every 5 days → cron-job.org triggers /api/health-check → Pings services → All stay active
```

**Services kept active:**
1. ✅ Supabase - Simple database query every 5 days
2. ✅ SendGrid - Test email sent once per month
3. ✅ Google Drive - Guidance on OAuth publishing

**Cost:** $0 (cron-job.org free plan allows unlimited cron jobs)

---

## 🛠️ Setup Instructions

### Step 1: Deploy Your Project

First, make sure your health check endpoint is deployed:

```bash
git push
```

Wait for Vercel to finish deploying. Your health check will be available at:
```
https://your-app.vercel.app/api/health-check
```

### Step 2: Set Up Free Cron Service

We'll use **cron-job.org** (100% free, unlimited jobs, no credit card required).

**Why cron-job.org?**
- ✅ Completely free forever
- ✅ Unlimited cron jobs
- ✅ Reliable (99.9% uptime)
- ✅ No credit card required
- ✅ Simple setup (2 minutes)

### Step 3: Create cron-job.org Account

1. Go to **https://cron-job.org**
2. Click **Sign up** (top right)
3. Enter your email and create a password
4. Verify your email (check inbox)
5. Log in

### Step 4: Create the Cron Job

1. Click **"Cronjobs"** in the top menu
2. Click **"Create cronjob"** button
3. Fill in the form:

**Settings:**
```
Title: AssetDrop Health Check
URL: https://your-app.vercel.app/api/health-check
Schedule: Every 5 days

Enabled: ✓ (checked)
Save responses: ✓ (optional, helps with debugging)
```

**Schedule Details:**
- Click **"Every x days"**
- Enter **5** days
- Time: **00:00** (midnight)

4. Click **"Create cronjob"**

### Step 5: Test Immediately

1. In the cronjob list, find your **"AssetDrop Health Check"**
2. Click the **▶️ Play** button to run it immediately
3. Wait 5-10 seconds
4. Check the **"Last execution"** column:
   - ✅ **Green checkmark** = Working!
   - ❌ **Red X** = Something's wrong (check logs)

### Step 6: Verify It Worked

**Option A: Check cron-job.org logs**
1. Click on your cronjob name
2. Go to **"History"** tab
3. You should see the response with status **200**

**Option B: Check your email**
- If it's been 30+ days since last test email, you'll receive a health check email from SendGrid
- Check your verified SendGrid email inbox

**Option C: Test manually**
```bash
curl https://your-app.vercel.app/api/health-check
```

**Expected response:**
```json
{
  "timestamp": "2025-01-31T12:00:00.000Z",
  "services": {
    "supabase": {
      "status": "healthy",
      "message": "Database connection successful",
      "responseTime": 142
    },
    "sendgrid": {
      "status": "healthy",
      "message": "Skipped (last email sent 2 days ago)",
      "nextEmailIn": "28 days"
    },
    "googleDrive": {
      "status": "info",
      "message": "OAuth tokens refresh automatically on use..."
    }
  },
  "success": true,
  "totalTime": 156
}
```

### Optional: Add CRON_SECRET (Extra Security)

If you want to prevent unauthorized access:

1. Generate a secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add to Vercel environment variables:
   - Go to Vercel dashboard → **Settings → Environment Variables**
   - Add `CRON_SECRET` = `<your generated secret>`
   - Redeploy

3. Update cron-job.org:
   - Edit your cronjob
   - Click **"Request headers"**
   - Add header:
     ```
     Authorization: Bearer <your generated secret>
     ```
   - Save

**Note:** This is optional. The health check endpoint is safe to leave public.

---

## 📧 Monthly Health Check Emails

You'll receive an email **once per month** to your SendGrid verified email:

**Subject:** ✅ AssetDrop Health Check - All Systems Active

This email:
- ✅ Keeps your SendGrid account active
- 📊 Shows status of all services
- 🔔 Alerts you if something is wrong

**Example email:**

```
✅ AssetDrop Health Check
All systems are active and healthy!

Status Report
📅 Date: January 31, 2025, 12:00:00 AM
🗄️ Supabase: healthy
📧 SendGrid: Active ✓
☁️ Google Drive: Ready ✓

No action required.
```

---

## 🔐 Security

### Cron Secret Protection

The `CRON_SECRET` prevents anyone from triggering your health check endpoint:

**Without secret:** Anyone can call `/api/health-check` (minor security risk)
**With secret:** Only Vercel cron jobs with the correct Bearer token can call it

### How It Works

```typescript
// In app/api/health-check/route.ts
const authHeader = request.headers.get('authorization')
const cronSecret = process.env.CRON_SECRET

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Vercel automatically adds the `Authorization` header to cron job requests.

---

## 🌐 Google OAuth Setup (Important!)

To prevent Google Drive OAuth token expiry issues:

### Publish Your OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services → OAuth consent screen**
4. Click **Publish App**
5. Choose **Internal** (if using Google Workspace) or **External**

**Why this matters:**
- **Testing mode:** Tokens expire after 7 days → Users must reconnect frequently
- **Published mode:** Refresh tokens work indefinitely → No reconnection needed

---

## 📊 Monitoring

### Check Cron Job Status

1. Log in to **cron-job.org**
2. Go to **"Cronjobs"** tab
3. View your **"AssetDrop Health Check"** cronjob
4. Check the status:
   - ✅ **Green** = Last execution successful
   - ❌ **Red** = Last execution failed
   - **"Last execution"** column shows when it last ran
   - **"Next execution"** shows when it runs next

### View Execution History

1. Click on your cronjob name in cron-job.org
2. Go to **"History"** tab
3. See all past executions with:
   - Timestamp
   - HTTP status code (200 = success)
   - Response body (the health check JSON)
   - Execution time

### Check Health Check Logs in Supabase

AssetDrop stores health check email timestamps in the `health_check_logs` table:

```sql
SELECT * FROM health_check_logs
ORDER BY email_sent_at DESC;
```

This helps track when test emails were sent.

---

## 🔧 Troubleshooting

### Cron job not running

**Check 1: Is the cronjob enabled?**
1. Log in to cron-job.org
2. Check that your cronjob has ✓ **Enabled** checkbox checked
3. If disabled, click **Edit** and enable it

**Check 2: Check execution history**
1. Click on your cronjob name
2. Go to **"History"** tab
3. If no executions show, try clicking **▶️ Play** to run manually

**Check 3: Check cron-job.org account verification**
Make sure you verified your email when signing up to cron-job.org

### Health check endpoint returns 401

**Cause:** CRON_SECRET is set in Vercel, but cron-job.org isn't sending the header

**Solution:** Add the Authorization header to cron-job.org:
1. Edit your cronjob
2. Scroll to **"Request headers"**
3. Add header:
   ```
   Authorization: Bearer YOUR_ACTUAL_CRON_SECRET
   ```
4. Save

Or disable CRON_SECRET if you don't need it (health check is safe to leave public)

### Supabase still paused

**Possible causes:**
1. Cron job isn't running (check cron-job.org history)
2. Supabase connection failed (check health check response in cron-job.org logs)
3. Project was manually paused in Supabase dashboard

**Solution:** Manually unpause in Supabase dashboard, then verify cron job is working in cron-job.org.

### Not receiving monthly emails

**Check:**
1. Is `SENDGRID_FROM_EMAIL` set correctly in Vercel?
2. Is the email verified in SendGrid?
3. Check spam folder
4. Check health check response - does it say "Test email sent successfully"?

---

## 📅 Schedule Details

Your cron job is set to **"Every 5 days at midnight (00:00)"**

**Why every 5 days?**
- Supabase pauses after 7 days of inactivity → 5 days provides 2-day safety buffer
- Not too frequent (reduces unnecessary API calls)
- Frequent enough to keep all services active
- Emails sent only once per month (not every 5 days)

**When does it run?**
- First run: Immediately after you click ▶️ Play button
- Subsequent runs: Every 5 days from the first run
- Time: Midnight (00:00) in your timezone (set in cron-job.org account)

---

## 💰 Cost Analysis

| Service | Free Tier Limit | Our Usage | Cost |
|---------|----------------|-----------|------|
| **cron-job.org** | Unlimited cron jobs | 1 job every 5 days (~6/month) | **$0** |
| **Vercel Function Invocations** | 100,000/month | ~6/month | **$0** |
| **SendGrid Emails** | 100/day free | 1/month | **$0** |
| **Supabase Database** | 500 MB free | Tiny query every 5 days | **$0** |

**Total monthly cost: $0**

**Why this works:**
- cron-job.org free plan = unlimited cron jobs forever
- No credit card required
- No upgrade pressure
- Reliable service since 2007

---

## 🚀 Alternatives Considered

| Approach | Cost | Pros | Cons |
|----------|------|------|------|
| **Vercel Cron Jobs** | $0 (but limited) | Built into Vercel | Only 2 free cron jobs total |
| **Supabase Pro** | $25/month | Never pauses, better performance | Expensive for small projects |
| **UptimeRobot** | Free (50 monitors) | Reliable, popular | 5-minute minimum interval |
| **GitHub Actions** | Free | Built into GitHub | More complex setup, rate limits |
| **EasyCron** | Free (limited) | Simple interface | Only 1 job on free plan |
| **cron-job.org** | **$0/month** | ✅ Unlimited jobs<br>✅ Reliable (99.9%)<br>✅ Simple setup<br>✅ No card needed | Requires separate account |

**Winner:** cron-job.org for its unlimited free jobs and reliability.

---

## 📝 Summary

✅ **Setup:** 2 minutes to create cron-job.org account and configure
✅ **Automation:** Runs every 5 days automatically
✅ **Cost:** $0 (completely free forever)
✅ **Maintenance:** Zero manual work required
✅ **Reliability:** 99.9% uptime, prevents all service pauses

Your AssetDrop will stay active indefinitely, even during long periods of inactivity.

---

## 🎯 Quick Setup Checklist

- [ ] Deploy AssetDrop to Vercel
- [ ] Create account on cron-job.org
- [ ] Create cronjob pointing to your /api/health-check endpoint
- [ ] Set schedule to "Every 5 days"
- [ ] Click ▶️ Play to test immediately
- [ ] Verify green checkmark in execution history
- [ ] Done! Services will stay active automatically

---

## 🆘 Need Help?

**Contact:** hustlerashwin2400@gmail.com

**Useful links:**
- [cron-job.org](https://cron-job.org) - Free cron service
- [cron-job.org Documentation](https://console.cron-job.org/documentation)
- [Supabase Pricing](https://supabase.com/pricing)
- [SendGrid Account Health](https://docs.sendgrid.com/ui/account-and-settings/account)
