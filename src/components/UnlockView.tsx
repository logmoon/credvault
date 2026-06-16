import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, ChevronDown, FolderOpen, Plus } from 'lucide-react';
import { type RecentVault, type VaultConfig } from '../lib/types';

type UnlockViewProps = {
  vaultPath: string;
  vaultName: string;
  config: VaultConfig | null;
  password: string;
  error: string;
  submitting: boolean;
  onPasswordChange: (val: string) => void;
  onUnlock: () => void;
  onSwitchVault: (path: string) => void;
  onBrowseVault: () => void;
  onSwitchToCreate: () => void;
};

export function UnlockView({
  vaultPath,
  vaultName,
  config,
  password,
  error,
  submitting,
  onPasswordChange,
  onUnlock,
  onSwitchVault,
  onBrowseVault,
  onSwitchToCreate,
}: UnlockViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onUnlock();
  };

  const recentVaults: RecentVault[] = config?.recentVaults ?? [];

  return (
    <>
      <div className="relative mb-6">
        <button
          ref={buttonRef}
          onClick={() => setPickerOpen(p => !p)}
          className="w-full flex items-center justify-center gap-1.5 text-sm text-text-primary font-medium hover:text-accent transition-colors"
        >
          <Lock size={14} className="text-text-muted shrink-0" />
          <span className="truncate">{vaultName || 'Select a vault'}</span>
          <ChevronDown size={14} className={`transition-transform shrink-0 ${pickerOpen ? 'rotate-180' : ''}`} />
        </button>

        {pickerOpen && (
          <div
            ref={pickerRef}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[320px] bg-surface-overlay border border-border-subtle rounded-lg z-50 p-3"
          >
            <p className="text-xs text-text-muted mb-2">Switch vault</p>

            {recentVaults.length > 0 && (
              <div className="space-y-1 mb-3 max-h-[200px] overflow-y-auto">
                {recentVaults.slice(0, 3).map((rv: RecentVault) => (
                  <button
                    key={rv.path}
                    onClick={() => { onSwitchVault(rv.path); setPickerOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      rv.path === vaultPath
                        ? 'bg-surface-hover text-text-primary'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    <p className="text-xs font-medium">{rv.name}</p>
                    <p className="text-xs text-text-muted truncate">{rv.path}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1 pt-2 border-t border-border-subtle">
              <button
                onClick={() => { onBrowseVault(); setPickerOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              >
                <FolderOpen size={14} />
                <span>Browse for vault file…</span>
              </button>
              <button
                onClick={() => { onSwitchToCreate(); setPickerOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              >
                <Plus size={14} />
                <span>Create new vault…</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1.5 font-mono">
            Master password
          </label>
          <div className="relative">
            <input
              type="text"
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!vaultPath}
              className={`w-full font-mono bg-surface border border-border-subtle rounded-md px-3 py-2 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none disabled:opacity-40 disabled:cursor-not-allowed ${!showPassword ? '[-webkit-text-security:disc]' : ''}`}
              placeholder={vaultPath ? 'Enter master password' : 'Select a vault first'}
              autoFocus={!!vaultPath}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-status-error">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            onClick={onUnlock}
            disabled={submitting || !vaultPath || !password}
            className="bg-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {submitting ? 'Unlocking…' : 'Unlock'}
          </button>
        </div>
      </div>
    </>
  );
}
