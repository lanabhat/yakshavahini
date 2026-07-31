import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Entry, FontSize } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';
import { subtitleValue, displayFieldValue } from '@/lib/fieldDisplay';

export const DATE_FIELD_KEY = '__date__';

export interface ResolvedListField {
  name: string;
  label: string;
  kind: 'text' | 'taxonomy-single' | 'taxonomy-multi' | 'date';
  fontSize: FontSize;
}

const FONT_SIZE_PX: Record<FontSize, number> = { sm: 11, md: 13, lg: 15 };

interface Props {
  entry: Entry;
  listFields?: ResolvedListField[];
}

const EntryCard: React.FC<Props> = ({ entry, listFields }) => {
  const project = useProject();
  const navigate = useNavigate();
  const linkValue = (entry[project.linkField || 'pdf_link'] as string) || '';
  const hasPdf = linkValue.startsWith('http');
  const videoLinks = entry.youtube_video_links as string[] | undefined;
  const hasVideo = !!videoLinks && videoLinks.length > 0;
  const dateEnglish = project.dateEnglishField ? (entry[project.dateEnglishField] as string) : '';
  const dateKannada = project.dateKannadaField ? (entry[project.dateKannadaField] as string) : '';
  const year = dateEnglish ? new Date(dateEnglish).getFullYear() : '';
  const title = (entry[project.titleField] as string) || '—';
  const subtitle = subtitleValue(entry, project.cardSubtitleField);
  const thumbnail = (entry.thumbnail as string) || '';

  return (
    <div
      onClick={() => navigate(`/${project.slug}/entry/${entry.id}`)}
      style={{
        background: 'var(--ps-surface)', border: '1px solid var(--ps-border)',
        borderRadius: 16, padding: 16, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 8,
        boxShadow: 'var(--ps-shadow-sm)', transition: 'box-shadow .15s, transform .15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--ps-shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--ps-shadow-sm)'; e.currentTarget.style.transform = ''; }}
    >
      {thumbnail && (
        <img src={thumbnail} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 10 }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div className="kn-serif" style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ps-text)', lineHeight: 1.3 }}>
          {title}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {hasPdf && (
            <span style={{ fontSize: 9.5, fontWeight: 800, background: 'var(--ps-accent-soft)', color: 'var(--ps-accent-text)', borderRadius: 6, padding: '3px 6px' }}>PDF</span>
          )}
          {hasVideo && (
            <span style={{ fontSize: 9.5, fontWeight: 800, background: 'var(--ps-accent-soft)', color: 'var(--ps-accent-text)', borderRadius: 6, padding: '3px 6px' }}>▶</span>
          )}
        </div>
      </div>
      {subtitle && (
        <div className="kn-sans" style={{ fontSize: 12, color: 'var(--ps-faint)' }}>{subtitle}</div>
      )}
      {listFields?.map((f) => {
        if (f.kind === 'date') {
          if (!dateKannada && !year) return null;
          return (
            <div key={f.name} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {dateKannada && (
                <span className="kn-sans" style={{ fontSize: FONT_SIZE_PX[f.fontSize] + 1.5, color: 'var(--ps-muted)' }}>{dateKannada}</span>
              )}
              {year && (
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: FONT_SIZE_PX[f.fontSize], color: 'var(--ps-faint)' }}>{year}</span>
              )}
            </div>
          );
        }
        const value = displayFieldValue(entry, f);
        if (!value) return null;
        return (
          <div key={f.name} className="kn-sans" style={{ fontSize: FONT_SIZE_PX[f.fontSize], color: 'var(--ps-muted)', lineHeight: 1.4 }}>
            {value}
          </div>
        );
      })}
    </div>
  );
};

export default EntryCard;
