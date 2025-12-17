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

          return {
            id: user.id,
            email: user.email,
            name: user.name,
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
            select: { name: true, email: true },
          });

          if (freshUser) {
            session.user.name = freshUser.name;
            session.user.email = freshUser.email;
            token.name = freshUser.name;
            token.email = freshUser.email;
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
