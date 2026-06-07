import { useState, useCallback, useRef, useEffect } from 'react';
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager';
import { clearClipboard } from '../lib/ipc';

export function useClipboard(timeoutMs: number, autoClear: boolean) {
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showClearedToast, setShowClearedToast] = useState(false);
  const [timeoutSecs, setTimeoutSecs] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearedToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passwordRef = useRef<string | null>(null);

  const copyToClipboard = useCallback(async (text: string) => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    if (copiedToastRef.current !== null) clearTimeout(copiedToastRef.current);
    if (clearedToastRef.current !== null) {
      clearTimeout(clearedToastRef.current);
      setShowClearedToast(false);
    }

    try {
      await writeText(text);
    } catch {
      return;
    }

    passwordRef.current = text;
    setTimeoutSecs(Math.floor(timeoutMs / 1000));
    setShowCopiedToast(true);
    copiedToastRef.current = setTimeout(() => setShowCopiedToast(false), 1500);

    if (autoClear) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const current = await readText();
          if (current === passwordRef.current) {
            await clearClipboard();
            setShowClearedToast(true);
            clearedToastRef.current = setTimeout(() => setShowClearedToast(false), 1500);
          }
        } catch {
          try { await clearClipboard(); } catch {}
        }
        passwordRef.current = null;
      }, timeoutMs);
    }
  }, [timeoutMs, autoClear]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      if (copiedToastRef.current !== null) clearTimeout(copiedToastRef.current);
      if (clearedToastRef.current !== null) clearTimeout(clearedToastRef.current);
    };
  }, []);

  return { showCopiedToast, showClearedToast, timeoutSecs, copyToClipboard };
}
