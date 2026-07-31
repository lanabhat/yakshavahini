import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { fetchGroups, fetchTaxonomy, fetchFilterConfig } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

export interface ActiveFacet {
  paramKey: string;   // query param spread into filterEntries — "type" (scalar) or "category_id" (taxonomy)
  value: string;
  label: string;      // human-readable value, for the "active filter" chip
}

interface Option {
  key: string;   // paramKey value used in the filter request
  name: string;  // display name
  count: number;
}

interface Props {
  selected: Record<string, ActiveFacet>; // keyed by facet field name
  onChange: (fieldName: string, facet: ActiveFacet | null) => void;
}

const GroupFilters: React.FC<Props> = ({ selected, onChange }) => {
  const project = useProject();
  const [enabledFields, setEnabledFields] = useState<Set<string> | null>(null); // null = not loaded yet
  const [scalarOptions, setScalarOptions] = useState<Record<string, Option[]>>({});
  const [taxonomyOptions, setTaxonomyOptions] = useState<Record<string, Option[]>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    fetchFilterConfig(project)
      .then((r) => { if (!cancelled) setEnabledFields(new Set(r.data.enabled)); })
      .catch(() => { if (!cancelled) setEnabledFields(new Set()); });
    return () => { cancelled = true; };
  }, [project]);

  useEffect(() => {
    if (!enabledFields) return;
    let cancelled = false;
    const facets = project.groupFacets.filter((f) => enabledFields.has(f.field));
    Promise.all(facets.map((f) => fetchGroups(project, f.field).then((r) => [
      f.field, r.data.map((g) => ({ key: g.name, name: g.name, count: g.count })),
    ] as const)))
      .then((results) => { if (!cancelled) setScalarOptions(Object.fromEntries(results)); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [project, enabledFields]);

  useEffect(() => {
    if (!enabledFields) return;
    let cancelled = false;
    const facets = project.taxonomyFacets.filter((f) => enabledFields.has(f.field));
    Promise.all(facets.map((f) => fetchTaxonomy(project, f.field).then((r) => [
      f.field, r.data.filter((t) => t.entry_count > 0).map((t) => ({ key: String(t.id), name: t.name, count: t.entry_count })),
    ] as const)))
      .then((results) => { if (!cancelled) setTaxonomyOptions(Object.fromEntries(results)); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [project, enabledFields]);

  if (!enabledFields) return null;

  const scalarFacets = project.groupFacets
    .filter((f) => enabledFields.has(f.field))
    .map((f) => ({ ...f, paramKey: f.field, options: scalarOptions[f.field] || [] }));
  const taxonomyFacetsList = project.taxonomyFacets
    .filter((f) => enabledFields.has(f.field))
    .map((f) => ({ ...f, paramKey: `${f.field}_id`, options: taxonomyOptions[f.field] || [] }));

  const toggleCollapsed = (field: string) => setCollapsed((prev) => ({ ...prev, [field]: !prev[field] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[...scalarFacets, ...taxonomyFacetsList].map(({ field, label, paramKey, options }) => {
        if (options.length === 0) return null;
        const active = selected[field];
        const isCollapsed = !!collapsed[field];
        return (
          <div key={field} style={{
            border: '1px solid var(--ps-border)', borderRadius: 12, background: 'var(--ps-surface)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => toggleCollapsed(field)}
              className="kn-serif"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--ps-muted)',
                background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span>{label} <span style={{ opacity: 0.6, fontWeight: 500 }}>({options.length})</span></span>
              {isCollapsed ? <ChevronDown style={{ width: 14, height: 14 }} /> : <ChevronUp style={{ width: 14, height: 14 }} />}
            </button>
            {!isCollapsed && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 12px 12px',
                maxHeight: 260, overflowY: 'auto',
              }}>
                {options.map((opt) => {
                  const isActive = active?.value === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => onChange(field, isActive ? null : { paramKey, value: opt.key, label: opt.name })}
                      className="kn-sans"
                      style={{
                        fontSize: 12, padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
                        border: `1px solid ${isActive ? 'var(--ps-accent-text)' : 'var(--ps-border)'}`,
                        background: isActive ? 'var(--ps-accent-soft)' : 'var(--ps-bg)',
                        color: isActive ? 'var(--ps-accent-text)' : 'var(--ps-text)',
                        flexShrink: 0,
                      }}
                    >
                      {opt.name} <span style={{ opacity: 0.6 }}>({opt.count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupFilters;
