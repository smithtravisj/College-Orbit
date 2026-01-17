import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authConfig: NextAuthOptions = {
  pages: {
    signIn: '/login',
  },
  providers: [
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
    async jwt({ token, user }) {
      if (user) {
        console.log('JWT callback - creating token for user:', user.id);
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.iat = Math.floor(Date.now() / 1000); // Token creation time
      } else {
        console.log('JWT callback - no user, token:', token ? 'exists' : 'null');
      }
      return token;
    },
    async session({ session, token }) {
      if (!token) {
        return null as any;
      }

      if (token && session.user) {
        session.user.id = token.id as string;

        // Fetch fresh user data from database to ensure updates are reflected
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, email: true, isAdmin: true, lastLogin: true, sessionInvalidatedAt: true },
          });

          if (freshUser) {
            // Check if session was invalidated after token was created
            if (freshUser.sessionInvalidatedAt && token.iat) {
              const tokenCreatedAt = new Date((token.iat as number) * 1000);
              if (freshUser.sessionInvalidatedAt > tokenCreatedAt) {
                // Token was created before session invalidation - reject it
                return null as any;
              }
            }

            session.user.name = freshUser.name;
            session.user.email = freshUser.email;
            token.name = freshUser.name;
            token.email = freshUser.email;
            (session.user as any).isAdmin = freshUser.isAdmin;
            (session.user as any).lastLogin = freshUser.lastLogin?.toISOString() || null;
          }
        } catch (error) {
          console.error('Error fetching fresh user data in session:', error);
        }
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
