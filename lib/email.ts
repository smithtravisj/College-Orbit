import { Resend } from 'resend';
import crypto from 'crypto';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'College Orbit';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Create Resend instance only if API key is available
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set - email sending will fail');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Generate a secure token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiry: Date): boolean {
  return new Date() > new Date(expiry);
}

/**
 * Get password reset token expiry date (1 hour from now)
 */
export function getResetTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
}

interface SendPasswordResetEmailParams {
  email: string;
  name: string | null;
  token: string;
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: SendPasswordResetEmailParams): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const displayName = name || 'there';

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
                    College Orbit
                  </p>
                  <h1 style="margin: 0; color: #fafafa; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">
                    Reset Your Password
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px 0;">Hi ${displayName},</p>
                  <p style="margin: 0 0 24px 0;">
                    We received a request to reset your password for College Orbit.
                    Click the button below to set a new password:
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${resetUrl}"
                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                                  color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                                  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #8b5cf6; word-break: break-all;">
                      ${resetUrl}
                    </a>
                  </p>

                  <p style="margin: 20px 0 0 0; font-size: 14px; color: #71717a;">
                    This link will expire in 1 hour.
                  </p>

                  <p style="margin: 20px 0 0 0; font-size: 14px; color: #71717a;">
                    If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
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

  const textContent = `
Hi ${displayName},

We received a request to reset your password for College Orbit. Click the link below to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.

College Orbit © ${new Date().getFullYear()}
  `.trim();

  try {
    const resend = getResend();
    if (!resend) {
      throw new Error('Resend API key not configured');
    }

    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Reset your password',
      html: htmlContent,
      text: textContent,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * For development/testing - logs password reset email instead of sending
 */
export async function sendPasswordResetEmailDev({
  email,
  name,
  token,
}: SendPasswordResetEmailParams): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  console.log('=================================');
  console.log('PASSWORD RESET EMAIL (DEV MODE)');
  console.log('=================================');
  console.log(`To: ${email}`);
  console.log(`Name: ${name || 'N/A'}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log('=================================');
}

interface SendPasswordChangedEmailParams {
  email: string;
  name: string | null;
}

/**
 * Send password changed confirmation email to user
 */
export async function sendPasswordChangedEmail({
  email,
  name,
}: SendPasswordChangedEmailParams): Promise<void> {
  const displayName = name || 'there';

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
                    College Orbit
                  </p>
                  <h1 style="margin: 0; color: #fafafa; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">
                    Password Changed
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px 0;">Hi ${displayName},</p>
                  <p style="margin: 0 0 20px 0;">
                    This is a confirmation that your password for College Orbit has been successfully changed.
                  </p>

                  <p style="margin: 20px 0 0 0; font-size: 14px; color: #71717a;">
                    If you didn't make this change, please contact us immediately at
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

  const textContent = `
Hi ${displayName},

This is a confirmation that your password for College Orbit has been successfully changed.

If you didn't make this change, please contact us immediately.

College Orbit © ${new Date().getFullYear()}
  `.trim();

  try {
    const resend = getResend();
    if (!resend) {
      throw new Error('Resend API key not configured');
    }

    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Your password has been changed',
      html: htmlContent,
      text: textContent,
    });
    console.log(`Password changed confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send password changed email');
  }
}

/**
 * For development/testing - logs password changed confirmation email instead of sending
 */
export async function sendPasswordChangedEmailDev({
  email,
  name,
}: SendPasswordChangedEmailParams): Promise<void> {
  console.log('=================================');
  console.log('PASSWORD CHANGED EMAIL (DEV MODE)');
  console.log('=================================');
  console.log(`To: ${email}`);
  console.log(`Name: ${name || 'N/A'}`);
  console.log('=================================');
}
