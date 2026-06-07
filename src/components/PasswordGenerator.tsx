import { useState, useCallback } from 'react';
import { Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { generatePassword } from '../lib/ipc';

type PasswordGeneratorProps = {
  onGenerate: (password: string) => void;
};

export function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const password = await generatePassword(length, {
        uppercase,
        lowercase,
        numbers,
        symbols,
      });
      onGenerate(password);
    } catch {
      // Password field stays as-is on error
    } finally {
      setGenerating(false);
    }
  }, [length, uppercase, lowercase, numbers, symbols, onGenerate]);

  return (
    <div className="mt-2">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <Wand2 size={14} />
        Generate password
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {!collapsed && (
        <div className="mt-3 bg-surface-raised border border-white/8 rounded-md p-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-text-secondary">Length</label>
              <span className="text-xs text-text-muted font-mono">{length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={e => setLength(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={e => setUppercase(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-xs text-text-secondary">A-Z</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={lowercase}
                onChange={e => setLowercase(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-xs text-text-secondary">a-z</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={numbers}
                onChange={e => setNumbers(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-xs text-text-secondary">0-9</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={symbols}
                onChange={e => setSymbols(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-xs text-text-secondary">!@#$%</span>
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full text-xs text-text-secondary border border-white/12 rounded-md px-3 py-1.5 hover:bg-surface-hover transition-colors disabled:opacity-40"
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      )}
    </div>
  );
}
