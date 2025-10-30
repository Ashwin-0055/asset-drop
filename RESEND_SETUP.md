# Resend Email Setup Guide

## Current Status
Your app is using Resend's test mode with `onboarding@resend.dev`. This only allows sending emails to your registered Resend email address: **hustlerashwin2400@gmail.com**

## To Send Emails to Any Address

### Step 1: Verify a Domain

1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `assetdrop.com`, or any domain you own)
4. Resend will provide DNS records to add:
   - **MX Record** (for receiving email)
   - **TXT Record** (for SPF authentication)
   - **CNAME Record** (for DKIM authentication)

### Step 2: Add DNS Records

#### If using Vercel Domain:
1. Go to your Vercel project → Settings → Domains
2. Click on your domain → DNS Records
3. Add the records provided by Resend

#### If using another domain provider (Namecheap, GoDaddy, etc.):
1. Log into your domain provider
2. Find DNS Management or DNS Settings
3. Add the records provided by Resend

### Step 3: Wait for Verification

- Usually takes 5-15 minutes
- Sometimes up to 48 hours depending on DNS propagation
- Check status at https://resend.com/domains

### Step 4: Update the Code

Once verified, update the "from" email in:

**File:** `app/api/send-review-notification/route.ts`

**Line 138:** Change from:
```typescript
from: 'AssetDrop <onboarding@resend.dev>',
```

To:
```typescript
from: 'AssetDrop <noreply@yourdomain.com>',
```

Replace `yourdomain.com` with your verified domain.

### Step 5: Deploy

1. Commit and push the changes
2. Vercel will auto-deploy
3. Test by approving/rejecting an asset and sending email to any address

## Recommended "From" Addresses

- `noreply@yourdomain.com` - Standard for automated emails
- `notifications@yourdomain.com` - For notification emails
- `assetdrop@yourdomain.com` - Branded option
- `hello@yourdomain.com` - Friendly option

## Alternative: Free Domains for Testing

If you don't have a domain yet, you can:

1. **Use a subdomain from Vercel:**
   - Your Vercel project likely has: `your-project.vercel.app`
   - Can't verify *.vercel.app domains (Vercel restriction)

2. **Get a free domain:**
   - Freenom (free domains like .tk, .ml)
   - Use Cloudflare for DNS (faster propagation)

3. **Buy a cheap domain:**
   - Namecheap: ~$1-5/year for .xyz, .site domains
   - Porkbun: Similar prices

## Troubleshooting

### Email still not sending after verification:
1. Check DNS records are correct at https://resend.com/domains
2. Verify status shows "Verified" (green checkmark)
3. Make sure you updated the code with the correct domain
4. Check Vercel logs for errors
5. Try sending to your own email first

### DNS verification taking too long:
1. Check DNS propagation: https://dnschecker.org
2. Make sure you added ALL required records (MX, TXT, CNAME)
3. Wait up to 48 hours for full propagation
4. Contact Resend support if still failing

## Testing Before Verification

For now, emails will only work when sent to: **hustlerashwin2400@gmail.com**

To test:
1. Create a project
2. Use your form with `hustlerashwin2400@gmail.com` as the client email
3. Upload files
4. Approve/reject assets
5. Check your inbox for the review email

## Support

- Resend Documentation: https://resend.com/docs
- Resend Discord: https://resend.com/discord
- Resend Support: support@resend.com
