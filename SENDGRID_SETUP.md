# SendGrid Email Setup Guide

## 🎯 Overview

Your app now uses **SendGrid** instead of Resend for email notifications. SendGrid offers 100 free emails per day forever, and unlike Resend, you can send to ANY email address after verifying your sender email - **no domain required!**

## ✅ Benefits of SendGrid

- **100 emails/day free forever** (vs Resend's domain requirement)
- **No domain needed** - just verify your email address
- Send to **any email address** immediately after sender verification
- More reliable delivery rates
- Professional email service used by thousands of companies

## 📋 Quick Setup (5-10 Minutes)

### Step 1: Create SendGrid Account

1. Go to: https://sendgrid.com/
2. Click "Start for Free"
3. Sign up with your email: **hustlerashwin2400@gmail.com**
4. Verify your account via the email SendGrid sends you
5. Complete the onboarding questionnaire

### Step 2: Create API Key

1. Once logged in, go to: https://app.sendgrid.com/settings/api_keys
2. Click "Create API Key"
3. Settings:
   - **Name:** `AssetDrop Production`
   - **API Key Permissions:** Select "Full Access" (or "Restricted Access" with Mail Send permission)
4. Click "Create & View"
5. **IMPORTANT:** Copy the API key immediately (starts with `SG.`)
   - Example: `SG.aBc123dEf456gHi789jKl012mNo345pQr678sT901uVw234xYz567AB890CDeFgH123`
   - You can only see it once!

### Step 3: Verify Sender Email (Single Sender Verification)

**This is the easiest way - no domain needed!**

1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Click "Create New Sender" or "Verify Single Sender"
3. Fill in the form:
   - **From Name:** `AssetDrop` (or your preferred name)
   - **From Email Address:** `hustlerashwin2400@gmail.com` (your email)
   - **Reply To:** `hustlerashwin2400@gmail.com`
   - **Company Address:** (fill in your details)
   - **Nickname:** `AssetDrop Notifications`
4. Click "Create"
5. **Check your email inbox** (hustlerashwin2400@gmail.com)
6. Click the verification link SendGrid sent you
7. Wait for "Verified" status (usually instant)

**✅ That's it! You can now send to ANY email address!**

### Step 4: Add Environment Variables to Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project: **asset-drop**
3. Go to: **Settings → Environment Variables**
4. Add these three variables:

   **Variable 1:**
   - **Key:** `SENDGRID_API_KEY`
   - **Value:** Your API key from Step 2 (e.g., `SG.aBc123...`)
   - **Environment:** Production, Preview, Development (check all three)

   **Variable 2:**
   - **Key:** `SENDGRID_FROM_EMAIL`
   - **Value:** `hustlerashwin2400@gmail.com` (the email you verified in Step 3)
   - **Environment:** Production, Preview, Development (check all three)

   **Variable 3 (Optional):**
   - **Key:** `SENDGRID_FROM_NAME`
   - **Value:** `AssetDrop` (or your preferred sender name)
   - **Environment:** Production, Preview, Development (check all three)

5. Click "Save" for each variable

### Step 5: Deploy

Your code is already updated! Just need to redeploy:

1. The latest commit with SendGrid integration is already pushed to GitHub
2. Vercel will automatically detect the new environment variables
3. Go to: **Vercel Dashboard → Deployments**
4. Either:
   - Wait for the automatic deployment to finish (~2-3 minutes)
   - Or click "Redeploy" to trigger manually

### Step 6: Test Email Sending

1. Go to your app: https://asset-drop.vercel.app
2. Create a test project or use existing one
3. Use the collection form with **ANY email address** (e.g., tools.ashwin@gmail.com)
4. Upload a file
5. Go to dashboard → Approve or Reject the asset
6. Check if email was sent to that address!

**✅ It should work immediately!**

## 🔍 Troubleshooting

### Error: "Sender email not verified"

**Problem:** The SENDGRID_FROM_EMAIL is not verified in SendGrid.

**Solution:**
1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Make sure your email shows "Verified" status (green checkmark)
3. Check your inbox for verification email if pending
4. Make sure SENDGRID_FROM_EMAIL in Vercel matches exactly

### Error: "Email service not configured"

**Problem:** Environment variables are not set in Vercel.

**Solution:**
1. Double-check you added all 3 environment variables (see Step 4)
2. Make sure you selected all environments (Production, Preview, Development)
3. Trigger a new deployment after adding env vars
4. Check Vercel deployment logs for specific error

### Error: "Unauthorized" or "Invalid API Key"

**Problem:** The SENDGRID_API_KEY is incorrect or missing.

**Solution:**
1. Go to: https://app.sendgrid.com/settings/api_keys
2. Create a new API key (you can't view old ones)
3. Update SENDGRID_API_KEY in Vercel with the new key
4. Redeploy

### Emails not being received

**Possible causes:**

1. **Check Spam/Junk folder** - SendGrid emails sometimes go to spam initially
2. **Verify sender email** - Make sure it's verified in SendGrid
3. **Check SendGrid Activity Feed:**
   - Go to: https://app.sendgrid.com/email_activity
   - See if emails are being sent and their status
   - Look for bounces or blocks

4. **Check rate limits:**
   - Free tier: 100 emails/day
   - If exceeded, emails won't send until next day

### SendGrid dashboard shows email sent but not received

1. Check recipient's spam/junk folder
2. Add sender email to recipient's contacts
3. Check SendGrid Activity Feed for delivery status
4. Some email providers (Gmail, Outlook) may delay delivery

## 📊 SendGrid Free Tier Limits

| Feature | Free Tier |
|---------|-----------|
| Emails per day | 100 |
| Sender verification | Unlimited senders |
| API calls | Unlimited |
| Email validation | 100 validations/month |
| Dedicated IP | No (shared IP) |
| Cost | $0 forever |

## 🆚 SendGrid vs Resend Comparison

| Feature | SendGrid (Free) | Resend (Free) |
|---------|-----------------|---------------|
| Emails/month | ~3,000 (100/day) | 3,000 |
| Send to any email | ✅ After email verification | ❌ Requires domain verification |
| Domain requirement | ❌ No | ✅ Yes (for production) |
| Setup time | 5-10 minutes | 30-60 minutes (with domain) |
| Cost | Free forever | Free (limited) |
| Reliability | Enterprise-grade | Good |

**Winner for your use case:** SendGrid (no domain needed!)

## 🚀 Next Steps (Optional Improvements)

### 1. Verify a Custom Domain (Professional emails)

If you later buy a domain and want professional emails like `noreply@assetdrop.com`:

1. Buy a domain (Namecheap, GoDaddy, etc.)
2. Go to: https://app.sendgrid.com/settings/sender_auth/domain
3. Follow SendGrid's domain verification steps
4. Add DNS records to your domain provider
5. Update SENDGRID_FROM_EMAIL to `noreply@yourdomain.com`

### 2. Set Up Email Templates in SendGrid

For more advanced email designs:

1. Go to: https://app.sendgrid.com/dynamic_templates
2. Create dynamic templates with SendGrid's drag-and-drop builder
3. Use template IDs in your code instead of raw HTML

### 3. Monitor Email Analytics

Track email performance:

1. Go to: https://app.sendgrid.com/statistics
2. See open rates, click rates, bounces, etc.
3. Monitor delivery success

### 4. Set Up Email Suppressions

Manage bounces and unsubscribes:

1. Go to: https://app.sendgrid.com/suppressions
2. View blocked emails
3. Manage suppression lists

## 📞 Support

- SendGrid Documentation: https://docs.sendgrid.com
- SendGrid Support: https://support.sendgrid.com
- SendGrid Community: https://community.sendgrid.com
- API Reference: https://docs.sendgrid.com/api-reference

## 🎉 You're All Set!

Once you complete the 6 steps above, your email notifications will work perfectly for **ANY email address** - no domain required! Just verify your sender email in SendGrid and you're good to go.

Total setup time: **5-10 minutes** ⏱️

Enjoy! 🚀
