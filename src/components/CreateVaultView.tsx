import { useState, useEffect } from 'react';
import { Eye, EyeOff, FolderOpen } from 'lucide-react';
import { pickFolder } from '../lib/ipc';

type CreateVaultViewProps = {
  password: string;
  error: string;
  submitting: boolean;
  defaultFolder: string;
  onPasswordChange: (val: string) => void;
  onCreate: (vaultName: string, folderPath: string) => void;
  onSwitchToUnlock: () => void;
};

export function CreateVaultView({
  password,
  error,
  submitting,
  defaultFolder,
  onPasswordChange,
  onCreate,
  onSwitchToUnlock,
}: CreateVaultViewProps) {
  const [newVaultName, setNewVaultName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveFolder, setSaveFolder] = useState(defaultFolder);

  // Sync saveFolder if the defaultFolder prop arrives late (async load from app_data_dir)
  useEffect(() => {
    if (defaultFolder) setSaveFolder(defaultFolder);
  }, [defaultFolder]);
  const [localError, setLocalError] = useState('');

  const passwordsMatch = password === confirmPassword;

  const handlePickFolder = async () => {
    try {
      const folder = await pickFolder();
      if (folder) setSaveFolder(folder);
    } catch {
      setLocalError('Failed to open folder picker');
    }
  };

  const handleSubmit = () => {
    setLocalError('');
    if (!newVaultName.trim()) {
      setLocalError('Please enter a vault name');
      return;
    }
    if (!password) {
      setLocalError('Please enter a master password');
      return;
    }
    if (!confirmPassword) {
      setLocalError('Please confirm your master password');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    onCreate(newVaultName.trim(), saveFolder);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const displayError = localError || error;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-text-secondary mb-1.5">
          Vault name
        </label>
        <input
          type="text"
          value={newVaultName}
          onChange={e => { setNewVaultName(e.target.value); setLocalError(''); }}
          className="w-full bg-surface border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none"
          placeholder="e.g. Personal, Work"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs text-text-secondary mb-1.5">
          Save location
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface border border-border-subtle rounded-md px-3 py-2 text-xs text-text-muted truncate">
            {saveFolder}
          </div>
          <button
            type="button"
            onClick={handlePickFolder}
            className="flex items-center gap-1.5 text-xs text-text-secondary border border-border rounded-md px-3 py-2 hover:bg-surface-hover transition-colors shrink-0"
          >
            <FolderOpen size={14} />
            <span>Change</span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs text-text-secondary mb-1.5 font-mono">
          Master password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => { onPasswordChange(e.target.value); setLocalError(''); }}
            onKeyDown={handleKeyDown}
            className="w-full font-mono bg-surface border border-border-subtle rounded-md px-3 py-2 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none"
            placeholder="Enter master password"
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

      <div>
        <label className="block text-xs text-text-secondary mb-1.5 font-mono">
          Confirm password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setLocalError(''); }}
            onKeyDown={handleKeyDown}
            className="w-full font-mono bg-surface border border-border-subtle rounded-md px-3 py-2 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none"
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

      {displayError && (
        <p className="text-xs text-status-error">{displayError}</p>
      )}

      <div className="bg-surface-raised border-l-4 border-status-warning rounded-r-md p-4">
        <p className="text-xs leading-relaxed text-status-warning">
          <strong>There is no password recovery.</strong><br />
          Your master password is the only key to your vault.
          If you forget it, your data cannot be recovered —
          by anyone. Write it down somewhere safe.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || !password || !confirmPassword || !passwordsMatch || !newVaultName.trim()}
          className="bg-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          {submitting ? 'Creating…' : 'Create Vault'}
        </button>
      </div>

      <button
        onClick={onSwitchToUnlock}
        className="w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors mt-3"
      >
        Already have a vault? Unlock existing
      </button>
    </div>
  );
}
