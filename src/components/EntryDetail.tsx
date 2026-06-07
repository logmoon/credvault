import { useState, useCallback } from 'react';
import { Trash2, X } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { EntryForm, type EntryFormValues } from './EntryForm';
import { ConfirmDialog } from './ConfirmDialog';

type EntryDetailProps = {
  entryId: string;
  onClose: () => void;
};

export function EntryDetail({ entryId, onClose }: EntryDetailProps) {
  const { entries, updateEntry, deleteEntry } = useVault();

  const entry = entries?.find(e => e.id === entryId);

  const [values, setValues] = useState<EntryFormValues>(() => ({
    title: entry?.title ?? '',
    username: entry?.username ?? '',
    password: entry?.password ?? '',
    url: entry?.url ?? '',
  }));
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (!validate() || submitting || !entry) return;
    setSubmitting(true);
    try {
      updateEntry(entryId, {
        title: values.title.trim(),
        username: values.username.trim(),
        password: values.password,
        url: values.url.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [validate, submitting, entry, updateEntry, entryId, values, onClose]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      deleteEntry(entryId);
      setShowDelete(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  }, [deleteEntry, entryId, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.target instanceof HTMLInputElement && values.title.trim()) {
      handleSave();
    }
  }, [onClose, handleSave, values.title]);

  if (!entry) {
    return null;
  }

  return (
    <div className="h-full flex flex-col p-6" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm text-text-primary font-medium truncate">{entry.title}</h2>
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
        initialPasswordVisible={false}
      />

      <div className="flex items-center justify-between pt-6 border-t border-white/8 mt-6">
        <button
          onClick={() => setShowDelete(true)}
          className="flex items-center gap-1.5 text-sm text-status-error border border-status-error/30 rounded-md px-3 py-2 hover:bg-status-error/15 transition-colors"
        >
          <Trash2 size={14} />
          Delete
        </button>
        <button
          onClick={handleSave}
          disabled={submitting || !values.title.trim()}
          className="bg-accent hover:bg-accent-dark disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          Save
        </button>
      </div>

      {showDelete && (
        <ConfirmDialog
          title="Delete entry"
          message="Delete this entry? This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}
    </div>
  );
}
