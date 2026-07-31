import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Entry, FontSize } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';
import { subtitleValue, displayFieldValue } from '@/lib/fieldDisplay';
import type { ResolvedListField } from '@/components/EntryCard/EntryCard';

// Fixed palette for the stylized "spine" fallback shown when an entry has no
// thumbnail image — deterministically picked per entry so the same book
// always gets the same color, same idea as the old Pratisangraha frontend's
// SpineCard (which never had real cover images at all; ours upgrades that
// pattern by preferring a real cover when `entry.thumbnail` is set).
const SPINE_PALETTE = [
  { bg: '#2563EB', ink: '#EFF6FF' },
  { bg: '#8a3a1f', ink: '#FDF3ED' },
  { bg: '#15803d', ink: '#EFFDF4' },
  { bg: '#7c3aed', ink: '#F5F0FF' },
  { bg: '#b45309', ink: '#FFF7ED' },
  { bg: '#0f766e', ink: '#EFFDFB' },
];

function pickSpineColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return SPINE_PALETTE[hash % SPINE_PALETTE.length];
}

const FONT_SIZE_PX: Record<FontSize, number> = { sm: 11, md: 13, lg: 15 };

interface Props {
  entry: Entry;
  listFields?: ResolvedListField[];
}

const EntrySpineCard: React.FC<Props> = ({ entry, listFields }) => {
  const project = useProject();
  const navigate = useNavigate();
  const title = (entry[project.titleField] as string) || '—';
  const subtitle = subtitleValue(entry, project.cardSubtitleField);
  const thumbnail = (entry.thumbnail as string) || '';
  const dateEnglish = project.dateEnglishField ? (entry[project.dateEnglishField] as string) : '';
  const dateKannada = project.dateKannadaField ? (entry[project.dateKannadaField] as string) : '';
  const year = dateEnglish ? new Date(dateEnglish).getFullYear() : '';
  const spine = pickSpineColor(String(entry.id) + title);

  return (
    <div
      onClick={() => navigate(`/${project.slug}/entry/${entry.id}`)}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'transform .18s' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
    >
      {thumbnail ? (
        <img src={thumbnail} alt="" loading="lazy" style={{
          width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', borderRadius: 4,
          boxShadow: 'var(--ps-shadow-md)', border: '1px solid var(--ps-border)',
        }} />
      ) : (
        <div style={{
          width: '100%', aspectRatio: '2 / 3', borderRadius: 3, padding: '16px 13px',
          background: spine.bg, color: spine.ink, boxShadow: 'var(--ps-shadow-sm)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div className="kn-serif" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
          {subtitle && <div className="kn-sans" style={{ fontSize: 10.5, opacity: 0.85 }}>{subtitle}</div>}
        </div>
      )}

      <div className="kn-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ps-text)', lineHeight: 1.3 }}>
        {title}
      </div>
      {(dateKannada || year) && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {dateKannada && <span className="kn-sans" style={{ fontSize: 11, color: 'var(--ps-muted)' }}>{dateKannada}</span>}
          {year && <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, color: 'var(--ps-faint)' }}>{year}</span>}
        </div>
      )}
      {listFields?.map((f) => {
        if (f.kind === 'date') return null;
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

export default EntrySpineCard;
