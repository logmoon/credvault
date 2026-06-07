import { useState, useEffect, useCallback, useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { checkConflict } from '../lib/ipc';

type UseSyncReturn = {
  hasConflict: boolean;
  conflictPath: string | null;
  checkForConflicts: () => Promise<void>;
};

export function useSync(): UseSyncReturn {
  const { config } = useVault();
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictPath, setConflictPath] = useState<string | null>(null);
  const hasRunRef = useRef(false);

  const checkForConflicts = useCallback(async () => {
    if (!config?.vaultPath) return;
    try {
      const result = await checkConflict(config.vaultPath);
      if (result) {
        setHasConflict(true);
        setConflictPath(result);
      } else {
        setHasConflict(false);
        setConflictPath(null);
      }
    } catch {
      setHasConflict(false);
      setConflictPath(null);
    }
  }, [config?.vaultPath]);

  useEffect(() => {
    if (!config || hasRunRef.current) return;
    hasRunRef.current = true;
    checkForConflicts();
  }, [config, checkForConflicts]);

  return { hasConflict, conflictPath, checkForConflicts };
}