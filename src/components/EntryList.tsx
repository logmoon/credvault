import { type Entry } from '../lib/types';
import { EntryRow } from './EntryRow';

type EntryListProps = {
  entries: Entry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCopyUsername: (id: string) => void;
  onCopyPassword: (id: string) => void;
  onOpenUrl: (url: string) => void;
  isValidUrl: (url: string) => boolean;
};

export function EntryList({ entries, selectedId, onSelect, onCopyUsername, onCopyPassword, onOpenUrl, isValidUrl }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-text-secondary">No entries yet</p>
          <p className="text-xs text-text-muted mt-1">Add your first credential to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
      {entries.map(entry => (
        <EntryRow
          key={entry.id}
          entry={entry}
          isSelected={selectedId === entry.id}
          onSelect={onSelect}
          onCopyUsername={onCopyUsername}
          onCopyPassword={onCopyPassword}
          onOpenUrl={onOpenUrl}
          isValidUrl={isValidUrl}
        />
      ))}
    </div>
  );
}
