import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Check, X, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { fetchPendingEntries, reviewEntry } from '@/services/api';
import type { Entry } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

// Fields already shown elsewhere in the row, or too internal to be useful
// during review — everything else on the entry is rendered generically,
// since admin has no per-project "display fields" config the way the
// public app does (see public/src/config/projects.ts's displayFields).
const HIDDEN_FIELDS = new Set([
  'id', 'entry_id', 'status', 'submitted_by', 'reviewed_by', 'reviewed_at',
  'review_notes', 'view_count', 'has_pending_deletion',
]);

const prettifyKey = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const isUrl = (value: string) => /^https?:\/\//i.test(value);

const FieldValue: React.FC<{ value: unknown }> = ({ value }) => {
  if (value === null || value === undefined || value === '') return <span style={{ color: 'var(--ps-faint)' }}>&mdash;</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: 'var(--ps-faint)' }}>&mdash;</span>;
    if (typeof value[0] === 'object' && value[0] !== null) {
      // taxonomy-multi: [{id, name}, ...]
      return <>{(value as { name: string }[]).map((v) => v.name).join(', ')}</>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {(value as string[]).map((v, i) => (
          isUrl(v) ? <a key={i} href={v} target="_blank" rel="noopener" style={{ color: 'var(--ps-accent-text)', wordBreak: 'break-all' }}>{v}</a> : <span key={i}>{v}</span>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    // taxonomy-single: {id, name}
    const name = (value as { name?: string }).name;
    return <>{name ?? '—'}</>;
  }

  const str = String(value);
  if (isUrl(str)) {
    return <a href={str} target="_blank" rel="noopener" style={{ color: 'var(--ps-accent-text)', wordBreak: 'break-all' }}>{str}</a>;
  }
  return <span style={{ whiteSpace: 'pre-line' }}>{str}</span>;
};

const PendingQueue: React.FC = () => {
  const { project } = useProject();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetchPendingEntries(project).then((r) => setEntries(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, [project]);

  const handleReview = async (id: number, status: string) => {
    try {
      await reviewEntry(project, id, status);
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
          {entries.map((e) => {
            const expanded = expandedId === e.id;
            const fields = Object.entries(e).filter(([k]) => !HIDDEN_FIELDS.has(k));
            return (
              <div key={e.id} style={{
                borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', overflow: 'hidden',
              }}>
                <div
                  onClick={() => setExpandedId(expanded ? null : e.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', cursor: 'pointer', gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {expanded ? <ChevronUp style={{ width: 14, height: 14, color: 'var(--ps-faint)', flexShrink: 0 }} /> : <ChevronDown style={{ width: 14, height: 14, color: 'var(--ps-faint)', flexShrink: 0 }} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ps-text)' }}>{String(e[project.titleField] ?? '')}</div>
                      <div style={{ fontSize: 12, color: 'var(--ps-muted)' }}>Added by {e.submitted_by || 'unknown'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={(evt) => evt.stopPropagation()}>
                    <Link to={`/entries/${e.id}/edit`}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--ps-surface)', color: 'var(--ps-text)', border: '1px solid var(--ps-border)', borderRadius: 8, padding: '7px 12px', textDecoration: 'none', fontSize: 12.5, fontWeight: 600 }}>
                      <Pencil style={{ width: 13, height: 13 }} /> Edit
                    </Link>
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

                {expanded && (
                  <div style={{ borderTop: '1px solid var(--ps-border)', padding: '14px 16px', background: 'var(--ps-bg)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 180px) 1fr', gap: '8px 14px', fontSize: 13 }}>
                      {fields.map(([key, value]) => (
                        <React.Fragment key={key}>
                          <div style={{ color: 'var(--ps-muted)', fontWeight: 600 }}>{prettifyKey(key)}</div>
                          <div className="kn-sans" style={{ color: 'var(--ps-text)' }}><FieldValue value={value} /></div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingQueue;
