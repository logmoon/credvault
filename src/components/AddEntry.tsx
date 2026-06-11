import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useVault } from '../context/VaultContext';
import { EntryForm, type EntryFormValues } from './EntryForm';

type AddEntryProps = {
  onClose: () => void;
};

export function AddEntry({ onClose }: AddEntryProps) {
  const { addEntry } = useVault();

  const [values, setValues] = useState<EntryFormValues>({
    title: '',
    username: '',
    password: '',
    url: '',
  });
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof EntryFormValues, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (field === 'title') {
      setErrors(prev => ({ ...prev, title: undefined }));
    }
  }, []);

  const handlePasswordGenerated = useCallback((password: string) => {
    setValues(prev => ({ ...prev, password }));
  }, []);

  const validate = useCallback((): boolean => {
    if (!values.title.trim()) {
      setErrors({ title: 'Title is required' });
      return false;
    }
    return true;
  }, [values.title]);

  const handleSave = useCallback(async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const now = Date.now();
      addEntry({
        id: uuidv4(),
        createdAt: now,
        modifiedAt: now,
        title: values.title.trim(),
        username: values.username.trim(),
        password: values.password,
        url: values.url.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [values, validate, submitting, addEntry, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.target instanceof HTMLInputElement && values.title.trim()) {
      handleSave();
    }
  }, [onClose, handleSave, values.title]);

  return (
    <div className="absolute inset-0 flex flex-col" onKeyDown={handleKeyDown}>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm text-text-primary font-medium">New entry</h2>
          <button
            onClick={onClose}
            className="p-2.5 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <EntryForm
          values={values}
          onChange={handleChange}
          errors={errors}
          onPasswordGenerated={handlePasswordGenerated}
        />
      </div>

      {/* Fixed footer — default border to clearly separate from scroll content */}
      <div className="flex items-center justify-end px-6 py-4 border-t border-border shrink-0">
        <button
          onClick={handleSave}
          disabled={submitting || !values.title.trim()}
          className="bg-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
