import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  generateToken,
  getResetTokenExpiry,
  sendPasswordResetEmail,
  sendPasswordResetEmailDev,
} from '@/lib/email';

// Send real emails only in production with verified domain, otherwise use dev mode
const shouldSendRealEmail = !!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production';

export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email (don't reveal if email doesn't exist)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Generate reset token regardless of whether user exists
    const resetToken = generateToken();
    const resetTokenExpiry = getResetTokenExpiry();

    // If user exists, update with reset token
    if (user) {
      console.log('[Forgot Password] Found user:', user.id, user.email);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordTokenExpiry: resetTokenExpiry,
        },
      });
      console.log('[Forgot Password] Token saved:', resetToken);

      // Send reset email (don't block request if this fails)
      try {
        if (shouldSendRealEmail) {
          await sendPasswordResetEmail({
            email: user.email,
            name: user.name,
            token: resetToken,
          });
        } else {
          await sendPasswordResetEmailDev({
            email: user.email,
            name: user.name,
            token: resetToken,
          });
        }
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request - user can request again
      }
    }

    // Always return success (security - don't reveal email existence)
    return NextResponse.json(
      { success: true, message: 'If that email exists, we sent a password reset link' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
});
