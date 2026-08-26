import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Entry, FontSize } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';
import { subtitleValue, displayFieldValue } from '@/lib/fieldDisplay';
import type { ResolvedListField } from '@/components/EntryCard/EntryCard';

const FONT_SIZE_PX: Record<FontSize, number> = { sm: 11, md: 12.5, lg: 14 };

interface Props {
  entry: Entry;
  listFields?: ResolvedListField[];
}

const EntryListRow: React.FC<Props> = ({ entry, listFields }) => {
  const project = useProject();
  const navigate = useNavigate();
  const linkValue = (entry[project.linkField || 'pdf_link'] as string) || '';
  const hasPdf = linkValue.startsWith('http');
  const primaryVideoLink = project.videoLinkField ? (entry[project.videoLinkField] as string) || '' : '';
  const hasVideo = primaryVideoLink.startsWith('http');
  const title = (entry[project.titleField] as string) || '—';
  const subtitle = subtitleValue(entry, project.cardSubtitleField);
  const dateEnglish = project.dateEnglishField ? (entry[project.dateEnglishField] as string) : '';
  const dateKannada = project.dateKannadaField ? (entry[project.dateKannadaField] as string) : '';
  const year = dateEnglish ? new Date(dateEnglish).getFullYear() : '';

  return (
    <div
      onClick={() => navigate(`/${project.slug}/entry/${entry.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '11px 14px',
        borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
        transition: 'box-shadow .15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--ps-shadow-sm)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="kn-serif" style={{
          fontWeight: 700, fontSize: 14.5, color: 'var(--ps-text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
          {subtitle && <span className="kn-sans" style={{ fontSize: 11.5, color: 'var(--ps-faint)' }}>{subtitle}</span>}
          {dateKannada && <span className="kn-sans" style={{ fontSize: 11.5, color: 'var(--ps-muted)' }}>{dateKannada}</span>}
          {year && <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--ps-faint)' }}>{year}</span>}
          {listFields?.map((f) => {
            if (f.kind === 'date') return null;
            const value = displayFieldValue(entry, f);
            if (!value) return null;
            return (
              <span key={f.name} className="kn-sans" style={{ fontSize: FONT_SIZE_PX[f.fontSize], color: 'var(--ps-muted)' }}>
                {value}
              </span>
            );
          })}
        </div>
      </div>
      {hasPdf && (
        <span style={{ fontSize: 9.5, fontWeight: 800, background: 'var(--ps-accent-soft)', color: 'var(--ps-accent-text)', borderRadius: 6, padding: '3px 6px', flexShrink: 0 }}>PDF</span>
      )}
      {hasVideo && (
        <span style={{ fontSize: 9.5, fontWeight: 800, background: 'var(--ps-accent-soft)', color: 'var(--ps-accent-text)', borderRadius: 6, padding: '3px 6px', flexShrink: 0 }}>▶</span>
      )}
    </div>
  );
};

export default EntryListRow;
