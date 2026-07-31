import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { fetchDeletionRequests, reviewDeletionRequest } from '@/services/api';
import type { DeletionRequestItem } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';

const DeletionApprovalQueue: React.FC = () => {
  const { role } = useAuth();
  const { setProjectSlug } = useProject();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DeletionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchDeletionRequests('pending').then((r) => setRequests(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleReview = async (id: number, decision: 'approved' | 'rejected') => {
    try {
      await reviewDeletionRequest(id, decision);
      toast.success(decision === 'approved' ? 'Entry deleted' : 'Deletion rejected');
      load();
    } catch {
      toast.error('Action failed');
    }
  };

  const goToEntry = (r: DeletionRequestItem) => {
    if (!r.project) return;
    setProjectSlug(r.project);
    navigate(`/entries/${r.entry_pk}/edit`);
  };

  if (loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  return (
    <div>
      <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: 'var(--ps-text)' }}>
        Deletion Requests ({requests.length})
      </h1>
      {requests.length === 0 ? (
        <p style={{ color: 'var(--ps-muted)' }}>Nothing pending.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.map((r) => (
            <div key={r.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
            }}>
              <div style={{ cursor: 'pointer' }} onClick={() => goToEntry(r)}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ps-accent-text)', marginBottom: 2 }}>{r.project_label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ps-text)' }}>{r.title || r.entry_display_id}</div>
                <div style={{ fontSize: 12, color: 'var(--ps-muted)' }}>
                  Requested by {r.requested_by}
                  {r.reason && <> &mdash; {r.reason}</>}
                </div>
              </div>
              {role === 'admin' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleReview(r.id, 'approved')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
                    <Check style={{ width: 13, height: 13 }} /> Approve
                  </button>
                  <button onClick={() => handleReview(r.id, 'rejected')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
                    <X style={{ width: 13, height: 13 }} /> Reject
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: 12.5, color: 'var(--ps-muted)', fontStyle: 'italic' }}>Awaiting admin review</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeletionApprovalQueue;
