import { useState, useCallback } from 'react';
import { Plus, Settings as SettingsIcon, Lock, AlertTriangle } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useVault } from '../context/VaultContext';
import { useClipboard } from '../hooks/useClipboard';
import { useAutoLock } from '../hooks/useAutoLock';
import { isValidUrl } from '../lib/url';
import { EntryList } from './EntryList';
import { AddEntry } from './AddEntry';
import { EntryDetail } from './EntryDetail';
import { Settings } from './Settings';
import { ClipboardToast } from './ClipboardToast';

type VaultShellProps = {
  hasConflict: boolean;
  checkForConflicts: () => Promise<void>;
};

export function VaultShell({ hasConflict, checkForConflicts }: VaultShellProps) {
  const { entries, config, lockVault } = useVault();
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<'add' | 'edit' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);

  const { showCopiedToast, showClearedToast, timeoutSecs, copyToClipboard } = useClipboard(
    config?.clipboardTimeoutMs ?? 30_000,
    config?.clipboardAutoClear ?? true,
  );

  const handleAutoLock = useCallback(() => {
    lockVault('inactivity');
  }, [lockVault]);

  useAutoLock(config?.lockTimeoutMs ?? 300_000, handleAutoLock);

  const handleCopyUsername = useCallback((id: string) => {
    const entry = entries?.find(e => e.id === id);
    if (entry) copyToClipboard(entry.username);
  }, [entries, copyToClipboard]);

  const handleCopyPassword = useCallback((id: string) => {
    const entry = entries?.find(e => e.id === id);
    if (entry) copyToClipboard(entry.password);
  }, [entries, copyToClipboard]);

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
      {/* Header — strong bottom border to separate from content */}
      <header className="bg-surface border-b border-border-strong flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary font-medium">CredVault</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
            aria-label="Settings"
            title="Settings"
          >
            <SettingsIcon size={16} />
          </button>
          <button
            onClick={() => lockVault()}
            className="p-2 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
            aria-label="Lock vault"
            title="Lock"
          >
            <Lock size={16} />
          </button>
        </div>
      </header>

      {/* Conflict banner — persistent until resolved */}
      {hasConflict && (
        <div className="flex items-center justify-between px-6 py-2 bg-surface-raised border-b border-border border-l-4 border-status-warning">
          <div className="flex items-center gap-2 text-xs text-status-warning">
            <AlertTriangle size={14} />
            <span>Sync conflict detected — a conflicted copy of your vault exists</span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-xs font-medium text-status-warning border border-status-warning/30 rounded-md px-3 py-1 hover:bg-status-warning/15 transition-colors"
          >
            Resolve
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — strong right border to separate from right panel */}
        <div
          className="w-[280px] shrink-0 bg-surface border-r border-border-strong flex flex-col min-h-0"
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

        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {rightPanel === 'add' && <AddEntry key={panelKey} onClose={handleClosePanel} />}
          {rightPanel === 'edit' && selectedEntryId && (
            <EntryDetail key={selectedEntryId} entryId={selectedEntryId} onClose={handleClosePanel} />
          )}
          {showCopiedToast && (
            <ClipboardToast type="copied" timeoutSecs={timeoutSecs} />
          )}
          {showClearedToast && (
            <ClipboardToast type="cleared" />
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

      {settingsOpen && (
        <Settings onClose={() => setSettingsOpen(false)} checkForConflicts={checkForConflicts} hasConflict={hasConflict} />
      )}
    </div>
  );
}
