import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchAllEntries } from '@/services/api';
import type { Entry } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--ps-faint)', pending: '#d97706', approved: '#16a34a',
  rejected: '#dc2626', needs_correction: '#ea580c',
};

const Library: React.FC = () => {
  const { project } = useProject();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchAllEntries(project, {
        fstring: query || undefined, status: statusFilter || undefined, pageno: page * PAGE_SIZE,
      });
      setEntries(res.data.dataset);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [project, query, statusFilter, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => { setPage(0); }, [project, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {entries.map((e) => (
              <Link key={e.id} to={`/entries/${e.id}/edit`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 14px', borderRadius: 10, border: '1px solid var(--ps-border)',
                background: 'var(--ps-surface)', textDecoration: 'none',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ps-text)' }}>{String(e[project.titleField] ?? '')}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ps-faint)', fontFamily: 'ui-monospace, monospace' }}>{e.entry_id}</div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: STATUS_COLORS[e.status] || 'var(--ps-muted)', textTransform: 'capitalize' }}>
                  {e.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>

          {total > PAGE_SIZE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', cursor: page === 0 ? 'default' : 'pointer', fontSize: 13, opacity: page === 0 ? 0.5 : 1 }}>
                <ChevronLeft style={{ width: 14, height: 14 }} /> Prev
              </button>
              <span style={{ fontSize: 13, color: 'var(--ps-muted)' }}>Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontSize: 13, opacity: page >= totalPages - 1 ? 0.5 : 1 }}>
                Next <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Library;
