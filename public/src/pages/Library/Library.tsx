import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, X, ChevronLeft, ChevronRight, SlidersHorizontal, List, LayoutGrid, BookOpen } from 'lucide-react';
import { filterEntries } from '@/services/api';
import type { Entry, SortField, SortOrder } from '@/services/api';
import EntryCard from '@/components/EntryCard/EntryCard';
import EntryListRow from '@/components/EntryListRow/EntryListRow';
import EntrySpineCard from '@/components/EntrySpineCard/EntrySpineCard';
import GroupFilters from '@/components/GroupFilters/GroupFilters';
import type { ActiveFacet } from '@/components/GroupFilters/GroupFilters';
import { useProject } from '@/contexts/ProjectContext';
import { useListDisplayFields } from '@/hooks/useListDisplayFields';

const PAGE_SIZE = 20;

type ViewMode = 'grid' | 'list' | 'book';

const VIEW_MODES: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
  { mode: 'list', icon: List, label: 'List' },
  { mode: 'book', icon: BookOpen, label: 'Book' },
];

const Library: React.FC = () => {
  const project = useProject();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get('q') ?? '');
  const [sortField, setSortField] = useState<SortField>('entry_id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [groupFilters, setGroupFilters] = useState<Record<string, ActiveFacet>>({});
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const listFields = useListDisplayFields(project);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const facetParams = Object.fromEntries(Object.values(groupFilters).map((f) => [f.paramKey, f.value]));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await filterEntries(project, {
        fstring: searchText.length >= 2 ? searchText : undefined,
        sort: sortField,
        order: sortOrder,
        pageno: page * PAGE_SIZE,
        ...facetParams,
      });
      setEntries(res.data.dataset);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, searchText, sortField, sortOrder, groupFilters, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const next: Record<string, string> = {};
    if (searchText) next.q = searchText;
    setSearchParams(next, { replace: true });
  }, [searchText, setSearchParams]);

  useEffect(() => { setPage(0); }, [project, searchText, sortField, sortOrder, groupFilters]);

  const handleGroupChange = (field: string, facet: ActiveFacet | null) => {
    setGroupFilters((prev) => {
      const next = { ...prev };
      if (facet) next[field] = facet;
      else delete next[field];
      return next;
    });
  };

  const activeEntries = Object.entries(groupFilters);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 16px 60px' }}>
      <h1 className="kn-serif" style={{ fontWeight: 600, fontSize: 26, margin: '0 0 4px', color: 'var(--ps-text)' }}>{project.nameKannada}</h1>
      <div style={{ fontSize: 13, color: 'var(--ps-muted)', marginBottom: 20 }}>{!loading && `${total} entries`}</div>

      <button
        onClick={() => setShowFilters((v) => !v)}
        className="flex md:hidden"
        style={{
          alignItems: 'center', gap: 6, marginBottom: 14, padding: '9px 14px',
          borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
          color: 'var(--ps-text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', width: '100%',
        }}
      >
        <SlidersHorizontal style={{ width: 15, height: 15 }} />
        {showFilters ? 'Hide filters' : 'Show filters'}
        {activeEntries.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--ps-accent-text)' }}>
            {activeEntries.length} active
          </span>
        )}
      </button>

      <div className="flex flex-col md:flex-row" style={{ gap: 24, alignItems: 'flex-start' }}>
        <aside
          className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-60 md:flex-shrink-0 md:sticky`}
          style={{ top: 76, maxHeight: 'min(70vh, calc(100vh - 96px))', overflowY: 'auto' }}
        >
          <GroupFilters selected={groupFilters} onChange={handleGroupChange} />
        </aside>

        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--ps-surface)', border: '1px solid var(--ps-border)',
            borderRadius: 14, padding: '11px 16px', marginBottom: 16, boxShadow: 'var(--ps-shadow-sm)',
          }}>
            <Search style={{ width: 16, height: 16, color: 'var(--ps-faint)' }} />
            <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search..."
              style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontSize: 14.5, color: 'var(--ps-text)' }} />
            {searchText && (
              <button onClick={() => setSearchText('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ps-faint)' }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
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
            <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 9, background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
              {VIEW_MODES.map(({ mode, icon: Icon, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)} title={label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px', borderRadius: 7, border: 'none',
                    cursor: 'pointer', fontSize: 12,
                    background: viewMode === mode ? 'var(--ps-accent-soft)' : 'transparent',
                    color: viewMode === mode ? 'var(--ps-accent-text)' : 'var(--ps-muted)',
                  }}>
                  <Icon style={{ width: 14, height: 14 }} />
                </button>
              ))}
            </div>
            {activeEntries.map(([field, facet]) => (
              <span key={field} style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '5px 10px',
                borderRadius: 999, background: 'var(--ps-accent-soft)', color: 'var(--ps-accent-text)',
              }}>
                {facet.label}
                <button onClick={() => handleGroupChange(field, null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
                  <X style={{ width: 11, height: 11 }} />
                </button>
              </span>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <Loader2 style={{ width: 32, height: 32, color: 'var(--ps-accent)' }} className="animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '70px 20px', color: 'var(--ps-muted)' }}>No entries found.</div>
          ) : (
            <>
              {viewMode === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {entries.map((e) => <EntryListRow key={e.id} entry={e} listFields={listFields} />)}
                </div>
              ) : viewMode === 'book' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                  {entries.map((e) => <EntrySpineCard key={e.id} entry={e} listFields={listFields} />)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
                  {entries.map((e) => <EntryCard key={e.id} entry={e} listFields={listFields} />)}
                </div>
              )}

              {total > PAGE_SIZE && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', cursor: page === 0 ? 'default' : 'pointer', fontSize: 13, opacity: page === 0 ? 0.5 : 1 }}>
                    <ChevronLeft style={{ width: 14, height: 14 }} /> Prev
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--ps-muted)' }}>Page {page + 1} of {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontSize: 13, opacity: page >= totalPages - 1 ? 0.5 : 1 }}>
                    Next <ChevronRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Library;
