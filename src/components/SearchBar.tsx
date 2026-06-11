import { Search, X } from 'lucide-react';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="shrink-0 px-3 pt-3 pb-2">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search entries..."
          className="w-full bg-surface border border-border-subtle rounded-md pl-9 pr-8 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
            aria-label="Clear search"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
