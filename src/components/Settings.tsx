import { useCallback, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { showInFolder } from '../lib/ipc';

type SettingsProps = {
  onClose: () => void;
};

export function Settings({ onClose }: SettingsProps) {
  const { config, updateConfig } = useVault();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleShowInFolder = useCallback(async () => {
    if (!config?.vaultPath) return;
    try {
      await showInFolder(config.vaultPath);
    } catch {
      console.error('Failed to open folder');
    }
  }, [config?.vaultPath]);

  const vaultPathDisplay = config?.vaultPath ?? 'Not set';

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface-window border border-border rounded-xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
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
          {/* Vault section — read-only info */}
          <section>
            <h3 className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Vault
            </h3>
            <div className="bg-surface-raised border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-secondary mb-0.5">Name</p>
                  <p className="text-sm text-text-primary truncate">
                    {config?.vaultName || 'Vault'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Location</p>
                <p className="text-sm text-text-primary truncate" title={config?.vaultPath ?? ''}>
                  {vaultPathDisplay}
                </p>
              </div>
              {config?.vaultPath && (
                <button
                  onClick={handleShowInFolder}
                  className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors mt-1"
                >
                  <ExternalLink size={12} />
                  Show in folder
                </button>
              )}
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
        </div>
      </div>
    </div>
  );
}