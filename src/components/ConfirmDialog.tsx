import { useCallback, useEffect } from 'react';

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-surface-window border border-white/12 rounded-xl p-6 w-full max-w-[400px]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm text-text-primary font-medium mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm text-text-secondary border border-white/12 rounded-md px-4 py-2 hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-40 ${
              destructive
                ? 'text-status-error border border-status-error/30 hover:bg-status-error/15'
                : 'bg-accent hover:bg-accent-dark text-white'
            }`}
          >
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
