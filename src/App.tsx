import { useState, useEffect, useRef, type ReactNode } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { useSync } from './hooks/useSync';
import { LockScreen } from './components/LockScreen';
import { VaultShell } from './components/VaultShell';
import { ErrorToast } from './components/ErrorToast';

function LoadingState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-surface-window flex items-center justify-center">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

function FadeIn({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className={`transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
}

function AppContent() {
  const { locked, config, lastLockReason, clearLockReason, error, clearError } = useVault();
  const { conflictPaths, hasConflict, checkForConflicts } = useSync();

  // Re-check conflicts when vault unlocks
  const prevLockedRef = useRef(locked);
  useEffect(() => {
    if (prevLockedRef.current && !locked) {
      checkForConflicts();
    }
    prevLockedRef.current = locked;
  }, [locked, checkForConflicts]);

  useEffect(() => {
    if (lastLockReason === 'inactivity') {
      const timer = setTimeout(clearLockReason, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastLockReason, clearLockReason]);

  if (!config) {
    return <LoadingState message="Loading…" />;
  }

  return (
    <>
      {locked ? (
        <FadeIn key="lock"><LockScreen /></FadeIn>
      ) : (
        <FadeIn key="unlock"><VaultShell hasConflict={hasConflict} conflictPaths={conflictPaths} checkForConflicts={checkForConflicts} /></FadeIn>
      )}

      {lastLockReason === 'inactivity' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-overlay border border-border-subtle rounded-lg px-4 py-2.5 text-xs text-text-primary z-50">
          Vault locked — inactivity timeout
        </div>
      )}

      <ErrorToast message={error} onDismiss={clearError} />
    </>
  );
}

export function App() {
  return (
    <VaultProvider>
      <AppContent />
    </VaultProvider>
  );
}