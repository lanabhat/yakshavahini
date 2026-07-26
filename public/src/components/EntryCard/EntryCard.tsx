import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Entry } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

interface Props {
  entry: Entry;
}

const EntryCard: React.FC<Props> = ({ entry }) => {
  const project = useProject();
  const navigate = useNavigate();
  const hasPdf = !!entry.link_to_pdf_document;
  const hasVideo = entry.youtube_video_links && entry.youtube_video_links.length > 0;
  const year = entry.date_english ? new Date(entry.date_english).getFullYear() : '';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div className="kn-serif" style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ps-text)', lineHeight: 1.3 }}>
          {entry.name_of_the_mattu || '—'}
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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {entry.date_kannada && (
          <span className="kn-sans" style={{ fontSize: 12.5, color: 'var(--ps-muted)' }}>{entry.date_kannada}</span>
        )}
        {year && (
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--ps-faint)' }}>{year}</span>
        )}
      </div>
    </div>
  );
};

export default EntryCard;
