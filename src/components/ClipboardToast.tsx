type ClipboardToastProps = {
  type: 'copied' | 'cleared';
  timeoutSecs?: number;
};

export function ClipboardToast({ type, timeoutSecs }: ClipboardToastProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-overlay border border-border-subtle rounded-lg px-4 py-2.5">
      <span className="text-xs text-text-primary whitespace-nowrap">
        {type === 'copied'
          ? `Copied — clears in ${timeoutSecs}s`
          : 'Clipboard cleared'}
      </span>
    </div>
  );
}
