import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { getConflictsInfo, resolveConflicts } from '../lib/ipc';
import { type ConflictFile } from '../lib/types';

type ConflictDialogProps = {
  vaultPath: string;
  conflictPaths: string[];
  onClose: () => void;
  onResolved: () => void;
  onLockNeeded: () => void;
};

function formatTimestamp(unix: number): string {
  const d = new Date(unix * 1000);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (isToday) return `saved today at ${time}`;
  return `saved ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${time}`;
}

export function ConflictDialog({ vaultPath, conflictPaths, onClose, onResolved, onLockNeeded }: ConflictDialogProps) {
  const [vaultModifiedAt, setVaultModifiedAt] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<ConflictFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await getConflictsInfo(vaultPath, conflictPaths);
        if (cancelled) return;
        setVaultModifiedAt(info.vaultModifiedAt);
        setConflicts(info.conflicts);
      } catch {
        if (cancelled) return;
        setError('Failed to read conflict information');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [vaultPath, conflictPaths]);

  const handleKeepCurrent = useCallback(async () => {
    setResolving(true);
    setError('');
    try {
      await resolveConflicts(vaultPath, vaultPath, conflictPaths);
      onResolved();
    } catch {
      setError('Failed to resolve conflict');
      setResolving(false);
    }
  }, [vaultPath, conflictPaths, onResolved]);

  const handleKeepConflict = useCallback(async (keeperPath: string) => {
    setResolving(true);
    setError('');
    try {
      await resolveConflicts(vaultPath, keeperPath, conflictPaths);
      onLockNeeded();
    } catch {
      setError('Failed to resolve conflict');
      setResolving(false);
    }
  }, [vaultPath, conflictPaths, onLockNeeded]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const disabled = loading || resolving;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={disabled ? undefined : onClose}
    >
      <div
        className="bg-surface-overlay border border-border-subtle rounded-xl w-full max-w-[460px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-status-warning" />
            <h3 className="text-sm text-text-primary font-medium">Resolve conflict</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-text-secondary px-5 pt-2 pb-3">
          Multiple versions of your vault exist. Choose which one to keep — all others will be deleted.
        </p>

        {loading && !error && (
          <div className="px-5 pb-5">
            <p className="text-sm text-text-muted text-center py-6">Scanning vaults…</p>
          </div>
        )}

        {error && !loading && (
          <div className="px-5 pb-5">
            <p className="text-xs text-status-error mb-3">{error}</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="text-sm text-text-secondary border border-border-subtle rounded-md px-4 py-2 hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!loading && !error && vaultModifiedAt !== null && (
          <div className="px-5 pb-5 space-y-2 max-h-[50vh] overflow-y-auto">
            {/* Current vault */}
            <div
              onClick={disabled ? undefined : handleKeepCurrent}
              className="w-full text-left bg-surface-raised border border-border-subtle rounded-lg p-4 cursor-pointer hover:border-accent/40 transition-colors disabled:opacity-40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-text-primary font-medium">Current vault</p>
                  <p className="text-xs text-text-muted mt-1">{formatTimestamp(vaultModifiedAt)}</p>
                </div>
                <div className="mt-0.5">
                  <span className="text-xs text-accent font-medium">Keep this</span>
                </div>
              </div>
            </div>

            {/* Conflicts list */}
            {conflicts.map((cf) => (
              <div
                key={cf.path}
                onClick={disabled ? undefined : () => handleKeepConflict(cf.path)}
                className="w-full text-left bg-surface-raised border border-border-subtle rounded-lg p-4 cursor-pointer hover:border-accent/40 transition-colors disabled:opacity-40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary font-medium truncate">{cf.fileName}</p>
                    <p className="text-xs text-text-muted mt-1">{formatTimestamp(cf.modifiedAt)}</p>
                  </div>
                  <div className="mt-0.5 shrink-0">
                    <span className="text-xs text-accent font-medium">Keep this</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            <button
              onClick={onClose}
              className="text-sm text-text-secondary border border-border-subtle rounded-md px-4 py-2 hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
