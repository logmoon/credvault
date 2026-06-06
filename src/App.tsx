import { VaultProvider, useVault } from './context/VaultContext';
import { LockScreen } from './components/LockScreen';
import { VaultShell } from './components/VaultShell';

function AppContent() {
  const { locked } = useVault();

  if (locked) {
    return <LockScreen />;
  }

  return <VaultShell />;
}

export function App() {
  return (
    <VaultProvider>
      <AppContent />
    </VaultProvider>
  );
}
