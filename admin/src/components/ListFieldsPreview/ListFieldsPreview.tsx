import React from 'react';
import type { Entry, ListDisplayFieldOption, ListDisplaySelection } from '@/services/api';

// A minimal port of the public app's EntryCard field-rendering block
// (public/src/components/EntryCard/EntryCard.tsx), so admins can see how
// their selected list-display fields will actually look under a real
// entry's title, without needing to save first.
const FONT_SIZE_PX: Record<string, number> = { sm: 11, md: 13, lg: 15 };

function displayValue(entry: Entry, field: ListDisplayFieldOption): string {
  const raw = entry[field.field];
  if (field.kind === 'taxonomy-single') {
    const ref = raw as { name: string } | null;
    return ref?.name || '';
  }
  if (field.kind === 'taxonomy-multi') {
    const refs = (raw as { name: string }[]) || [];
    return refs.map((r) => r.name).join(', ');
  }
  return (raw as string) || '';
}

interface Props {
  entry: Entry;
  titleField: string;
  selected: ListDisplaySelection[];
  available: ListDisplayFieldOption[];
}

const ListFieldsPreview: React.FC<Props> = ({ entry, titleField, selected, available }) => {
  const availableByField = new Map(available.map((a) => [a.field, a]));

  return (
    <div style={{
      background: 'var(--ps-surface)', border: '1px solid var(--ps-border)',
      borderRadius: 16, padding: 16, maxWidth: 260,
    }}>
      <div className="kn-serif" style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ps-text)', marginBottom: 6 }}>
        {(entry[titleField] as string) || '(untitled)'}
      </div>
      {selected.map((s) => {
        const field = availableByField.get(s.field);
        if (!field) return null;
        const value = displayValue(entry, field);
        if (!value) return null;
        return (
          <div key={s.field} className="kn-sans" style={{ fontSize: FONT_SIZE_PX[s.font_size], color: 'var(--ps-muted)', lineHeight: 1.4, marginTop: 4 }}>
            {value}
          </div>
        );
      })}
    </div>
  );
};

export default ListFieldsPreview;
