import type { DisplayField } from '@/config/projects';
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
