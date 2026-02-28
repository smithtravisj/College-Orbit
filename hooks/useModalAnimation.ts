import { useState, useEffect, useRef } from 'react';

/* ---------- body scroll lock (shared across all modals) ---------- */
let lockCount = 0;

function lockBodyScroll() {
  lockCount++;
  if (lockCount === 1) {
    document.body.classList.add('modal-open');
  }
}

function unlockBodyScroll() {
  lockCount--;
  if (lockCount <= 0) {
    lockCount = 0;
    document.body.classList.remove('modal-open');
  }
}

/**
 * Delays unmount so a closing animation can play.
 * Pass the nullable state (e.g. previewingTask) — returns `data` (stays
 * non-null during the exit animation) and `closing` (true while animating out).
 */
export function useModalAnimation<T>(value: T | null, duration = 200) {
  const [display, setDisplay] = useState<T | null>(value);
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (value != null) {
      clearTimeout(timerRef.current);
      setDisplay(value);
      setClosing(false);
    } else if (display != null) {
      setClosing(true);
      timerRef.current = setTimeout(() => {
        setDisplay(null);
        setClosing(false);
      }, duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [value, duration]);

  // Lock body scroll while modal is showing (including during close animation)
  const isShowing = display != null;
  useEffect(() => {
    if (!isShowing) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isShowing]);

  return { data: display, closing };
}

/** Boolean convenience wrapper for components that take `isOpen`. */
export function useAnimatedOpen(isOpen: boolean, duration = 200) {
  const { data, closing } = useModalAnimation(isOpen || null, duration);
  return { visible: !!data, closing };
}
