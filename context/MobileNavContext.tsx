'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface MobileNavContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => {
    console.log('[MobileNav] Opening drawer');
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    console.log('[MobileNav] Closing drawer');
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => {
      const newState = !prev;
      console.log('[MobileNav] Toggle drawer:', prev, '->', newState);
      return newState;
    });
  }, []);

  return (
    <MobileNavContext.Provider value={{ isDrawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (!context) {
    throw new Error('useMobileNav must be used within MobileNavProvider');
  }
  return context;
}
