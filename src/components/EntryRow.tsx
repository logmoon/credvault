import { User, Key } from 'lucide-react';
import { type Entry } from '../lib/types';

type EntryRowProps = {
  entry: Entry;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onCopyUsername: (id: string) => void;
  onCopyPassword: (id: string) => void;
};

export function EntryRow({ entry, isSelected, onSelect, onCopyUsername, onCopyPassword }: EntryRowProps) {
  return (
    <div
      onClick={() => onSelect(entry.id)}
      className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
        isSelected ? 'bg-accent-muted' : 'hover:bg-surface-hover'
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
      </div>
    </div>
  );
}
