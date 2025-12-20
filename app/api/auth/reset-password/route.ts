import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { isTokenExpired, sendPasswordChangedEmail, sendPasswordChangedEmailDev } from '@/lib/email';

// Send real emails only in production with verified domain, otherwise use dev mode
const shouldSendRealEmail = !!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production';

export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    // Validation
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Find user by reset token
    console.log('[Reset Password] Looking for token:', token);
    const user = await prisma.user.findUnique({
      where: { resetPasswordToken: token },
      select: {
        id: true,
        email: true,
        name: true,
        resetPasswordTokenExpiry: true,
      },
    });

    console.log('[Reset Password] User found:', user ? user.email : 'NOT FOUND');
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.resetPasswordTokenExpiry && isTokenExpired(user.resetPasswordTokenExpiry)) {
      return NextResponse.json(
        { error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    // Send password changed confirmation email (fail gracefully if this fails)
    try {
      if (shouldSendRealEmail) {
        await sendPasswordChangedEmail({
          email: user.email,
          name: user.name,
        });
      } else {
        await sendPasswordChangedEmailDev({
          email: user.email,
          name: user.name,
        });
      }
    } catch (emailError) {
      console.error('Failed to send password changed email:', emailError);
      // Don't fail the request - password is already reset
    }

    return NextResponse.json(
      { success: true, message: 'Password reset successfully. Redirecting to login...' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
});
