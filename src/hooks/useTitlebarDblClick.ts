import { useEffect, useState, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/plugin-os';

// REASON: Windows toggles maximize natively when a data-tauri-drag-region element
// is double-clicked; Linux/macOS do not. The platform guard prevents a double
// toggle on Windows, where the native behavior and this handler would both fire.
export function useTitlebarDblClick(): () => void {
  const [isWindows, setIsWindows] = useState(false);

  useEffect(() => {
    try {
      setIsWindows(platform() === 'windows');
    } catch {
      setIsWindows(false);
    }
  }, []);

  return useCallback(() => {
    if (isWindows) return;
    getCurrentWindow()
      .toggleMaximize()
      .catch(e => console.error('Failed to toggle maximize:', e));
  }, [isWindows]);
}
