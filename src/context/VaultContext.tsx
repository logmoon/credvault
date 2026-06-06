import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { type Entry } from '../lib/types';

const MOCK_ENTRIES: Entry[] = [
  {
    id: 'mock-1',
    createdAt: Date.now() - 86400000 * 30,
    modifiedAt: Date.now() - 86400000 * 2,
    title: 'Work Gmail',
    username: 'alice@company.com',
    password: 'mock-password-1',
    url: 'https://mail.google.com',
  },
  {
    id: 'mock-2',
    createdAt: Date.now() - 86400000 * 20,
    modifiedAt: Date.now() - 86400000 * 5,
    title: 'GitHub',
    username: 'alice-dev',
    password: 'mock-password-2',
    url: 'https://github.com',
  },
  {
    id: 'mock-3',
    createdAt: Date.now() - 86400000 * 15,
    modifiedAt: Date.now() - 86400000 * 1,
    title: 'AWS Console',
    username: 'alice@company.com',
    password: 'mock-password-3',
    url: 'https://console.aws.amazon.com',
  },
  {
    id: 'mock-4',
    createdAt: Date.now() - 86400000 * 7,
    modifiedAt: Date.now() - 86400000 * 7,
    title: 'DigitalOcean',
    username: 'alice@company.com',
    password: 'mock-password-4',
    url: 'https://cloud.digitalocean.com',
  },
];

type VaultState = {
  locked: boolean;
  entries: Entry[] | null;
  isDirty: boolean;
  lockVault: () => void;
  unlockVault: (entries: Entry[], password: string) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, fields: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
};

const VaultContext = createContext<VaultState | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(true);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const passwordRef = useRef<string | null>(null);

  const lockVault = useCallback(() => {
    setEntries(null);
    setLocked(true);
    setIsDirty(false);
    passwordRef.current = null;
  }, []);

  const unlockVault = useCallback((unlockedEntries: Entry[], password: string) => {
    setEntries(unlockedEntries.length > 0 ? unlockedEntries : MOCK_ENTRIES);
    setLocked(false);
    setIsDirty(false);
    passwordRef.current = password;
  }, []);

  const addEntry = useCallback((entry: Entry) => {
    setEntries(prev => {
      if (!prev) return [entry];
      return [...prev, entry];
    });
    setIsDirty(true);
  }, []);

  const updateEntry = useCallback((id: string, fields: Partial<Entry>) => {
    setEntries(prev => {
      if (!prev) return prev;
      return prev.map(e => e.id === id ? { ...e, ...fields, modifiedAt: Date.now() } : e);
    });
    setIsDirty(true);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      if (!prev) return prev;
      return prev.filter(e => e.id !== id);
    });
    setIsDirty(true);
  }, []);

  return (
    <VaultContext.Provider
      value={{
        locked,
        entries,
        isDirty,
        lockVault,
        unlockVault,
        addEntry,
        updateEntry,
        deleteEntry,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault(): VaultState {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}
