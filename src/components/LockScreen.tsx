import { useState, useEffect, useCallback } from 'react';
import { useVault } from '../context/VaultContext';
import { getDefaultVaultPath, vaultExists, createVault, unlockVault, switchVault, sanitizeVaultName, pickVaultPath } from '../lib/ipc';
import { UnlockView } from './UnlockView';
import { CreateVaultView } from './CreateVaultView';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function vaultNameFromPath(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  const filename = parts[parts.length - 1] || '';
  return filename.replace(/\.cvault$/i, '') || 'Vault';
}

export function LockScreen() {
  const { unlockVault: setUnlocked, config, updateConfig } = useVault();

  const [mode, setMode] = useState<'loading' | 'unlock' | 'create'>('loading');
  const [vaultPath, setVaultPath] = useState('');
  const [vaultName, setVaultName] = useState('');
  const [defaultFolder, setDefaultFolder] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    (async () => {
      try {
        // Always fetch the app_data_dir path so the Create screen's "Save location"
        // always defaults to AppData/Roaming/com.credvault.app, regardless of where
        // any existing vault lives.
        const appDefaultPath = await getDefaultVaultPath();
        if (cancelled) return;
        setDefaultFolder(appDefaultPath.replace(/[^/\\]+\.cvault$/i, '').replace(/[\\/]$/, ''));

        let path = config.vaultPath;
        let name = config.vaultName;

        if (!path) {
          path = appDefaultPath;
          name = vaultNameFromPath(path);
        }

        if (!name) {
          name = vaultNameFromPath(path);
        }

        setVaultPath(path);
        setVaultName(name);

        const exists = await vaultExists(path);
        if (cancelled) return;
        if (exists) {
          setMode('unlock');
        } else {
          setMode('create');
        }
      } catch {
        if (cancelled) return;
        setError('Failed to initialize vault path');
        setMode('unlock');
      }
    })();
    return () => { cancelled = true; };
  }, [config]);

  const handleUnlock = useCallback(async () => {
    if (!password || !vaultPath || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const { entries, vaultId } = await unlockVault(password, vaultPath);
      const recentVaults = (config?.recentVaults ?? []).filter(v => v.path !== vaultPath);
      recentVaults.unshift({ vaultId, name: vaultName, path: vaultPath });
      updateConfig({ vaultPath, vaultName, recentVaults });
      setUnlocked(entries);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(capitalize(message));
    } finally {
      setSubmitting(false);
    }
  }, [password, vaultPath, vaultName, submitting, config?.recentVaults, setUnlocked, updateConfig]);

  const handleSwitchVault = useCallback(async (path: string) => {
    try {
      const result = await switchVault(path);
      if (!result.exists) {
        // Vault file is gone — prune it from recents and show a clear error
        const pruned = (config?.recentVaults ?? []).filter(v => v.path !== path);
        updateConfig({ recentVaults: pruned });
        setError(`Vault file not found: ${path}`);
        return;
      }
      setVaultPath(path);
      setVaultName(result.vaultName);
      setMode('unlock');
      setPassword('');
      setError('');
      setSubmitting(false);
    } catch {
      setError('Failed to switch vault');
    }
  }, [config?.recentVaults, updateConfig]);

  const handleBrowseVault = useCallback(async () => {
    try {
      const path = await pickVaultPath();
      if (!path) return;
      await handleSwitchVault(path);
    } catch {
      setError('Failed to open file picker');
    }
  }, [handleSwitchVault]);

  const handleCreate = useCallback(async (newVaultName: string, folderPath: string) => {
    setSubmitting(true);
    setError('');
    try {
      const sanitized = await sanitizeVaultName(newVaultName);
      const finalPath = `${folderPath.replace(/\\/g, '/')}/${sanitized}.cvault`;
      await createVault(password, finalPath);
      const { entries, vaultId } = await unlockVault(password, finalPath);
      const recentVaults = (config?.recentVaults ?? []).filter(v => v.path !== finalPath);
      recentVaults.unshift({ vaultId, name: newVaultName, path: finalPath });
      updateConfig({ vaultPath: finalPath, vaultName: newVaultName, recentVaults });
      setVaultPath(finalPath);
      setVaultName(newVaultName);
      setUnlocked(entries);
    } catch {
      setError('Failed to create vault');
    } finally {
      setSubmitting(false);
    }
  }, [password, submitting, config?.recentVaults, setUnlocked, updateConfig]);

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-surface-window flex items-center justify-center">
        <p className="text-sm text-text-muted">Initializing…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-window flex flex-col items-center justify-center px-6"
      style={{ paddingTop: '5vh' }}
    >
      <div className="w-[360px]">
        <h1 className="text-sm text-text-secondary font-medium text-center mb-1">
          CredVault
        </h1>
        <p className="text-xs text-text-muted text-center mb-6">
          Zero-knowledge credential manager
        </p>

        {mode === 'unlock' ? (
          <UnlockView
            vaultPath={vaultPath}
            vaultName={vaultName}
            config={config}
            password={password}
            error={error}
            submitting={submitting}
            onPasswordChange={setPassword}
            onUnlock={handleUnlock}
            onSwitchVault={handleSwitchVault}
            onBrowseVault={handleBrowseVault}
            onSwitchToCreate={() => { setMode('create'); setPassword(''); setError(''); }}
          />
        ) : (
          <>
            <div className="w-full text-center text-sm text-text-muted mb-6">
              Create new vault
            </div>
            <CreateVaultView
              password={password}
              error={error}
              submitting={submitting}
              defaultFolder={defaultFolder}
              onPasswordChange={setPassword}
              onCreate={handleCreate}
              onSwitchToUnlock={() => {
                // Restore the last known vault from config so the unlock screen
                // isn't blank when the user clicks "Already have a vault? Unlock existing".
                const restoredPath = config?.vaultPath || '';
                const restoredName = config?.vaultName || (restoredPath ? vaultNameFromPath(restoredPath) : '');
                setVaultPath(restoredPath);
                setVaultName(restoredName);
                setMode('unlock');
                setPassword('');
                setError('');
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
