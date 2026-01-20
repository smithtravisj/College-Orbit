// Run with: node scripts/test-welcome-email.mjs
import { Resend } from 'resend';
import { config } from 'dotenv';
config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@collegeorbit.app';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'College Orbit';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://collegeorbit.app';

const testEmail = process.argv[2] || 'collegeorbit.test@passmail.net';
const testName = process.argv[3] || 'Test User';
const loginUrl = `${APP_URL}/login`;

const htmlContent = `
<!DOCTYPE html>
<html style="margin: 0; padding: 0; background-color: #0a0a0b;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0a0a0b;" bgcolor="#0a0a0b">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0b;" bgcolor="#0a0a0b">
    <tr>
      <td align="center" style="padding: 40px 20px;" bgcolor="#0a0a0b">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="background-color: #111113; border-radius: 20px; border: 1px solid #252528;" bgcolor="#111113">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;" bgcolor="#111113">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #8b5cf6; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">
                Welcome to
              </p>
              <h1 style="margin: 0; color: #fafafa; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">
                College Orbit
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
              <p style="margin: 0 0 20px 0;">Hi ${testName},</p>
              <p style="margin: 0 0 24px 0;">
                Thanks for signing up! College Orbit is here to help you stay organized throughout your college journey.
              </p>

              <p style="margin: 0 0 16px 0; color: #fafafa; font-weight: 600;">
                Here's what you can do:
              </p>
              <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #a1a1aa;">
                <li style="margin-bottom: 8px;">Track your tasks and deadlines</li>
                <li style="margin-bottom: 8px;">Manage your course schedule</li>
                <li style="margin-bottom: 8px;">Prepare for exams with reminders</li>
                <li style="margin-bottom: 8px;">Calculate and track your GPA</li>
              </ul>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${loginUrl}"
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                              color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                              box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                        Get Started
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
                If you have any questions, just reply to this email or reach out at
                <a href="mailto:collegeorbit@protonmail.com" style="color: #8b5cf6;">collegeorbit@protonmail.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #0f0f11; border-top: 1px solid #252528;
                       text-align: center; color: #71717a; font-size: 13px; border-radius: 0 0 20px 20px;">
              <p style="margin: 0;">
                College Orbit &copy; ${new Date().getFullYear()}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

console.log(`Sending welcome email to: ${testEmail}`);
console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`);

try {
  const result = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: testEmail,
    subject: 'Welcome to College Orbit!',
    html: htmlContent,
  });
  console.log('Email sent successfully!', result);
} catch (error) {
  console.error('Failed to send email:', error);
}
