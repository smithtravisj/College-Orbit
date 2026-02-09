import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { randomUUID, randomBytes } from 'crypto';
import { DEFAULT_VISIBLE_PAGES, DEFAULT_VISIBLE_DASHBOARD_CARDS, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';
import { seedDemoData } from '@/lib/seedDemoData';

export const authConfig: NextAuthOptions = {
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!passwordMatch) {
            return null;
          }

          // Update lastLogin and log login event to analytics
          const now = new Date();
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: now },
            });
            await prisma.analyticsEvent.create({
              data: {
                sessionId: 'server-login',
                userId: user.id,
                eventType: 'login',
                eventName: 'user_login',
              },
            });
          } catch (analyticsError) {
            console.error('Failed to log login event:', analyticsError);
            // Don't fail login if analytics fails
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            lastLogin: now.toISOString(),
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if ((account?.provider === 'google' || account?.provider === 'azure-ad') && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Create new user for Google sign-in
            const randomHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 14);

            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
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
            seedDemoData(newUser.id).catch(err => console.error(`Failed to create demo data for ${account.provider} user:`, err));

            // Create welcome notifications in background
            prisma.notification.createMany({
              data: [
                {
                  userId: newUser.id,
                  title: 'Welcome to your 14-day Premium Trial!',
                  message: `Enjoy full access to all premium features. Your trial ends on ${trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
                  type: 'trial_started',
                },
                {
                  userId: newUser.id,
                  title: 'Connect Your LMS',
                  message: 'Sync your courses, assignments, and grades automatically. Go to Settings to connect Canvas or Moodle.',
                  type: 'lms_tip',
                },
              ],
            }).catch(err => console.error('Failed to create OAuth signup notifications:', err));

            // Notify admins
            prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } }).then(admins => {
              if (admins.length > 0) {
                prisma.notification.createMany({
                  data: admins.map(admin => ({
                    userId: admin.id,
                    title: 'New User Signup',
                    message: `${newUser.name || newUser.email} just created an account via ${account.provider === 'azure-ad' ? 'Microsoft' : 'Google'} Sign-In.`,
                    type: 'new_user_signup',
                  })),
                }).catch(err => console.error('Failed to notify admins:', err));
              }
            }).catch(err => console.error('Failed to find admins:', err));
          }
        } catch (error) {
          console.error('OAuth sign-in user creation error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if ((account?.provider === 'google' || account?.provider === 'azure-ad') && user?.email) {
        // Look up the user from our database for OAuth sign-ins
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.iat = Math.floor(Date.now() / 1000);
          token.sessionToken = randomUUID();

          // Update lastLogin
          prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLogin: new Date() },
          }).catch(err => console.error('Failed to update lastLogin:', err));
        }
      } else if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.iat = Math.floor(Date.now() / 1000);
        token.sessionToken = randomUUID();
      }
      return token;
    },
    async session({ session, token }) {
      if (!token || !session.user) {
        return session;
      }

      session.user.id = token.id as string;

      // Combined query: fetch user data AND check session revocation in a single DB call
      try {
        const [freshUser, userSession] = await Promise.all([
          prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              name: true,
              email: true,
              isAdmin: true,
              lastLogin: true,
              sessionInvalidatedAt: true,
              subscriptionTier: true,
              trialEndsAt: true,
              lifetimePremium: true,
            },
          }),
          // Only check session revocation if we have a sessionToken
          token.sessionToken
            ? prisma.userSession.findUnique({
                where: { sessionToken: token.sessionToken as string },
                select: { revokedAt: true },
              })
            : Promise.resolve(null),
        ]);

        // Check if this specific session was revoked
        if (userSession?.revokedAt) {
          (session as any).invalidated = true;
          return session;
        }

        if (freshUser) {
          // Check if session was invalidated after token was created
          if (freshUser.sessionInvalidatedAt && token.iat) {
            const tokenCreatedAt = new Date((token.iat as number) * 1000);
            if (freshUser.sessionInvalidatedAt > tokenCreatedAt) {
              // Token was created before session invalidation - mark session as invalid
              (session as any).invalidated = true;
              return session;
            }
          }

          session.user.name = freshUser.name;
          session.user.email = freshUser.email;
          token.name = freshUser.name;
          token.email = freshUser.email;
          (session.user as any).isAdmin = freshUser.isAdmin;
          (session.user as any).lastLogin = freshUser.lastLogin?.toISOString() || null;

          // Auto-grant lifetime premium to admins if they don't have it
          if (freshUser.isAdmin && !freshUser.lifetimePremium) {
            prisma.user.update({
              where: { id: token.id as string },
              data: {
                lifetimePremium: true,
                subscriptionTier: 'premium',
                subscriptionStatus: 'active',
              },
            }).catch((err) => console.error('Failed to grant admin lifetime premium:', err));
            // Update local variable for isPremium calculation
            freshUser.lifetimePremium = true;
          }

          // Add subscription info to session
          (session.user as any).subscriptionTier = freshUser.subscriptionTier;
          // Calculate isPremium: lifetime, active subscription, or active trial
          const isPremium =
            freshUser.lifetimePremium ||
            freshUser.subscriptionTier === 'premium' ||
            (freshUser.subscriptionTier === 'trial' &&
              freshUser.trialEndsAt &&
              new Date() < freshUser.trialEndsAt);
          (session.user as any).isPremium = isPremium;
        }
      } catch (error) {
        console.error('Error in session callback:', error);
      }

      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
