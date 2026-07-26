import React, { useEffect, useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { fetchPendingEntries, reviewEntry } from '@/services/api';
import type { Entry } from '@/services/api';

const PendingQueue: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchPendingEntries().then((r) => setEntries(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleReview = async (id: number, status: string) => {
    try {
      await reviewEntry(id, status);
      toast.success(`Entry ${status}`);
      load();
    } catch {
      toast.error('Action failed');
    }
  };

  if (loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  return (
    <div>
      <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: 'var(--ps-text)' }}>
        Pending Review ({entries.length})
      </h1>
      {entries.length === 0 ? (
        <p style={{ color: 'var(--ps-muted)' }}>Nothing pending.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map((e) => (
            <div key={e.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ps-text)' }}>{e.name_of_the_mattu}</div>
                <div style={{ fontSize: 12, color: 'var(--ps-muted)' }}>{e.submitted_by}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleReview(e.id, 'approved')}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
                  <Check style={{ width: 13, height: 13 }} /> Approve
                </button>
                <button onClick={() => handleReview(e.id, 'rejected')}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
                  <X style={{ width: 13, height: 13 }} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingQueue;
