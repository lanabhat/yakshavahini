import React, { useEffect, useState } from 'react';
import { X, Check, Plus, Loader2 } from 'lucide-react';
import { fetchTaxonomy, createTaxonomyItem } from '@/services/api';
import type { TaxonomyItem } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

interface Props {
  field: string;
  label: string;
  mode: 'single' | 'multi';
  selectedNames: string[];
  onToggle: (name: string) => void;
  onClose: () => void;
}

// A click-to-select browser for taxonomy fields (author/category/publisher/
// contributor), so users can pick an existing entry instead of retyping a
// name that might create a near-duplicate. Still allows adding a brand-new
// entry inline, matching the free-type autocomplete's existing behavior.
const TaxonomyPicker: React.FC<Props> = ({ field, label, mode, selectedNames, onToggle, onClose }) => {
  const { project } = useProject();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    fetchTaxonomy(project, field, query || undefined)
      .then((r) => setItems(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, field, query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const exactMatch = items.some((i) => i.name.toLowerCase() === query.trim().toLowerCase());

  const select = (name: string) => {
    onToggle(name);
    if (mode === 'single') onClose();
  };

  const handleCreate = async () => {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createTaxonomyItem(project, field, name);
      select(name);
      setQuery('');
      load();
    } catch {
      // likely a race with an identical name already existing — ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        background: 'var(--ps-bg)', borderRadius: 14, border: '1px solid var(--ps-border)',
        boxShadow: 'var(--ps-shadow-md)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--ps-border)' }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ps-text)' }}>{label}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ps-faint)', display: 'flex' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ padding: '12px 16px' }}>
          <input
            autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or add new..."
            style={{
              padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ps-border)',
              fontSize: 13.5, width: '100%', outline: 'none', background: 'var(--ps-surface)', color: 'var(--ps-text)',
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
              <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />
            </div>
          ) : items.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ps-faint)', fontSize: 13 }}>No matches.</p>
          ) : (
            items.map((item) => {
              const isSelected = selectedNames.includes(item.name);
              return (
                <div
                  key={item.id}
                  onClick={() => select(item.name)}
                  className="kn-sans"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5,
                    background: isSelected ? 'var(--ps-accent-soft)' : 'transparent',
                    color: isSelected ? 'var(--ps-accent-text)' : 'var(--ps-text)',
                  }}
                >
                  <span>{item.name}</span>
                  {isSelected && <Check style={{ width: 14, height: 14 }} />}
                </div>
              );
            })
          )}
          {query.trim() && !exactMatch && (
            <div
              onClick={handleCreate}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 8,
                cursor: creating ? 'default' : 'pointer', fontSize: 13.5, color: 'var(--ps-accent-text)', fontWeight: 600,
              }}
            >
              {creating ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
              Add new: &ldquo;{query.trim()}&rdquo;
            </div>
          )}
        </div>

        {mode === 'multi' && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--ps-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--ps-grad)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxonomyPicker;
