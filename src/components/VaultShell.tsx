import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useVault } from '../context/VaultContext';
import { isValidUrl } from '../lib/url';
import { EntryList } from './EntryList';
import { AddEntry } from './AddEntry';
import { EntryDetail } from './EntryDetail';

export function VaultShell() {
  const { entries, lockVault } = useVault();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<'add' | 'edit' | null>(null);
  const [panelKey, setPanelKey] = useState(0);

  const handleCopyUsername = (id: string) => {
    console.log('Copy username:', id);
  };

  const handleCopyPassword = (id: string) => {
    console.log('Copy password:', id);
  };

  const handleOpenUrl = useCallback(async (url: string) => {
    const normalized =
      url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    try {
      await open(normalized);
    } catch {
      console.error('Failed to open URL');
    }
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedEntryId(id);
    setRightPanel('edit');
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedEntryId(null);
    setRightPanel(null);
  }, []);

  const handleAdd = useCallback(() => {
    setPanelKey(k => k + 1);
    setRightPanel('add');
    setSelectedEntryId(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedEntryId(null);
    setRightPanel(null);
  }, []);

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
        <div
          className="w-[280px] shrink-0 border-r border-white/8 flex flex-col"
          onClick={handleDeselect}
        >
          <EntryList
            entries={entryList}
            selectedId={selectedEntryId}
            onSelect={handleSelect}
            onCopyUsername={handleCopyUsername}
            onCopyPassword={handleCopyPassword}
            onOpenUrl={handleOpenUrl}
            isValidUrl={isValidUrl}
          />
        </div>
        <main className="flex-1 overflow-y-auto">
          {rightPanel === 'add' && <AddEntry key={panelKey} onClose={handleClosePanel} />}
          {rightPanel === 'edit' && selectedEntryId && (
            <EntryDetail key={selectedEntryId} entryId={selectedEntryId} onClose={handleClosePanel} />
          )}
        </main>
      </div>

      {rightPanel === null && (
        <button
          onClick={handleAdd}
          className="fixed bottom-6 right-6 bg-accent hover:bg-accent-dark text-white rounded-full p-3 transition-colors"
          aria-label="Add entry"
          title="Add entry"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
}
