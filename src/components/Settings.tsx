import { useState, useCallback, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { pickVaultPath, vaultExists, changeVaultPath } from '../lib/ipc';
import { ConfirmDialog } from './ConfirmDialog';

type SettingsProps = {
  onClose: () => void;
  checkForConflicts: () => Promise<void>;
  hasConflict: boolean;
};

export function Settings({ onClose, checkForConflicts, hasConflict }: SettingsProps) {
  const { config, updateConfig } = useVault();
  const [confirmOverwrite, setConfirmOverwrite] = useState<string | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleChangePath = useCallback(async () => {
    if (!config) return;
    const newPath = await pickVaultPath();
    if (!newPath) return;
    if (newPath === config.vaultPath) return;

    const exists = await vaultExists(newPath);
    if (exists) {
      setConfirmOverwrite(newPath);
    } else {
      await changeVaultPath(newPath);
      updateConfig({ vaultPath: newPath });
    }
  }, [config, updateConfig]);

  const handleConfirmOverwrite = useCallback(async () => {
    if (!confirmOverwrite) return;
    await changeVaultPath(confirmOverwrite);
    updateConfig({ vaultPath: confirmOverwrite });
    setConfirmOverwrite(null);
  }, [confirmOverwrite, updateConfig]);

  const vaultPathDisplay = config?.vaultPath
    ? config.vaultPath.split('\\').pop()?.split('/').pop() ?? config.vaultPath
    : 'Not set';

  const vaultDir = config?.vaultPath
    ? config.vaultPath.split('\\').slice(0, -1).join('\\') ||
      config.vaultPath.split('/').slice(0, -1).join('/')
    : '';

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface-window border border-border rounded-xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header — strong bottom border */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border-strong shrink-0">
          <h2 className="text-sm text-text-primary font-medium">Settings</h2>
          <button
            onClick={onClose}
            className="p-2.5 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
            aria-label="Close settings"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-6 flex-1">
          {/* Vault section */}
          <section>
            <h3 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Vault
            </h3>
            <div className="bg-surface-raised border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-secondary mb-0.5">Current file</p>
                  <p className="text-sm text-text-primary truncate" title={config?.vaultPath ?? ''}>
                    {vaultPathDisplay}
                  </p>
                  {vaultDir && (
                    <p className="text-xs text-text-muted truncate mt-0.5">{vaultDir}</p>
                  )}
                </div>
                <button
                  onClick={handleChangePath}
                  className="text-sm text-text-secondary border border-border rounded-md px-3 py-1.5 hover:bg-surface-hover transition-colors shrink-0"
                >
                  Change path
                </button>
              </div>
            </div>
          </section>

          {/* Security section */}
          <section>
            <h3 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Security
            </h3>
            <div className="bg-surface-raised border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-secondary">Auto-lock after</label>
                <span className="text-xs text-text-muted font-mono">
                  {config ? Math.round(config.lockTimeoutMs / 60_000) : 5} min
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={config ? Math.round(config.lockTimeoutMs / 60_000) : 5}
                onChange={e => {
                  const minutes = Number(e.target.value);
                  updateConfig({ lockTimeoutMs: minutes * 60_000 });
                }}
                className="w-full accent-accent"
                aria-label="Lock timeout in minutes"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>1 min</span>
                <span>60 min</span>
              </div>
            </div>
          </section>

          {/* Clipboard section */}
          <section>
            <h3 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Clipboard
            </h3>
            <div className="bg-surface-raised border border-border rounded-lg p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-text-secondary">Clear after</label>
                  <span className="text-xs text-text-muted font-mono">
                    {config ? Math.round(config.clipboardTimeoutMs / 1000) : 30}s
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={config ? Math.round(config.clipboardTimeoutMs / 1000) : 30}
                  onChange={e => {
                    const seconds = Number(e.target.value);
                    updateConfig({ clipboardTimeoutMs: seconds * 1000 });
                  }}
                  className="w-full accent-accent"
                  aria-label="Clipboard timeout in seconds"
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>15s</span>
                  <span>120s</span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config?.clipboardAutoClear ?? true}
                  onChange={e => updateConfig({ clipboardAutoClear: e.target.checked })}
                  className="accent-accent"
                />
                <span className="text-xs text-text-secondary">Auto-clear clipboard</span>
              </label>
            </div>
          </section>

          {/* Conflict section */}
          <section>
            <h3 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Sync Conflicts
            </h3>
            <div className="bg-surface-raised border border-border rounded-lg p-4 space-y-3">
              <p className="text-xs text-text-secondary">
                The vault file path IS the sync path — point it at any folder
                managed by Dropbox, iCloud, OneDrive, or another sync provider.
                The provider moves the encrypted file between devices.
              </p>
              {hasConflict ? (
                <div className="flex items-center gap-2 text-xs text-status-warning">
                  <AlertTriangle size={14} />
                  <span>Conflict copy detected — resolution coming in a future update</span>
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  No conflicts detected
                </p>
              )}
              <button
                onClick={checkForConflicts}
                className="w-full text-sm text-text-secondary border border-border rounded-md px-3 py-1.5 hover:bg-surface-hover transition-colors"
              >
                Check for conflicts
              </button>
            </div>
          </section>
        </div>

        {confirmOverwrite && (
          <ConfirmDialog
            title="Overwrite vault file?"
            message={`A vault file already exists at this path. Overwriting will replace it with the current vault data.`}
            confirmLabel="Overwrite"
            onConfirm={handleConfirmOverwrite}
            onCancel={() => setConfirmOverwrite(null)}
          />
        )}
      </div>
    </div>
  );
}
