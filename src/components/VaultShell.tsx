import { useState, useCallback, useMemo } from 'react';
import { Plus, Settings as SettingsIcon, Lock, AlertTriangle } from 'lucide-react';
import { ConflictDialog } from './ConflictDialog';
import { open } from '@tauri-apps/plugin-shell';
import { useVault } from '../context/VaultContext';
import { useClipboard } from '../hooks/useClipboard';
import { useAutoLock } from '../hooks/useAutoLock';
import { useTitlebarDblClick } from '../hooks/useTitlebarDblClick';
import { isValidUrl } from '../lib/url';
import { SearchBar } from './SearchBar';
import { EntryList } from './EntryList';
import { AddEntry } from './AddEntry';
import { EntryDetail } from './EntryDetail';
import { Settings } from './Settings';
import { ClipboardToast } from './ClipboardToast';
import { WindowControls } from './WindowControls';

type VaultShellProps = {
  hasConflict: boolean;
  conflictPaths: string[];
  checkForConflicts: () => Promise<void>;
};

export function VaultShell({ hasConflict: hasConflictFromSync, conflictPaths, checkForConflicts }: VaultShellProps) {
  const { entries, config, lockVault, hasBlockingConflict, clearBlockingConflict } = useVault();

  // Show banner if sync detects conflicts OR pre-save check blocked a save
  const hasConflict = hasConflictFromSync || hasBlockingConflict;
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<'add' | 'edit' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTitlebarDblClick = useTitlebarDblClick();

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

  const handleDeselect = useCallback(() => {
    setSelectedEntryId(null);
    setRightPanel(null);
  }, []);

  const handleSelect = useCallback((id: string) => {
    if (id === selectedEntryId) {
      handleDeselect();
      return;
    }
    setSelectedEntryId(id);
    setRightPanel('edit');
  }, [selectedEntryId, handleDeselect]);

  const handleAdd = useCallback(() => {
    setPanelKey(k => k + 1);
    setRightPanel('add');
    setSelectedEntryId(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedEntryId(null);
    setRightPanel(null);
  }, []);

  const handleResolveResolved = useCallback(() => {
    setResolveOpen(false);
    clearBlockingConflict();
    checkForConflicts();
  }, [checkForConflicts, clearBlockingConflict]);

  const handleResolveLockNeeded = useCallback(() => {
    setResolveOpen(false);
    lockVault();
  }, [lockVault]);

  const entryList = entries ?? [];

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entryList;
    const query = searchQuery.toLowerCase();
    return entryList.filter(e => e.title.toLowerCase().includes(query));
  }, [entryList, searchQuery]);

  return (
    <div className="h-screen bg-surface-window flex flex-col">
      {/* Header — strong bottom border to separate from content. Doubles as the
          window titlebar (decorations: false): draggable, dblclick to maximize */}
      <header
        data-tauri-drag-region
        onDoubleClick={handleTitlebarDblClick}
        className="bg-surface border-b border-border-strong flex items-center justify-between pl-6 pr-2 py-3 select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-text-secondary font-medium truncate">CredVault</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
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
          <div className="w-px h-4 bg-border-strong mx-1" aria-hidden="true" />
          <WindowControls />
        </div>
      </header>

      {/* Conflict banner — redesigned */}
      {hasConflict && (
        <div className="bg-surface-raised border-b border-border">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="bg-status-warning/15 rounded-md p-1.5">
                <AlertTriangle size={14} className="text-status-warning" />
              </div>
              <div>
                <p className="text-sm text-text-primary font-medium">
                  Sync conflict detected
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {conflictPaths.length} conflicting {conflictPaths.length === 1 ? 'copy' : 'copies'} found — choose which version to keep
                </p>
              </div>
            </div>
            <button
              onClick={() => setResolveOpen(true)}
              className="text-sm font-medium text-text-secondary border border-border rounded-md px-4 py-1.5 hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              Review
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — strong right border to separate from right panel */}
        <div
          className="w-[320px] shrink-0 bg-surface border-r border-border-strong flex flex-col min-h-0"
          onClick={handleDeselect}
        >
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <EntryList
            entries={filteredEntries}
            selectedId={selectedEntryId}
            onSelect={handleSelect}
            onCopyUsername={handleCopyUsername}
            onCopyPassword={handleCopyPassword}
            onOpenUrl={handleOpenUrl}
            isValidUrl={isValidUrl}
            searchQuery={searchQuery}
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
        <Settings onClose={() => setSettingsOpen(false)} />
      )}

      {resolveOpen && config?.vaultPath && (
        <ConflictDialog
          vaultPath={config.vaultPath}
          conflictPaths={conflictPaths}
          onClose={() => setResolveOpen(false)}
          onResolved={handleResolveResolved}
          onLockNeeded={handleResolveLockNeeded}
        />
      )}
    </div>
  );
}
