# Email Notifications Feature - Setup Guide

## 🎯 Overview

This feature enables automatic email notifications to clients when you approve or reject their uploaded assets. Clients receive professional emails with:
- ✅ List of approved assets with optional remarks
- ❌ List of rejected assets with reasons
- 📧 Direct link to re-upload rejected files

## 📋 What's Implemented (Phase 1)

### ✅ Completed
1. **Database Changes**
   - Added `approval_remark` column to assets table
   - Added `client_email` column to assets table
   - Migration file: `004_add_approval_remarks_and_email.sql`

2. **Email Infrastructure**
   - Installed Resend email service
   - Professional HTML email templates
   - Plain text fallback
   - Email sending API route

3. **Approval/Rejection UI**
   - Approval dialog with optional remark field
   - Rejection dialog with optional reason field
   - Visual display of remarks/reasons on assets
   - Automatic email sending after approve/reject

4. **Email Templates**
   - Beautiful HTML design with gradient headers
   - Responsive layout
   - Color-coded sections (green for approved, red for rejected)
   - Professional branding

### ⏳ Remaining (Phase 2 - To Be Implemented)
1. Collection form email input field
2. Update upload API to store client email
3. Client portal submission history display
4. Re-upload functionality for rejected files

## 🔧 Setup Instructions

### Step 1: Run Database Migration

**Option A: Supabase SQL Editor (Recommended)**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy contents of `supabase/migrations/004_add_approval_remarks_and_email.sql`
4. Paste and click **Run**

**Option B: Use Script**
```bash
# Coming soon - migration script
```

### Step 2: Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for FREE account (100 emails/day free forever)
3. Verify your email
4. Go to **API Keys** section
5. Click **Create API Key**
6. Copy the key (starts with `re_...`)

### Step 3: Configure Environment Variables

Add to your `.env.local`:
```bash
# Email Configuration
RESEND_API_KEY=re_your_actual_api_key_here

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your domain in production
```

### Step 4: Domain Setup (Production Only)

For production emails to work properly:

1. **Add Your Domain in Resend**
   - Go to Resend Dashboard → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `yourdomain.com`)
   - Follow DNS configuration instructions

2. **Update Email Sender**
   - Open `app/api/send-review-notification/route.ts`
   - Find line with `from: 'AssetDrop <noreply@assetdrop.app>'`
   - Change to: `from: 'AssetDrop <noreply@yourdomain.com>'`

**For Development:**
- Resend provides a test domain
- Emails work but may go to spam
- Use your own email for testing

### Step 5: Restart Your Server

```bash
npm run dev
```

## 🧪 Testing the Feature

### Test Without Client Email (Current Limitation)
Since Phase 2 isn't complete, you can test by manually adding client_email:

1. **Via Supabase Dashboard:**
   - Go to Table Editor → assets
   - Find a test asset
   - Add a value to `client_email` column (your email)
   - Add a value to `approval_remark` or `rejection_reason`

2. **Test Approve/Reject:**
   - Go to project Assets tab
   - Click Approve → Add remark → Approve
   - OR Click Reject → Add reason → Reject
   - Check your email!

### Expected Email Flow (Full Implementation)
```
1. Client visits /collect/xyz
   ↓
2. Client enters email + uploads files
   ↓
3. You review in dashboard
   ↓
4. Click Approve/Reject → Add remark/reason
   ↓
5. Email sent automatically to client
   ↓
6. Client receives professional email notification
```

## 📧 Email Preview

```
Subject: Asset Review Complete - [Project Name]

┌──────────────────────────────────────┐
│        AssetDrop                     │
│    Asset Review Notification         │
├──────────────────────────────────────┤
│                                      │
│ Your Assets Have Been Reviewed       │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ✅ Approved: 3                   │ │
│ │ ❌ Rejected: 1                   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ✅ APPROVED ASSETS                  │
│ • logo.png                           │
│   💬 "Perfect! Using for website"   │
│ • banner.jpg                         │
│ • video.mp4                          │
│                                      │
│ ❌ REJECTED ASSETS - RE-UPLOAD      │
│ • icon.svg                           │
│   Reason: Need PNG format, not SVG  │
│                                      │
│    [Re-upload Rejected Files]        │
│                                      │
└──────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Emails Not Sending?

1. **Check Console Logs:**
   ```
   📧 Sending review notification to...
   ✅ Email sent successfully
   ```

2. **Verify API Key:**
   ```bash
   # Check if key is set
   echo $RESEND_API_KEY
   ```

3. **Check Resend Dashboard:**
   - Go to Resend → Logs
   - See if emails are being sent
   - Check for errors

### Common Issues

**Error: "Email service not configured"**
- Solution: Add `RESEND_API_KEY` to `.env.local`
- Restart dev server

**Error: "No reviewed assets found"**
- Solution: Asset must have status 'approved' or 'rejected'
- Client email must exist in asset record

**Emails going to spam:**
- Normal in development with test domain
- In production, configure your own domain in Resend
- Add SPF/DKIM records as instructed by Resend

## 📝 Files Changed

### New Files
- `supabase/migrations/004_add_approval_remarks_and_email.sql`
- `lib/email/resend.ts`
- `lib/email/templates.tsx`
- `app/api/send-review-notification/route.ts`
- `FEATURE_EMAIL_NOTIFICATIONS.md` (this file)

### Modified Files
- `components/project/assets-tab.tsx`
- `types/database.types.ts`
- `.env.example`
- `package.json` (added resend dependency)

## 🚀 Next Steps (Phase 2)

To complete the feature:

1. **Collection Form Updates:**
   - Add required email input field
   - Store email with each asset upload
   - Update upload API to save client_email

2. **Client Portal Enhancements:**
   - Show previous submissions with status
   - Display approval remarks/rejection reasons
   - Allow re-upload of rejected files
   - Keep history of submissions

3. **Batch Notifications:**
   - Option to review multiple assets
   - Send one email for all reviews
   - "Send Review Email" button

Would you like me to implement Phase 2 next?

## 💡 Tips

- **Professional Tone:** Write clear, helpful remarks/reasons
- **Be Specific:** "Image resolution too low (need 1920x1080)" vs "Bad quality"
- **Positive Notes:** Use approval remarks to encourage good work
- **Quick Actions:** Remarks are optional, can approve/reject quickly
- **Email Timing:** Emails sent immediately after approve/reject

## 📊 Benefits

✅ **Automated Communication:** No manual emails needed
✅ **Professional Image:** Polished, branded emails
✅ **Clear Feedback:** Clients know exactly what to fix
✅ **Efficient Workflow:** Re-upload link included
✅ **Audit Trail:** All remarks stored in database
✅ **Optional Remarks:** Quick approve/reject still possible

---

**Need Help?** Check the console logs for detailed error messages or contact support.
