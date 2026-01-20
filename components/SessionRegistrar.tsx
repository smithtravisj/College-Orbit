'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function SessionRegistrar() {
  const { data: session, status } = useSession();
  const hasRegistered = useRef(false);

  // Check if session was invalidated (e.g., user logged out all sessions)
  useEffect(() => {
    if (session && (session as any).invalidated) {
      // Session was invalidated, force logout
      signOut({ callbackUrl: '/login' });
    }
  }, [session]);

  useEffect(() => {
    // Only register once per app load, and only for authenticated users
    if (status !== 'authenticated' || !session?.user || hasRegistered.current) {
      return;
    }

    // Don't register if session is invalidated
    if ((session as any).invalidated) {
      return;
    }

    const registerSession = async () => {
      hasRegistered.current = true;

      // Detect browser client-side (for browsers like Brave that hide in UA)
      let detectedBrowser: string | null = null;
      if (typeof window !== 'undefined') {
        // Check for Brave
        if ((navigator as any).brave?.isBrave) {
          try {
            const isBrave = await (navigator as any).brave.isBrave();
            if (isBrave) detectedBrowser = 'Brave';
          } catch {}
        }
      }

      // Register current session
      try {
        await fetch('/api/user/sessions/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ browser: detectedBrowser }),
        });
      } catch (err) {
        console.error('Failed to register session:', err);
      }
    };

    registerSession();
  }, [session, status]);

  return null;
}
