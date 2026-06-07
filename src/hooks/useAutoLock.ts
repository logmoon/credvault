import { useEffect, useRef } from 'react';

export function useAutoLock(timeoutMs: number, onLock: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLockRef = useRef(onLock);

  onLockRef.current = onLock;

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onLockRef.current();
      }, timeoutMs);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        timerRef.current = null;
        onLockRef.current();
      }
    };

    resetTimer();

    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [timeoutMs]);
}
