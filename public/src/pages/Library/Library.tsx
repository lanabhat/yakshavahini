import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, X } from 'lucide-react';
import { filterEntries } from '@/services/api';
import type { Entry, SortField, SortOrder } from '@/services/api';
import EntryCard from '@/components/EntryCard/EntryCard';
import { useProject } from '@/contexts/ProjectContext';

const Library: React.FC = () => {
  const project = useProject();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get('q') ?? '');
  const [sortField, setSortField] = useState<SortField>('entry_id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await filterEntries(project, {
        fstring: searchText.length >= 2 ? searchText : undefined,
        sort: sortField,
        order: sortOrder,
      });
      setEntries(res.data.dataset);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [project, searchText, sortField, sortOrder]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const next: Record<string, string> = {};
    if (searchText) next.q = searchText;
    setSearchParams(next, { replace: true });
  }, [searchText, setSearchParams]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 22px 60px' }}>
      <h1 className="ps-serif" style={{ fontWeight: 600, fontSize: 26, margin: '0 0 4px', color: 'var(--ps-text)' }}>Library</h1>
      <div style={{ fontSize: 13, color: 'var(--ps-muted)', marginBottom: 20 }}>{!loading && `${total} entries`}</div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--ps-surface)', border: '1px solid var(--ps-border)',
        borderRadius: 14, padding: '11px 16px', marginBottom: 20, boxShadow: 'var(--ps-shadow-sm)',
      }}>
        <Search style={{ width: 16, height: 16, color: 'var(--ps-faint)' }} />
        <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search..."
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14.5, color: 'var(--ps-text)' }} />
        {searchText && (
          <button onClick={() => setSearchText('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ps-faint)' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ps-border)', fontSize: 13, background: 'var(--ps-surface)', color: 'var(--ps-text)' }}>
          <option value="entry_id">Default order</option>
          <option value="title">Title</option>
          <option value="date">Date</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--ps-border)', fontSize: 13, background: 'var(--ps-surface)', color: 'var(--ps-text)' }}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 style={{ width: 32, height: 32, color: 'var(--ps-accent)' }} className="animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--ps-muted)' }}>No entries found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {entries.map((e) => <EntryCard key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  );
};

export default Library;
