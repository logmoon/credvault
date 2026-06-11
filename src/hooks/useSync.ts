import { useState, useEffect, useCallback, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { checkConflicts } from '../lib/ipc';

type UseSyncReturn = {
  conflictPaths: string[];
  hasConflict: boolean;
  checkForConflicts: () => Promise<void>;
};

export function useSync(): UseSyncReturn {
  const { config } = useVault();
  const [conflictPaths, setConflictPaths] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkForConflicts = useCallback(async () => {
    if (!config?.vaultPath) return;
    try {
      const paths = await checkConflicts(config.vaultPath);
      setConflictPaths(paths);
    } catch {
      setConflictPaths([]);
    }
  }, [config?.vaultPath]);

  // Poll for conflicts every 10s while unlocked
  const { locked } = useVault();
  useEffect(() => {
    if (locked && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    if (!locked && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        checkForConflicts();
      }, 10_000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [locked, checkForConflicts]);

  // Re-check when vaultPath changes
  useEffect(() => {
    checkForConflicts();
  }, [checkForConflicts]);

  return {
    conflictPaths,
    hasConflict: conflictPaths.length > 0,
    checkForConflicts,
  };
}
