import { createContext, useContext, useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { type Entry } from '../lib/types';
import { saveVault, lockVault as lockVaultIpc } from '../lib/ipc';

type VaultState = {
  locked: boolean;
  entries: Entry[] | null;
  lockVault: () => void;
  unlockVault: (entries: Entry[]) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, fields: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
};

const VaultContext = createContext<VaultState | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(true);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const entriesRef = useRef<Entry[] | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const pendingSaveRef = useRef(false);

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

    if (savePromiseRef.current) {
      pendingSaveRef.current = true;
    } else {
      savePromiseRef.current = doSave().finally(() => {
        savePromiseRef.current = null;
      });
    }
  }, []);

  const lockVault = useCallback(() => {
    setEntries(null);
    setLocked(true);
    entriesRef.current = null;
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
    lockVault,
    unlockVault,
    addEntry,
    updateEntry,
    deleteEntry,
  }), [locked, entries, lockVault, unlockVault, addEntry, updateEntry, deleteEntry]);

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
