import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteEntry } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  entryId: number;
  status: string;
  hasPendingDeletion: boolean;
}

// Same delete-with-approval workflow as Pratisangraha: a draft is owned by
// whoever submitted it and can be deleted outright. A live (non-draft) entry
// goes through EntryDetailView.delete() on the backend, which decides
// immediate archive-delete (admin, or a confirmed duplicate) vs. queuing a
// DeletionRequest for an admin to review — this component doesn't fork the
// API call for that, it just reads the response status (204 vs 202) to pick
// the right toast, same as the reference implementation.
const DeleteEntryButton: React.FC<Props> = ({ entryId, status, hasPendingDeletion }) => {
  const { project } = useProject();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (hasPendingDeletion && status !== 'draft') {
    return (
      <span style={{
        fontSize: 12.5, fontWeight: 600, color: 'var(--ps-muted)', padding: '9px 4px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        Deletion pending review
      </span>
    );
  }

  const isDraft = status === 'draft';

  const handleDelete = async () => {
    const confirmMessage = isDraft
      ? 'Permanently delete this draft? This cannot be undone.'
      : role === 'admin'
        ? 'Delete this entry? As an admin, this applies immediately — it will be archived, not permanently erased.'
        : 'Delete this entry? This will submit a deletion request for an admin to review, rather than removing it immediately.';
    if (!window.confirm(confirmMessage)) return;

    let reason: string | undefined;
    if (!isDraft) {
      reason = window.prompt('Optional: why should this be deleted? (helps the reviewing admin)') || undefined;
    }

    setBusy(true);
    try {
      const res = await deleteEntry(project, entryId, reason);
      toast.success(res.status === 202 ? 'Deletion submitted for review' : 'Entry deleted');
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      toast.error(msg?.error || msg?.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={busy}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8,
        border: '1px solid #FECACA', background: 'var(--ps-surface)', color: '#DC2626',
        cursor: busy ? 'default' : 'pointer', fontSize: 13.5, fontWeight: 600, opacity: busy ? 0.6 : 1,
      }}>
      <Trash2 style={{ width: 14, height: 14 }} />
      {isDraft ? 'Delete Permanently' : 'Delete'}
    </button>
  );
};

export default DeleteEntryButton;
