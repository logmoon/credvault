import { useState, useCallback, memo } from 'react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { isValidUrl } from '../lib/url';
import { PasswordGenerator } from './PasswordGenerator';

export type EntryFormValues = {
  title: string;
  username: string;
  password: string;
  url: string;
};

type EntryFormProps = {
  values: EntryFormValues;
  onChange: (field: keyof EntryFormValues, value: string) => void;
  errors?: { title?: string };
  onPasswordGenerated: (password: string) => void;
  initialPasswordVisible?: boolean;
};

export const EntryForm = memo(function EntryForm({
  values,
  onChange,
  errors,
  onPasswordGenerated,
  initialPasswordVisible = true,
}: EntryFormProps) {
  const [showPassword, setShowPassword] = useState(initialPasswordVisible);

  const handleChange = useCallback(
    (field: keyof EntryFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(field, e.target.value);
      },
    [onChange],
  );

  return (
    <div className="space-y-4 flex-1">
      <div>
        <label className="block text-xs text-text-secondary mb-1.5">Title</label>
        <input
          type="text"
          value={values.title}
          onChange={handleChange('title')}
          className={`w-full bg-surface border rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none appearance-none ${
            errors?.title ? 'border-status-error/60' : 'border-white/12 focus:border-accent/50'
          }`}
          placeholder="e.g. Work Gmail"
          autoFocus
        />
        {errors?.title && (
          <p className="text-xs text-status-error mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-xs text-text-secondary mb-1.5">Username</label>
        <input
          type="text"
          value={values.username}
          onChange={handleChange('username')}
          className="w-full bg-surface border border-white/12 rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none"
          placeholder="user@example.com"
        />
      </div>

      <div>
        <label className="block text-xs text-text-secondary mb-1.5 font-mono">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={values.password}
            onChange={handleChange('password')}
            className="w-full font-mono bg-surface border border-white/12 rounded-md px-3 py-2 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none"
            placeholder="Generated or typed password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <PasswordGenerator onGenerate={onPasswordGenerated} />
      </div>

      <div>
        <label className="block text-xs text-text-secondary mb-1.5">URL</label>
        <div className="relative">
          <input
            type="text"
            value={values.url}
            onChange={handleChange('url')}
            className="w-full bg-surface border border-white/12 rounded-md px-3 py-2 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 appearance-none"
            placeholder="https://"
          />
          {isValidUrl(values.url) && (
            <button
              type="button"
              onClick={() => {
                const normalized =
                  values.url.startsWith('http://') || values.url.startsWith('https://')
                    ? values.url
                    : `https://${values.url}`;
                open(normalized);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
              tabIndex={-1}
              aria-label="Open URL"
              title="Open URL"
            >
              <ExternalLink size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
