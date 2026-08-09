import { Minus, Square, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function WindowControls() {
  const handleMinimize = () => {
    getCurrentWindow()
      .minimize()
      .catch(e => console.error('Failed to minimize window:', e));
  };

  const handleMaximizeToggle = () => {
    getCurrentWindow()
      .toggleMaximize()
      .catch(e => console.error('Failed to toggle maximize:', e));
  };

  const handleClose = () => {
    getCurrentWindow()
      .close()
      .catch(e => console.error('Failed to close window:', e));
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleMinimize}
        className="p-2 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-primary"
        aria-label="Minimize window"
        title="Minimize"
      >
        <Minus size={16} />
      </button>
      <button
        onClick={handleMaximizeToggle}
        className="p-2 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-primary"
        aria-label="Maximize window"
        title="Maximize"
      >
        <Square size={13} />
      </button>
      <button
        onClick={handleClose}
        className="p-2 rounded hover:bg-status-error transition-colors text-text-muted hover:text-white"
        aria-label="Close window"
        title="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}
