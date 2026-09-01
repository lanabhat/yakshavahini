import React from 'react';
import type { SiteUpdateItem } from '@/services/api';

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

interface Props {
  updates: SiteUpdateItem[];
}

// Shown below the project cards on the root landing page — the caller
// (ProjectPicker) is responsible for slicing to the latest 5 and for not
// rendering this at all when there are no updates.
const UpdatesSection: React.FC<Props> = ({ updates }) => (
  <div style={{ borderTop: '1px solid var(--ps-border)', padding: 'clamp(24px, 6vw, 36px) clamp(14px, 4vw, 22px)' }}>
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2 className="kn-serif" style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 700, color: 'var(--ps-muted)', marginBottom: 16, textAlign: 'center' }}>
        ಗಮನಿಸಿ:
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {updates.map((u) => (
          <div key={u.id} className="ps-animate-in" style={{
            background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 12,
            padding: '14px 16px', boxShadow: 'var(--ps-shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span className="kn-serif" style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ps-text)' }}>{u.title}</span>
              <span style={{ fontSize: 11, color: 'var(--ps-faint)', fontFamily: 'ui-monospace, monospace' }}>{formatDate(u.created_at)}</span>
            </div>
            <p className="kn-sans" style={{ fontSize: 13.5, color: 'var(--ps-muted)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {u.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default UpdatesSection;
