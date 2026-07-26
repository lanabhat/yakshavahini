import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { searchAllEntries } from '@/services/api';
import type { Entry } from '@/services/api';

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--ps-faint)', pending: '#d97706', approved: '#16a34a',
  rejected: '#dc2626', needs_correction: '#ea580c',
};

const Library: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchAllEntries({ fstring: query || undefined, status: statusFilter || undefined });
      setEntries(res.data.dataset);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ps-text)' }}>Library ({total})</h1>
        <Link to="/entries/new" style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'var(--ps-grad)', color: '#fff',
          borderRadius: 8, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
        }}>
          <Plus style={{ width: 14, height: 14 }} /> New Entry
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..."
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ps-border)', fontSize: 13.5, flex: 1, maxWidth: 300 }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ps-border)', fontSize: 13.5 }}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="needs_correction">Needs Correction</option>
        </select>
      </div>

      {loading ? (
        <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((e) => (
            <Link key={e.id} to={`/entries/${e.id}/edit`} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 14px', borderRadius: 10, border: '1px solid var(--ps-border)',
              background: 'var(--ps-surface)', textDecoration: 'none',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ps-text)' }}>{e.name_of_the_mattu}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ps-faint)', fontFamily: 'ui-monospace, monospace' }}>{e.entry_id}</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: STATUS_COLORS[e.status] || 'var(--ps-muted)', textTransform: 'capitalize' }}>
                {e.status.replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
