import { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect, type ReactNode } from 'react';
import { type Entry, type VaultConfig } from '../lib/types';
import { saveVault, lockVault as lockVaultIpc, loadConfig, saveConfig, checkConflicts } from '../lib/ipc';

type VaultState = {
  locked: boolean;
  entries: Entry[] | null;
  config: VaultConfig | null;
  lastLockReason: 'inactivity' | null;
  hasBlockingConflict: boolean;
  lockVault: (reason?: 'inactivity') => void;
  unlockVault: (entries: Entry[]) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, fields: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  updateConfig: (fields: Partial<VaultConfig>) => void;
  clearLockReason: () => void;
  clearBlockingConflict: () => void;
};

const VaultContext = createContext<VaultState | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(true);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [config, setConfig] = useState<VaultConfig | null>(null);
  const [lastLockReason, setLastLockReason] = useState<'inactivity' | null>(null);
  const [hasBlockingConflict, setHasBlockingConflict] = useState(false);
  const entriesRef = useRef<Entry[] | null>(null);
  const configRef = useRef<VaultConfig | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const pendingSaveRef = useRef(false);

  useEffect(() => {
    loadConfig()
      .then((cfg) => {
        setConfig(cfg);
        configRef.current = cfg;
      })
      .catch(() => {
        // First run — no config file yet; use defaults
        const defaults = {
          vaultPath: '',
          vaultName: 'Vault',
          lockTimeoutMs: 300_000,
          clipboardTimeoutMs: 30_000,
          clipboardAutoClear: true,
          recentVaults: [],
        };
        setConfig(defaults);
        configRef.current = defaults;
      });
  }, []);

  const triggerSave = useCallback(async () => {
    const doSave = async () => {
      const currentEntries = entriesRef.current;
      if (!currentEntries) return;

      try {
        await saveVault(currentEntries);
      } catch {
        // If the vault was locked while save was in flight, entries are already
        // gone from context — no need to surface an error to the user.
        if (entriesRef.current !== null) {
          console.error('Vault save failed');
        }
      }

      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        await doSave();
      }
    };

    // Check for conflicts before saving — prevents overwriting a conflicted copy
    const cfg = configRef.current;
    if (cfg?.vaultPath) {
      try {
        const conflicts = await checkConflicts(cfg.vaultPath);
        if (conflicts.length > 0) {
          setHasBlockingConflict(true);
          return;
        }
      } catch {
        // Silently proceed with save if the check fails
      }
    }

    if (savePromiseRef.current) {
      pendingSaveRef.current = true;
    } else {
      savePromiseRef.current = doSave().finally(() => {
        savePromiseRef.current = null;
      });
    }
  }, []);

  const lockVault = useCallback((reason?: 'inactivity') => {
    setEntries(null);
    setLocked(true);
    setLastLockReason(reason ?? null);
    entriesRef.current = null;
    setHasBlockingConflict(false);
    lockVaultIpc();
  }, []);

  // password and vaultPath are no longer needed on the frontend —
  // the backend caches the derived key in SessionState after unlock
  const unlockVault = useCallback((unlockedEntries: Entry[]) => {
    setEntries(unlockedEntries);
    entriesRef.current = unlockedEntries;
    setLocked(false);
  }, []);

  const addEntry = useCallback((entry: Entry) => {
    setEntries(prev => {
      const next = prev ? [...prev, entry] : [entry];
      entriesRef.current = next;
      return next;
    });
    queueMicrotask(() => triggerSave());
  }, [triggerSave]);

  const updateEntry = useCallback((id: string, fields: Partial<Entry>) => {
    setEntries(prev => {
      if (!prev) return prev;
      const next = prev.map(e => e.id === id ? { ...e, ...fields, modifiedAt: Date.now() } : e);
      entriesRef.current = next;
      return next;
    });
    queueMicrotask(() => triggerSave());
  }, [triggerSave]);

  const clearLockReason = useCallback(() => setLastLockReason(null), []);

  const clearBlockingConflict = useCallback(() => {
    setHasBlockingConflict(false);
    // Retry the pending save now that conflict is resolved
    triggerSave();
  }, [triggerSave]);

  const updateConfig = useCallback((fields: Partial<VaultConfig>) => {
    setConfig(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...fields };
      configRef.current = next;
      saveConfig(next).catch(() => {
        console.error('Failed to save config');
      });
      return next;
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      if (!prev) return prev;
      const next = prev.filter(e => e.id !== id);
      entriesRef.current = next;
      return next;
    });
    queueMicrotask(() => triggerSave());
  }, [triggerSave]);

  const value = useMemo(() => ({
    locked,
    entries,
    config,
    lastLockReason,
    hasBlockingConflict,
    lockVault,
    unlockVault,
    addEntry,
    updateEntry,
    deleteEntry,
    updateConfig,
    clearLockReason,
    clearBlockingConflict,
  }), [locked, entries, config, lastLockReason, hasBlockingConflict, lockVault, unlockVault, addEntry, updateEntry, deleteEntry, updateConfig, clearLockReason, clearBlockingConflict]);

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault(): VaultState {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}
