import { useEffect } from 'react';

type ErrorToastProps = {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
};

export function ErrorToast({ message, onDismiss, duration = 4000 }: ErrorToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, onDismiss, duration]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-status-error/15 border border-status-error/30 rounded-lg px-4 py-2.5 z-50">
      <span className="text-xs text-status-error">{message}</span>
    </div>
  );
}
