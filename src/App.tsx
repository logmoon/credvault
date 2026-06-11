import { useEffect, useRef } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { useSync } from './hooks/useSync';
import { LockScreen } from './components/LockScreen';
import { VaultShell } from './components/VaultShell';

function LoadingState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-surface-window flex items-center justify-center">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

function AppContent() {
  const { locked, config, lastLockReason, clearLockReason } = useVault();
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
      {locked ? <LockScreen /> : <VaultShell hasConflict={hasConflict} conflictPaths={conflictPaths} checkForConflicts={checkForConflicts} />}

      {lastLockReason === 'inactivity' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-overlay border border-border-subtle rounded-lg px-4 py-2.5 text-xs text-text-primary z-50 shadow-sm">
          Vault locked — inactivity timeout
        </div>
      )}
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