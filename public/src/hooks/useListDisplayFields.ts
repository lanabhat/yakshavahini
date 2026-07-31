import { useEffect, useState } from 'react';
import { fetchListDisplayConfig } from '@/services/api';
import type { ProjectConfig } from '@/config/projects';
import type { ResolvedListField } from '@/components/EntryCard/EntryCard';

// Resolves the admin-configured "list display fields" (see
// admin/src/pages/ListDisplaySettings) into the shape EntryCard/EntryListRow/
// EntrySpineCard all render from — shared by every place that shows a list of
// entries (Library's grid/list/book views, Home's "Recently Added"), so they
// never drift out of sync with each other again.
export function useListDisplayFields(project: ProjectConfig): ResolvedListField[] {
  const [listFields, setListFields] = useState<ResolvedListField[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchListDisplayConfig(project).then((r) => {
      if (cancelled) return;
      const byField = Object.fromEntries(r.data.available.map((a) => [a.field, a]));
      const resolved = r.data.selected
        .map((s) => {
          const opt = byField[s.field];
          if (!opt) return null;
          return { name: opt.field, label: opt.label, kind: opt.kind, fontSize: s.font_size } as ResolvedListField;
        })
        .filter((f): f is ResolvedListField => f !== null);
      setListFields(resolved);
    }).catch(console.error);
    return () => { cancelled = true; };
  }, [project]);

  return listFields;
}
