import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { DEFAULT_VISIBLE_PAGES, DEFAULT_VISIBLE_DASHBOARD_CARDS, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';
import { withRateLimit } from '@/lib/withRateLimit';
import { sendWelcomeEmail, sendWelcomeEmailDev } from '@/lib/email';
import { seedDemoData } from '@/lib/seedDemoData';

// Send real emails only in production with verified domain
const shouldSendRealEmail = !!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production';

export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const { name, email, password, university, referralCode, utmSource, utmCampaign } = await req.json();

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

    // Look up collegeId if university is provided
    let collegeId: string | null = null;
    if (university) {
      const college = await prisma.college.findFirst({
        where: { fullName: university, isActive: true },
        select: { id: true },
      });
      collegeId = college?.id || null;
    }

    // Create user with trial subscription
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        trialEndsAt,
        utmSource: utmSource || null,
        utmCampaign: utmCampaign || null,
        collegeId,
        settings: {
          create: {
            weekStartsOn: 'Sun',
            theme: 'dark',
            enableNotifications: false,
            university: university || null,
            visiblePages: DEFAULT_VISIBLE_PAGES,
            visibleDashboardCards: DEFAULT_VISIBLE_DASHBOARD_CARDS,
            visibleToolsCards: DEFAULT_VISIBLE_TOOLS_CARDS,
          },
        },
      },
    });

    // Seed demo data in background (don't block signup response)
    seedDemoData(user.id).catch(err => console.error('Failed to create demo data:', err));

    // Handle referral code if provided
    if (referralCode) {
      try {
        // Find the referrer by their referral code
        const referrer = await prisma.user.findUnique({
          where: { referralCode: referralCode.toUpperCase() },
          select: { id: true, name: true, email: true },
        });

        // Only process if referrer exists and is not the same user (self-referral prevention)
        if (referrer && referrer.id !== user.id) {
          // Create the referral record and update the user's referredById
          await prisma.$transaction([
            prisma.referral.create({
              data: {
                referrerId: referrer.id,
                refereeId: user.id,
                status: 'pending',
                rewardMonths: 1,
              },
            }),
            prisma.user.update({
              where: { id: user.id },
              data: { referredById: referrer.id },
            }),
          ]);

          // Notify referrer that someone signed up with their link
          const refereeName = user.name || user.email?.split('@')[0] || 'Someone';
          await prisma.notification.create({
            data: {
              userId: referrer.id,
              title: 'New Referral Signup!',
              message: `${refereeName} just signed up using your referral link. You'll earn 1 month free when they subscribe to premium!`,
              type: 'referral_signup',
            },
          });

          console.log(`Referral created: ${referrer.email} referred ${user.email}`);
        }
      } catch (referralError) {
        console.error('Failed to process referral code:', referralError);
        // Don't fail signup if referral processing fails
      }
    }

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

    // Create LMS integration notification
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Connect Your LMS',
          message: 'Sync your courses, assignments, and grades automatically. Go to Settings to connect Canvas or Moodle.',
          type: 'lms_tip',
        },
      });
    } catch (lmsNotificationError) {
      console.error('Failed to create LMS notification:', lmsNotificationError);
      // Don't fail signup if notification fails
    }

    // Notify all admins about new user signup
    try {
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true },
      });

      if (admins.length > 0) {
        const userDisplay = user.name || user.email;
        const utmInfo = utmSource ? ` [${utmSource}${utmCampaign ? `/${utmCampaign}` : ''}]` : '';
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: 'New User Signup',
            message: `${userDisplay} just created an account${university ? ` (${university})` : ''}${utmInfo}.`,
            type: 'new_user_signup',
          })),
        });
      }
    } catch (adminNotificationError) {
      console.error('Failed to notify admins:', adminNotificationError);
      // Don't fail signup if admin notification fails
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
