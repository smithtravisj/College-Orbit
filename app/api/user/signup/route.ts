import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { DEFAULT_VISIBLE_PAGES, DEFAULT_VISIBLE_DASHBOARD_CARDS, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';
import { withRateLimit } from '@/lib/withRateLimit';
import { sendWelcomeEmail, sendWelcomeEmailDev } from '@/lib/email';

// Send real emails only in production with verified domain
const shouldSendRealEmail = !!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production';

export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const { name, email, password, university } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both email and password' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create user with trial subscription
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        trialEndsAt,
        settings: {
          create: {
            dueSoonWindowDays: 7,
            weekStartsOn: 'Sun',
            theme: 'system',
            enableNotifications: false,
            university: university || null,
            visiblePages: DEFAULT_VISIBLE_PAGES,
            visibleDashboardCards: DEFAULT_VISIBLE_DASHBOARD_CARDS,
            visibleToolsCards: DEFAULT_VISIBLE_TOOLS_CARDS,
          },
        },
      },
    });

    // Create trial started notification
    try {
      const trialEndFormatted = trialEndsAt.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to your 14-day Premium Trial!',
          message: `Enjoy full access to all premium features. Your trial ends on ${trialEndFormatted}.`,
          type: 'trial_started',
        },
      });
    } catch (notificationError) {
      console.error('Failed to create trial notification:', notificationError);
      // Don't fail signup if notification fails
    }

    // Send welcome email (don't block signup if this fails)
    try {
      if (shouldSendRealEmail) {
        await sendWelcomeEmail({
          email: user.email,
          name: user.name,
        });
      } else {
        await sendWelcomeEmailDev({
          email: user.email,
          name: user.name,
        });
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the signup - user account is already created
    }

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name },
        message: 'Account created successfully!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'We couldn\'t create your account. Please try again.' },
      { status: 500 }
    );
  }
});
