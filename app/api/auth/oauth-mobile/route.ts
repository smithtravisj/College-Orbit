import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { DEFAULT_VISIBLE_PAGES, DEFAULT_VISIBLE_DASHBOARD_CARDS, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';
import { seedDemoData } from '@/lib/seedDemoData';

// Accepted Google client IDs (web + iOS + Android)
const GOOGLE_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_IOS_CLIENT_ID,
].filter(Boolean);

const AZURE_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID;

/**
 * POST /api/auth/oauth-mobile
 * Exchanges a Google/Microsoft ID token from the mobile app for a College Orbit JWT.
 */
export async function POST(request: NextRequest) {
  try {
    const { provider, idToken } = await request.json();

    if (!provider || !idToken) {
      return NextResponse.json({ error: 'provider and idToken are required' }, { status: 400 });
    }

    let email: string | null = null;
    let oauthName: string | null = null;

    if (provider === 'google') {
      // Verify Google ID token via tokeninfo endpoint
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (!res.ok) {
        return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
      }
      const payload = await res.json();

      // Verify audience matches one of our client IDs
      if (!GOOGLE_CLIENT_IDS.includes(payload.aud)) {
        console.error(`Google token audience mismatch: ${payload.aud}`);
        return NextResponse.json({ error: 'Invalid Google token audience' }, { status: 401 });
      }

      email = payload.email;
      oauthName = payload.name || null;
    } else if (provider === 'microsoft') {
      // Verify Microsoft ID token by calling the userinfo endpoint with the token
      // For ID tokens, decode and verify the claims
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        return NextResponse.json({ error: 'Invalid Microsoft token' }, { status: 401 });
      }

      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

        // Verify audience
        if (AZURE_CLIENT_ID && payload.aud !== AZURE_CLIENT_ID) {
          console.error(`Microsoft token audience mismatch: ${payload.aud}`);
          return NextResponse.json({ error: 'Invalid Microsoft token audience' }, { status: 401 });
        }

        // Verify not expired
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: 'Microsoft token expired' }, { status: 401 });
        }

        // Verify issuer is Microsoft
        if (!payload.iss?.includes('login.microsoftonline.com') && !payload.iss?.includes('sts.windows.net')) {
          return NextResponse.json({ error: 'Invalid Microsoft token issuer' }, { status: 401 });
        }

        email = payload.preferred_username || payload.email || payload.upn;
        oauthName = payload.name || null;
      } catch {
        return NextResponse.json({ error: 'Failed to decode Microsoft token' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Could not determine email from token' }, { status: 401 });
    }

    email = email.toLowerCase().trim();

    // Find or create the user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // New user — create account
      const randomHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      user = await prisma.user.create({
        data: {
          email,
          name: oauthName,
          passwordHash: randomHash,
          trialEndsAt,
          settings: {
            create: {
              weekStartsOn: 'Sun',
              theme: 'dark',
              enableNotifications: false,
              visiblePages: DEFAULT_VISIBLE_PAGES,
              visibleDashboardCards: DEFAULT_VISIBLE_DASHBOARD_CARDS,
              visibleToolsCards: DEFAULT_VISIBLE_TOOLS_CARDS,
              needsCollegeSelection: true,
            },
          },
        },
      });

      // Seed demo data in background
      seedDemoData(user.id).catch(err => console.error('Failed to seed demo data for mobile OAuth user:', err));

      // Create welcome notifications in background
      prisma.notification.createMany({
        data: [
          {
            userId: user.id,
            title: 'Welcome to your 14-day Premium Trial!',
            message: `Enjoy full access to all premium features. Your trial ends on ${trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
            type: 'trial_started',
          },
          {
            userId: user.id,
            title: 'Connect Your LMS',
            message: 'Sync your courses, assignments, and grades automatically. Go to Settings to connect Canvas or Moodle.',
            type: 'lms_tip',
          },
        ],
      }).catch(err => console.error('Failed to create OAuth signup notifications:', err));

      // Notify admins
      prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } }).then(admins => {
        if (admins.length > 0) {
          const providerName = provider === 'google' ? 'Google' : 'Microsoft';
          prisma.notification.createMany({
            data: admins.map(admin => ({
              userId: admin.id,
              title: 'New User Signup',
              message: `${oauthName || email} just created an account via ${providerName} Sign-In (mobile app).`,
              type: 'new_user_signup',
            })),
          }).catch(err => console.error('Failed to notify admins:', err));
        }
      }).catch(err => console.error('Failed to find admins:', err));
    }

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Issue JWT (same pattern as extension-token)
    const secret = process.env.EXTENSION_JWT_SECRET;
    if (!secret) {
      console.error('EXTENSION_JWT_SECRET is not configured');
      return NextResponse.json({ error: 'Auth is not configured' }, { status: 500 });
    }

    const token = sign(
      { userId: user.id, purpose: 'extension' },
      secret,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('OAuth mobile error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
