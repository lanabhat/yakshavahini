import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Check, X as XIcon, GitMerge } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchTaxonomy, createTaxonomyItem, renameTaxonomyItem, deleteTaxonomyItem, mergeTaxonomyItems,
} from '@/services/api';
import type { TaxonomyItem } from '@/services/api';
import { normalizeName } from '@/lib/normalizeName';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ps-border)',
  fontSize: 13.5, outline: 'none', background: 'var(--ps-surface)', color: 'var(--ps-text)',
};
const iconBtnStyle: React.CSSProperties = {
  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 8, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', cursor: 'pointer',
};

const MergeRow: React.FC<{ field: string; group: TaxonomyItem[]; onMerged: () => void }> = ({ field, group, onMerged }) => {
  const { project } = useProject();
  const [keepId, setKeepId] = useState(
    group.reduce((best, item) => (item.entry_count > best.entry_count ? item : best), group[0]).id,
  );
  const [merging, setMerging] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleMerge = async () => {
    const mergeIds = group.filter((i) => i.id !== keepId).map((i) => i.id);
    setMerging(true);
    try {
      const res = await mergeTaxonomyItems(project, field, keepId, mergeIds);
      toast.success(`Merged ${res.data.merged_count} into "${res.data.name}"`);
      setExpanded(false);
      onMerged();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div style={{ borderRadius: 12, padding: 12, background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div className="kn-sans" style={{ fontSize: 13.5, color: 'var(--ps-text)' }}>
          {group.map((i) => i.name).join(' · ')}
        </div>
        <button onClick={() => setExpanded((v) => !v)} style={{ ...iconBtnStyle, width: 'auto', padding: '0 12px', gap: 6, display: 'flex' }}>
          <GitMerge style={{ width: 14, height: 14 }} /> Merge
        </button>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {group.map((item) => (
            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--ps-text)' }}>
              <input type="radio" checked={keepId === item.id} onChange={() => setKeepId(item.id)} />
              <span className="kn-sans" style={{ fontWeight: 600 }}>{item.name}</span>
              <span style={{ color: 'var(--ps-faint)' }}>({item.entry_count} {item.entry_count === 1 ? 'entry' : 'entries'})</span>
            </label>
          ))}
          <button onClick={handleMerge} disabled={merging}
            style={{ alignSelf: 'flex-start', padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--ps-grad)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {merging ? 'Merging...' : 'Confirm merge'}
          </button>
        </div>
      )}
    </div>
  );
};

const TaxonomyManager: React.FC = () => {
  const { role } = useAuth();
  const { project } = useProject();
  const fields = project.taxonomyFields;

  const [field, setField] = useState(fields[0]?.name ?? '');
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [allItems, setAllItems] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (fields.length && !fields.some((f) => f.name === field)) setField(fields[0].name);
  }, [fields, field]);

  const loadAll = () => {
    if (!field) return;
    fetchTaxonomy(project, field).then((r) => setAllItems(r.data)).catch(console.error);
  };

  const load = () => {
    if (!field) return;
    setLoading(true);
    fetchTaxonomy(project, field, query || undefined)
      .then((r) => setItems(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const refresh = () => { load(); loadAll(); };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, field, query]);
  useEffect(loadAll, [project, field]);

  const duplicateGroups = useMemo(() => {
    const byNormalized = new Map<string, TaxonomyItem[]>();
    for (const item of allItems) {
      const key = normalizeName(item.name);
      if (!key) continue;
      (byNormalized.get(key) || byNormalized.set(key, []).get(key)!).push(item);
    }
    return Array.from(byNormalized.values()).filter((g) => g.length > 1);
  }, [allItems]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createTaxonomyItem(project, field, name);
      toast.success('Added');
      setNewName('');
      refresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to add');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (item: TaxonomyItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (item: TaxonomyItem) => {
    const name = editingName.trim();
    if (!name || name === item.name) {
      cancelEdit();
      return;
    }
    setBusyId(item.id);
    try {
      await renameTaxonomyItem(project, field, item.id, name);
      toast.success('Renamed');
      cancelEdit();
      refresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to rename');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: TaxonomyItem) => {
    if (item.entry_count > 0) {
      toast.error(`Still used by ${item.entry_count} ${item.entry_count === 1 ? 'entry' : 'entries'} — merge or reassign first.`);
      return;
    }
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setBusyId(item.id);
    try {
      await deleteTaxonomyItem(project, field, item.id);
      toast.success('Deleted');
      refresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  if (fields.length === 0) {
    return <p style={{ color: 'var(--ps-muted)' }}>{project.name} has no taxonomy tables to manage.</p>;
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: 'var(--ps-text)' }}>Manage Catalog Details</h1>
      <p style={{ fontSize: 13, color: 'var(--ps-muted)', marginBottom: 20 }}>
        Add, rename, remove, or merge duplicate entries used across {project.name} books.
      </p>

      <div style={{ display: 'flex', gap: 4, borderRadius: 10, padding: 4, marginBottom: 16, width: 'fit-content', background: 'var(--ps-surface-2, var(--ps-border))' }}>
        {fields.map((f) => (
          <button key={f.name} onClick={() => { setField(f.name); setQuery(''); }}
            className="kn-sans"
            style={{
              fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: field === f.name ? 'var(--ps-surface)' : 'transparent',
              color: field === f.name ? 'var(--ps-accent-text)' : 'var(--ps-muted)',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {role === 'admin' && duplicateGroups.length > 0 && (
        <div style={{ borderRadius: 14, padding: 14, marginBottom: 16, background: 'var(--ps-accent-soft)', border: '1px solid var(--ps-border)' }}>
          <h2 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ps-accent-text)', margin: '0 0 10px' }}>
            Possible duplicates ({duplicateGroups.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {duplicateGroups.map((group) => (
              <MergeRow key={group.map((i) => i.id).join(',')} field={field} group={group} onMerged={refresh} />
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add a new entry..."
          style={{ ...inputStyle, flex: 1 }} />
        <button type="submit" disabled={creating || !newName.trim()}
          style={{ ...iconBtnStyle, background: 'var(--ps-grad)', border: 'none', color: '#fff' }}>
          {creating ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
        </button>
      </form>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..."
        style={{ ...inputStyle, width: '100%', marginBottom: 16 }} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />
        </div>
      ) : items.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ps-muted)' }}>Nothing here yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item) => (
            <div key={item.id} style={{ borderRadius: 10, padding: 10, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
              {editingId === item.id ? (
                <>
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus
                    style={{ ...inputStyle, flex: 1 }}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item); if (e.key === 'Escape') cancelEdit(); }} />
                  <button onClick={() => saveEdit(item)} disabled={busyId === item.id} style={iconBtnStyle}>
                    <Check style={{ width: 14, height: 14 }} />
                  </button>
                  <button onClick={cancelEdit} disabled={busyId === item.id} style={iconBtnStyle}>
                    <XIcon style={{ width: 14, height: 14 }} />
                  </button>
                </>
              ) : (
                <>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="kn-sans" style={{ fontWeight: 600, color: 'var(--ps-text)' }}>{item.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ps-faint)' }}>
                      {item.entry_count} {item.entry_count === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>
                  <button onClick={() => startEdit(item)} disabled={busyId === item.id} style={iconBtnStyle}>
                    <Pencil style={{ width: 13, height: 13 }} />
                  </button>
                  <button onClick={() => handleDelete(item)} disabled={busyId === item.id}
                    style={{ ...iconBtnStyle, borderColor: '#FECACA', color: '#DC2626' }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaxonomyManager;
