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

AssetDrop automatically keeps services active using **Vercel Cron Jobs** (100% free).

### How It Works

```
Every 5 days → Vercel triggers /api/health-check → Pings services → All stay active
```

**Services kept active:**
1. ✅ Supabase - Simple database query every 5 days
2. ✅ SendGrid - Test email sent once per month
3. ✅ Google Drive - Guidance on OAuth publishing

**Cost:** $0 (Vercel Cron Jobs are free on all plans)

---

## 🛠️ Setup Instructions

### 1. Add Cron Secret to Vercel (Recommended)

This prevents unauthorized access to your health check endpoint.

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add a new variable:
   ```
   Key: CRON_SECRET
   Value: <generate a random string>
   ```

**Generate a secure secret:**
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use any random string generator
```

4. Click **Save**
5. Redeploy your project

### 2. Deploy Your Project

The cron job is configured in `vercel.json` and will activate automatically when you deploy:

```bash
git add .
git commit -m "Add automated health checks"
git push
```

Vercel will detect `vercel.json` and set up the cron job automatically.

### 3. Verify Cron Job Setup

1. Go to your Vercel project dashboard
2. Navigate to **Cron Jobs** tab (in the left sidebar)
3. You should see:
   ```
   Path: /api/health-check
   Schedule: 0 0 */5 * * (Every 5 days at midnight UTC)
   Status: Active ✓
   ```

### 4. Test Manually (Optional)

You can test the health check manually:

```bash
# Without auth (if CRON_SECRET not set)
curl https://your-app.vercel.app/api/health-check

# With auth (if CRON_SECRET is set)
curl https://your-app.vercel.app/api/health-check \
  -H "Authorization: Bearer your_cron_secret"
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

### Check Cron Job Logs

1. Go to Vercel dashboard
2. Navigate to **Deployments → [Your latest deployment] → Functions**
3. Find `/api/health-check` in the list
4. Click to view logs of recent executions

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

**Check 1: Is vercel.json committed?**
```bash
git log --all --full-history -- vercel.json
```

**Check 2: Did you deploy after adding vercel.json?**
Cron jobs only activate after deployment.

**Check 3: Check Vercel dashboard**
Go to **Cron Jobs** tab and verify status is "Active"

### Health check endpoint returns 401

**Cause:** CRON_SECRET is set in Vercel, but the header isn't matching

**Solution:** Vercel automatically adds the Authorization header. If testing manually:
```bash
curl https://your-app.vercel.app/api/health-check \
  -H "Authorization: Bearer YOUR_ACTUAL_CRON_SECRET"
```

### Supabase still paused

**Possible causes:**
1. Cron job isn't running (check logs)
2. Supabase connection failed (check health check response)
3. Project was manually paused in Supabase dashboard

**Solution:** Manually unpause in Supabase dashboard, then verify cron job is working.

### Not receiving monthly emails

**Check:**
1. Is `SENDGRID_FROM_EMAIL` set correctly in Vercel?
2. Is the email verified in SendGrid?
3. Check spam folder
4. Check health check response - does it say "Test email sent successfully"?

---

## 📅 Schedule Details

The cron schedule `0 0 */5 * *` means:
- **Minute:** 0 (at the start of the hour)
- **Hour:** 0 (midnight)
- **Day:** */5 (every 5 days)
- **Month:** * (every month)
- **Day of week:** * (any day)

**In plain English:** Every 5 days at midnight UTC

**Why every 5 days?**
- Supabase pauses after 7 days → 5 days provides 2-day buffer
- Not too frequent (saves function invocations)
- Frequent enough to keep everything active

---

## 💰 Cost Analysis

| Service | Free Tier Limit | Our Usage | Cost |
|---------|----------------|-----------|------|
| **Vercel Cron Jobs** | Unlimited on Hobby plan | 1 job every 5 days (~6/month) | **$0** |
| **Vercel Function Invocations** | 100,000/month | ~6/month | **$0** |
| **SendGrid Emails** | 100/day free | 1/month | **$0** |
| **Supabase Database** | 500 MB free | Tiny query every 5 days | **$0** |

**Total monthly cost: $0**

---

## 🚀 Alternatives Considered

### Why not paid plans?

| Approach | Cost | Pros | Cons |
|----------|------|------|------|
| **Supabase Pro** | $25/month | Never pauses, better performance | Expensive for small projects |
| **UptimeRobot** | Free | External monitoring | Requires external service |
| **GitHub Actions** | Free | Can run cron jobs | More complex setup |
| **Our solution** | **$0/month** | ✅ Fully automated<br>✅ Zero maintenance<br>✅ Built-in | None! |

---

## 📝 Summary

✅ **Setup:** Add CRON_SECRET to Vercel, deploy
✅ **Automation:** Runs every 5 days automatically
✅ **Cost:** $0 (completely free)
✅ **Maintenance:** Zero manual work required
✅ **Reliability:** Prevents all service pauses

Your AssetDrop will stay active indefinitely, even during long periods of inactivity.

---

## 🆘 Need Help?

**Contact:** hustlerashwin2400@gmail.com

**Useful links:**
- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs)
- [Supabase Pricing](https://supabase.com/pricing)
- [SendGrid Account Health](https://docs.sendgrid.com/ui/account-and-settings/account)
