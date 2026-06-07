import { useEffect } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { LockScreen } from './components/LockScreen';
import { VaultShell } from './components/VaultShell';

function AppContent() {
  const { locked, lastLockReason, clearLockReason } = useVault();

  useEffect(() => {
    if (lastLockReason === 'inactivity') {
      const timer = setTimeout(clearLockReason, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastLockReason, clearLockReason]);

  return (
    <>
      {locked ? <LockScreen /> : <VaultShell />}

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
