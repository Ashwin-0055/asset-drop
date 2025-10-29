import { Asset } from '@/types/database.types'

export interface AssetReviewEmailData {
  projectName: string
  projectId: string
  shareableLink: string
  approved: Array<{
    fileName: string
    remark?: string | null
  }>
  rejected: Array<{
    fileName: string
    reason?: string | null
  }>
}

export function generateAssetReviewEmailHTML(data: AssetReviewEmailData): string {
  const { projectName, approved, rejected, shareableLink } = data

  const approvedCount = approved.length
  const rejectedCount = rejected.length

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asset Review - ${projectName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">AssetDrop</h1>
      <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Asset Review Notification</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">Your Assets Have Been Reviewed</h2>

      <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Your submitted assets for <strong>${projectName}</strong> have been reviewed. Here's the breakdown:
      </p>

      <!-- Summary Box -->
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #059669; font-size: 16px;">
              <strong>✅ Approved:</strong>
            </td>
            <td style="padding: 10px 0; text-align: right; color: #059669; font-size: 20px; font-weight: bold;">
              ${approvedCount}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #dc2626; font-size: 16px;">
              <strong>❌ Rejected:</strong>
            </td>
            <td style="padding: 10px 0; text-align: right; color: #dc2626; font-size: 20px; font-weight: bold;">
              ${rejectedCount}
            </td>
          </tr>
        </table>
      </div>

      ${approvedCount > 0 ? `
      <!-- Approved Assets -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #059669; font-size: 20px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">✅</span> Approved Assets
        </h3>
        <div style="background-color: #ecfdf5; border-left: 4px solid #059669; border-radius: 4px; padding: 20px;">
          ${approved.map(asset => `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #d1fae5;">
              <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 16px;">${asset.fileName}</p>
              ${asset.remark ? `
                <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px; font-style: italic;">
                  💬 "${asset.remark}"
                </p>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${rejectedCount > 0 ? `
      <!-- Rejected Assets -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #dc2626; font-size: 20px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">❌</span> Rejected Assets - Please Re-upload
        </h3>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px; padding: 20px;">
          ${rejected.map(asset => `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #fecaca;">
              <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 16px;">${asset.fileName}</p>
              ${asset.reason ? `
                <div style="margin: 8px 0 0 0; padding: 12px; background-color: #ffffff; border-radius: 4px; border: 1px solid #fecaca;">
                  <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                    <strong>Reason:</strong> ${asset.reason}
                  </p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
            <strong>⚠️ Action Required:</strong> Please upload corrected versions of the rejected files using the link below.
          </p>
        </div>
      </div>
      ` : ''}

      <!-- Re-upload Link -->
      ${rejectedCount > 0 ? `
      <div style="margin: 30px 0; text-align: center;">
        <a href="${shareableLink}"
           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
          Re-upload Rejected Files
        </a>
      </div>
      ` : `
      <div style="margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600;">
          🎉 All your files have been approved! No further action needed.
        </p>
      </div>
      `}

      <!-- Footer Message -->
      <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        If you have any questions about this review, please contact the project owner directly.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
        This is an automated notification from AssetDrop
      </p>
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        Professional Asset Collection & Management
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function generateAssetReviewEmailText(data: AssetReviewEmailData): string {
  const { projectName, approved, rejected, shareableLink } = data

  let text = `Asset Review Complete - ${projectName}\n\n`
  text += `Your submitted assets for "${projectName}" have been reviewed.\n\n`

  // Summary
  text += `SUMMARY:\n`
  text += `✅ Approved: ${approved.length}\n`
  text += `❌ Rejected: ${rejected.length}\n\n`

  // Approved assets
  if (approved.length > 0) {
    text += `✅ APPROVED ASSETS:\n`
    text += `${'='.repeat(50)}\n`
    approved.forEach(asset => {
      text += `- ${asset.fileName}\n`
      if (asset.remark) {
        text += `  Note: ${asset.remark}\n`
      }
    })
    text += `\n`
  }

  // Rejected assets
  if (rejected.length > 0) {
    text += `❌ REJECTED ASSETS - PLEASE RE-UPLOAD:\n`
    text += `${'='.repeat(50)}\n`
    rejected.forEach(asset => {
      text += `- ${asset.fileName}\n`
      if (asset.reason) {
        text += `  Reason: ${asset.reason}\n`
      }
    })
    text += `\n`
    text += `⚠️ ACTION REQUIRED: Please upload corrected versions of the rejected files.\n\n`
    text += `Re-upload here: ${shareableLink}\n\n`
  } else {
    text += `🎉 All your files have been approved! No further action needed.\n\n`
  }

  text += `If you have any questions, please contact the project owner.\n\n`
  text += `---\n`
  text += `This is an automated notification from AssetDrop\n`

  return text
}
