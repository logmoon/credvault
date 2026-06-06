import { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { EntryList } from './EntryList';

export function VaultShell() {
  const { entries, lockVault } = useVault();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const handleCopyUsername = (id: string) => {
    console.log('Copy username:', id);
  };

  const handleCopyPassword = (id: string) => {
    console.log('Copy password:', id);
  };

  const entryList = entries ?? [];

  return (
    <div className="min-h-screen bg-surface-window flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/8">
        <span className="text-sm text-text-secondary font-medium">CredVault</span>
        <button
          onClick={lockVault}
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          Lock
        </button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[280px] shrink-0 border-r border-white/8 flex flex-col">
          <EntryList
            entries={entryList}
            selectedId={selectedEntryId}
            onSelect={setSelectedEntryId}
            onCopyUsername={handleCopyUsername}
            onCopyPassword={handleCopyPassword}
          />
        </div>
        <main className="flex-1" />
      </div>
    </div>
  );
}
