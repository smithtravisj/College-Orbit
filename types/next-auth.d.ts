import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      isAdmin?: boolean;
      lastLogin?: string | null;
      subscriptionTier?: string;
      isPremium?: boolean;
    };
    invalidated?: boolean;
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    iat?: number;
  }
}
