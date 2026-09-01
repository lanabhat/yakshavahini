import type { DisplayField, ProjectConfig } from '@/config/projects';
import type { Entry, TaxonomyRef } from '@/services/api';

export function displayFieldValue(entry: Entry, field: DisplayField): string {
  const raw = entry[field.name];
  if (field.kind === 'taxonomy-single') {
    const ref = raw as TaxonomyRef | null;
    return ref?.name || '';
  }
  if (field.kind === 'taxonomy-multi') {
    const refs = (raw as TaxonomyRef[]) || [];
    return refs.map((r) => r.name).join(', ');
  }
  return (raw as string) || '';
}

// Resolves the entry's primary document link, trying `linkField` (default
// "pdf_link") then each of `linkFieldFallbacks` in order — first one that
// looks like a real URL wins. Used by EntryCard/EntryListRow/EntryDetail so
// a project with more than one candidate document link (e.g. Prasanga
// Yadi's Kosha link vs Pratisangraha link) shows whichever is present,
// without each component re-implementing the same fallback loop.
export function resolveDocumentLink(entry: Entry, project: ProjectConfig): string {
  const candidates = [project.linkField || 'pdf_link', ...(project.linkFieldFallbacks || [])];
  for (const field of candidates) {
    const value = (entry[field] as string) || '';
    if (value.startsWith('http')) return value;
  }
  return '';
}

// For the plain-text subtitle/badge shown on EntryCard — resolves a
// scalar field, or a taxonomy-single field's related name.
export function subtitleValue(entry: Entry, fieldName?: string): string {
  if (!fieldName) return '';
  const raw = entry[fieldName];
  if (raw && typeof raw === 'object' && 'name' in (raw as object)) {
    return (raw as TaxonomyRef).name || '';
  }
  return (raw as string) || '';
}
