import { Resend } from 'resend';
import crypto from 'crypto';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'BYU Survival Tool';
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
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                    Reset Your Password
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px 0;">Hi ${displayName},</p>
                  <p style="margin: 0 0 20px 0;">
                    We received a request to reset your password for College Survival Tool.
                    Click the button below to set a new password:
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${resetUrl}"
                           style="display: inline-block; padding: 16px 32px; background-color: #002E5D; color: #ffffff;
                                  text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 20px 0 0 0; font-size: 14px; color: #718096;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #002E5D; word-break: break-all;">
                      ${resetUrl}
                    </a>
                  </p>

                  <p style="margin: 20px 0 0 0; font-size: 14px; color: #718096;">
                    This link will expire in 1 hour.
                  </p>

                  <p style="margin: 20px 0 0 0; font-size: 14px; color: #718096;">
                    If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;
                           text-align: center; color: #718096; font-size: 13px; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0;">
                    College Survival Tool &copy; ${new Date().getFullYear()}
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

We received a request to reset your password for College Survival Tool. Click the link below to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.

College Survival Tool © ${new Date().getFullYear()}
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
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                    Password Changed
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px 0;">Hi ${displayName},</p>
                  <p style="margin: 0 0 20px 0;">
                    This is a confirmation that your password for College Survival Tool has been successfully changed.
                  </p>

                  <p style="margin: 20px 0 0 0; font-size: 14px; color: #718096;">
                    If you didn't make this change, please contact us immediately.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;
                           text-align: center; color: #718096; font-size: 13px; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0;">
                    College Survival Tool &copy; ${new Date().getFullYear()}
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

This is a confirmation that your password for College Survival Tool has been successfully changed.

If you didn't make this change, please contact us immediately.

College Survival Tool © ${new Date().getFullYear()}
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
