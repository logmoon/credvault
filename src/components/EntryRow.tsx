import { User, Key, ExternalLink } from 'lucide-react';
import { type Entry } from '../lib/types';

type EntryRowProps = {
  entry: Entry;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onCopyUsername: (id: string) => void;
  onCopyPassword: (id: string) => void;
  onOpenUrl: (url: string) => void;
  isValidUrl: (url: string) => boolean;
};

export function EntryRow({ entry, isSelected, onSelect, onCopyUsername, onCopyPassword, onOpenUrl, isValidUrl }: EntryRowProps) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onSelect(entry.id); }}
      className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors border-l-2 ${
        isSelected ? 'bg-surface-raised border-accent' : 'border-transparent hover:bg-surface-hover'
      }`}
    >
      <div className="flex-1 min-w-0 mr-2">
        <p className="text-sm text-text-primary font-medium truncate">{entry.title}</p>
        <p className="text-xs text-text-secondary truncate mt-0.5">{entry.username}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onCopyUsername(entry.id)}
          className="p-2 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
          aria-label="Copy username"
          title="Copy username"
        >
          <User size={16} />
        </button>
        <button
          onClick={() => onCopyPassword(entry.id)}
          className="p-2 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
          aria-label="Copy password"
          title="Copy password"
        >
          <Key size={16} />
        </button>
        {entry.url && isValidUrl(entry.url) && (
          <button
            onClick={() => onOpenUrl(entry.url!)}
            className="p-2 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
            aria-label="Open URL"
            title="Open URL"
          >
            <ExternalLink size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
