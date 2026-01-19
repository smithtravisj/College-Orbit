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

interface SendWelcomeEmailParams {
  email: string;
  name: string | null;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail({
  email,
  name,
}: SendWelcomeEmailParams): Promise<void> {
  const displayName = name || 'there';
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
                  <p style="margin: 0 0 20px 0;">Hi ${displayName},</p>
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

  const textContent = `
Hi ${displayName},

Thanks for signing up for College Orbit! We're here to help you stay organized throughout your college journey.

Here's what you can do:
- Track your tasks and deadlines
- Manage your course schedule
- Prepare for exams with reminders
- Calculate and track your GPA

Get started: ${loginUrl}

If you have any questions, just reply to this email or reach out at collegeorbit@protonmail.com

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
      subject: 'Welcome to College Orbit!',
      html: htmlContent,
      text: textContent,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send welcome email');
  }
}

/**
 * For development/testing - logs welcome email instead of sending
 */
export async function sendWelcomeEmailDev({
  email,
  name,
}: SendWelcomeEmailParams): Promise<void> {
  console.log('=================================');
  console.log('WELCOME EMAIL (DEV MODE)');
  console.log('=================================');
  console.log(`To: ${email}`);
  console.log(`Name: ${name || 'N/A'}`);
  console.log(`Login URL: ${APP_URL}/login`);
  console.log('=================================');
}

interface SendSubscriptionEmailParams {
  email: string;
  name: string | null;
  plan: 'monthly' | 'yearly';
}

/**
 * Send subscription started email
 */
export async function sendSubscriptionStartedEmail({
  email,
  name,
  plan,
}: SendSubscriptionEmailParams): Promise<void> {
  const displayName = name || 'there';
  const planLabel = plan === 'yearly' ? 'Yearly' : 'Monthly';
  const price = plan === 'yearly' ? '$40/year' : '$5/month';

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
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #f59e0b; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">
                    College Orbit Premium
                  </p>
                  <h1 style="margin: 0; color: #fafafa; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">
                    Welcome to Premium!
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px 0;">Hi ${displayName},</p>
                  <p style="margin: 0 0 24px 0;">
                    Thank you for subscribing to College Orbit Premium! Your ${planLabel} plan (${price}) is now active.
                  </p>

                  <p style="margin: 0 0 16px 0; color: #fafafa; font-weight: 600;">
                    You now have access to:
                  </p>
                  <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #a1a1aa;">
                    <li style="margin-bottom: 8px;">Full Calendar view</li>
                    <li style="margin-bottom: 8px;">Shopping lists & Pantry tracking</li>
                    <li style="margin-bottom: 8px;">Unlimited notes and courses</li>
                    <li style="margin-bottom: 8px;">File attachments</li>
                    <li style="margin-bottom: 8px;">Recurring tasks, assignments & exams</li>
                    <li style="margin-bottom: 8px;">All Tools (GPA Calculator, Pomodoro, etc.)</li>
                  </ul>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${APP_URL}/dashboard"
                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                                  color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                                  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                          Go to Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
                    You can manage your subscription anytime from the Account page.
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

Thank you for subscribing to College Orbit Premium! Your ${planLabel} plan (${price}) is now active.

You now have access to:
- Full Calendar view
- Shopping lists & Pantry tracking
- Unlimited notes and courses
- File attachments
- Recurring tasks, assignments & exams
- All Tools (GPA Calculator, Pomodoro, etc.)

Go to your dashboard: ${APP_URL}/dashboard

You can manage your subscription anytime from the Account page.

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
      subject: 'Welcome to College Orbit Premium!',
      html: htmlContent,
      text: textContent,
    });
    console.log(`Subscription started email sent to ${email}`);
  } catch (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send subscription started email');
  }
}

interface SendPlanChangedEmailParams {
  email: string;
  name: string | null;
  oldPlan: 'monthly' | 'yearly';
  newPlan: 'monthly' | 'yearly';
  effectiveDate: string;
}

/**
 * Send plan changed email
 */
export async function sendPlanChangedEmail({
  email,
  name,
  oldPlan,
  newPlan,
  effectiveDate,
}: SendPlanChangedEmailParams): Promise<void> {
  const displayName = name || 'there';
  const oldPlanLabel = oldPlan === 'yearly' ? 'Yearly' : 'Monthly';
  const newPlanLabel = newPlan === 'yearly' ? 'Yearly' : 'Monthly';
  const newPrice = newPlan === 'yearly' ? '$40/year' : '$5/month';

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
                    Plan Change Scheduled
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px 0;">Hi ${displayName},</p>
                  <p style="margin: 0 0 24px 0;">
                    Your plan change from <strong style="color: #fafafa;">${oldPlanLabel}</strong> to <strong style="color: #fafafa;">${newPlanLabel}</strong> (${newPrice}) has been scheduled.
                  </p>

                  <div style="background-color: #1a1a1c; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">Effective Date</p>
                    <p style="margin: 0; font-size: 18px; color: #fafafa; font-weight: 600;">${effectiveDate}</p>
                  </div>

                  <p style="margin: 0 0 24px 0;">
                    You'll continue to enjoy your current plan until then. No action is needed from you.
                  </p>

                  <p style="margin: 0; font-size: 14px; color: #71717a;">
                    You can manage your subscription anytime from the <a href="${APP_URL}/subscription" style="color: #8b5cf6;">Subscription page</a>.
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

Your plan change from ${oldPlanLabel} to ${newPlanLabel} (${newPrice}) has been scheduled.

Effective Date: ${effectiveDate}

You'll continue to enjoy your current plan until then. No action is needed from you.

You can manage your subscription anytime from: ${APP_URL}/subscription

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
      subject: 'Your plan change has been scheduled',
      html: htmlContent,
      text: textContent,
    });
    console.log(`Plan changed email sent to ${email}`);
  } catch (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send plan changed email');
  }
}

interface SendSubscriptionCancelledEmailParams {
  email: string;
  name: string | null;
  expiresAt: string;
}

/**
 * Send subscription cancelled email
 */
export async function sendSubscriptionCancelledEmail({
  email,
  name,
  expiresAt,
}: SendSubscriptionCancelledEmailParams): Promise<void> {
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
                    Subscription Cancelled
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px 0;">Hi ${displayName},</p>
                  <p style="margin: 0 0 24px 0;">
                    We're sorry to see you go. Your Premium subscription has been cancelled.
                  </p>

                  <div style="background-color: #1a1a1c; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">Premium Access Until</p>
                    <p style="margin: 0; font-size: 18px; color: #fafafa; font-weight: 600;">${expiresAt}</p>
                  </div>

                  <p style="margin: 0 0 24px 0;">
                    You'll continue to have full access to Premium features until this date. After that, you'll be switched to our Free plan, but don't worry — all your data will be preserved.
                  </p>

                  <p style="margin: 0 0 24px 0;">
                    Changed your mind? You can reactivate your subscription anytime before it expires.
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${APP_URL}/subscription"
                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                                  color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                                  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                          Reactivate Subscription
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
                    If you have any feedback about why you cancelled, we'd love to hear it at
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

We're sorry to see you go. Your Premium subscription has been cancelled.

Premium Access Until: ${expiresAt}

You'll continue to have full access to Premium features until this date. After that, you'll be switched to our Free plan, but don't worry — all your data will be preserved.

Changed your mind? You can reactivate your subscription anytime before it expires: ${APP_URL}/subscription

If you have any feedback about why you cancelled, we'd love to hear it at collegeorbit@protonmail.com

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
      subject: 'Your subscription has been cancelled',
      html: htmlContent,
      text: textContent,
    });
    console.log(`Subscription cancelled email sent to ${email}`);
  } catch (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send subscription cancelled email');
  }
}

interface SendAnnouncementEmailParams {
  email: string;
  name: string | null;
  title: string;
  message: string;
}

/**
 * Send announcement email to user
 */
export async function sendAnnouncementEmail({
  email,
  name,
  title,
  message,
}: SendAnnouncementEmailParams): Promise<void> {
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
                    ${title}
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 20px 40px 40px 40px; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 0 0 20px 0;">Hi ${displayName},</p>
                  <p style="margin: 0 0 24px 0; word-wrap: break-word; overflow-wrap: break-word;">
                    ${message.replace(/\n/g, '<br>')}
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${APP_URL}/dashboard"
                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                                  color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                                  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                          Go to Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
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

${title}

${message}

Go to your dashboard: ${APP_URL}/dashboard

College Orbit © ${new Date().getFullYear()}
  `.trim();

  const resend = getResend();
  if (!resend) {
    throw new Error('Resend API key not configured');
  }

  const fromAddress = `${FROM_NAME} <${FROM_EMAIL}>`;
  console.log(`Sending announcement email to ${email} from ${fromAddress}...`);

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: title,
    html: htmlContent,
    text: textContent,
  });

  if (error) {
    console.error('Resend API error:', error, `(from: ${FROM_EMAIL})`);
    throw new Error(`Resend API error: ${error.message} (sending from: ${FROM_EMAIL})`);
  }

  if (!data?.id) {
    throw new Error('Resend returned no email ID');
  }

  console.log(`Announcement email sent to ${email}, id: ${data.id}`);
}
