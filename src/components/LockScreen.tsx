import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { getDefaultVaultPath, vaultExists, createVault, unlockVault } from '../lib/ipc';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function LockScreen() {
  const { unlockVault: setUnlocked } = useVault();

  const [mode, setMode] = useState<'loading' | 'unlock' | 'create'>('loading');
  const [vaultPath, setVaultPath] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = await getDefaultVaultPath();
        if (cancelled) return;
        setVaultPath(path);
        const exists = await vaultExists(path);
        if (cancelled) return;
        setMode(exists ? 'unlock' : 'create');
      } catch {
        if (cancelled) return;
        setError('Failed to initialize vault path');
        setMode('unlock');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUnlock = useCallback(async () => {
    if (!password || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const entries = await unlockVault(password, vaultPath);
      setUnlocked(entries, password);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(capitalize(message));
    } finally {
      setSubmitting(false);
    }
  }, [password, vaultPath, submitting, setUnlocked]);

  const handleCreate = useCallback(async () => {
    if (!password || !confirmPassword || submitting) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createVault(password, vaultPath);
      const entries = await unlockVault(password, vaultPath);
      setUnlocked(entries, password);
    } catch {
      setError('Failed to create vault');
    } finally {
      setSubmitting(false);
    }
  }, [password, confirmPassword, vaultPath, submitting, setUnlocked]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'unlock') {
        handleUnlock();
      } else {
        handleCreate();
      }
    }
  }, [mode, handleUnlock, handleCreate]);

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-surface-window flex items-center justify-center">
        <p className="text-sm text-text-muted">Initializing…</p>
      </div>
    );
  }

  const passwordsMatch = password === confirmPassword;

  return (
    <div className="min-h-screen bg-surface-window flex flex-col items-center justify-center px-6"
      style={{ paddingTop: '5vh' }}
    >
      <div className="w-[360px]">
        <h1 className="text-sm text-text-secondary font-medium text-center mb-1">
          CredVault
        </h1>
        <p className="text-xs text-text-muted text-center mb-8">
          Zero-knowledge credential manager
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5 font-mono">
              Master password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                className="w-full font-mono bg-surface border border-white/12 rounded-md px-3 py-2 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none"
                placeholder="Enter master password"
                autoFocus
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

          {mode === 'create' && (
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 font-mono">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                  onKeyDown={handleKeyDown}
                className="w-full font-mono bg-surface border border-white/12 rounded-md px-3 py-2 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none"
                placeholder="Re-enter master password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(p => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-status-error">{error}</p>
          )}

          {mode === 'create' && (
            <div className="bg-surface-raised border-l-4 border-status-warning rounded-r-md p-4">
              <p className="text-xs leading-relaxed text-status-warning">
                <strong>There is no password recovery.</strong><br />
                Your master password is the only key to your vault.
                If you forget it, your data cannot be recovered —
                by anyone. Write it down somewhere safe.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={mode === 'unlock' ? handleUnlock : handleCreate}
              disabled={
                submitting ||
                !password ||
                (mode === 'create' && (!confirmPassword || !passwordsMatch))
              }
              className="bg-accent hover:bg-accent-dark disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              {submitting
                ? (mode === 'unlock' ? 'Unlocking…' : 'Creating…')
                : (mode === 'unlock' ? 'Unlock' : 'Create Vault')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
