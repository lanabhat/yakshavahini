import React from 'react';
import { Link } from 'react-router-dom';
import { PROJECTS } from '@/config/projects';
import { EXTERNAL_APPS } from '@/config/externalApps';
import { openExternalApp } from '@/lib/externalAppLink';

const cardBaseStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, textDecoration: 'none',
  borderRadius: 12, padding: '14px 16px', textAlign: 'center',
  transition: 'transform .2s ease, box-shadow .2s ease',
};

// Cross-links to every other public-facing project — the three in this
// monorepo (Mattukosha/Pustaka Kosha/Sanghatana Kosha, via internal routes)
// plus the standalone Pratisangraha app (external, Android-app-aware — see
// lib/externalAppLink.ts). Shared by GenericLanding and Home so it shows up
// regardless of whether a project has admin-authored landing content yet.
const OtherProjectsFooter: React.FC = () => (
  <div style={{ borderTop: '1px solid var(--ps-border)', padding: 'clamp(24px, 6vw, 36px) clamp(14px, 4vw, 22px) clamp(32px, 6vw, 48px)' }}>
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h2 className="kn-serif" style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 700, color: 'var(--ps-muted)', marginBottom: 16, textAlign: 'center' }}>
        ಯಕ್ಷವಾಹಿನಿಯ ಇತರ ಯೋಜನೆಗಳು
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {PROJECTS.map((p, i) => (
          p.active ? (
            <Link key={p.slug} to={`/${p.slug}`} className="ps-animate-in ps-project-card" style={{
              ...cardBaseStyle,
              background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', boxShadow: 'var(--ps-shadow-sm)',
              '--ps-delay': `${0.1 + i * 0.06}s`,
            } as React.CSSProperties}>
              <span className="kn-serif" style={{ fontSize: 'clamp(13px, 3.2vw, 14.5px)', fontWeight: 700, color: 'var(--ps-text)' }}>{p.nameKannada}</span>
              <span style={{ fontSize: 'clamp(10.5px, 2.6vw, 11.5px)', color: 'var(--ps-muted)' }}>{p.name}</span>
            </Link>
          ) : (
            <div key={p.slug} className="ps-animate-in" style={{
              ...cardBaseStyle,
              background: 'var(--ps-surface-2)', border: '1px dashed var(--ps-border)', opacity: 0.6,
              '--ps-delay': `${0.1 + i * 0.06}s`,
            } as React.CSSProperties}>
              <span className="kn-serif" style={{ fontSize: 'clamp(13px, 3.2vw, 14.5px)', fontWeight: 700, color: 'var(--ps-muted)' }}>{p.nameKannada}</span>
              <span style={{ fontSize: 'clamp(10.5px, 2.6vw, 11.5px)', color: 'var(--ps-faint)' }}>{p.name} · Coming soon</span>
            </div>
          )
        ))}
        {EXTERNAL_APPS.map((app, i) => (
          <a
            key={app.key}
            href={app.webUrl}
            onClick={(e) => { e.preventDefault(); openExternalApp(app.deepLinkHost, app.webUrl); }}
            className="ps-animate-in ps-project-card"
            style={{
              ...cardBaseStyle,
              background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', boxShadow: 'var(--ps-shadow-sm)',
              '--ps-delay': `${0.1 + (PROJECTS.length + i) * 0.06}s`,
            } as React.CSSProperties}
          >
            <span className="kn-serif" style={{ fontSize: 'clamp(13px, 3.2vw, 14.5px)', fontWeight: 700, color: 'var(--ps-text)' }}>{app.nameKannada}</span>
            <span style={{ fontSize: 'clamp(10.5px, 2.6vw, 11.5px)', color: 'var(--ps-muted)' }}>{app.name}</span>
          </a>
        ))}
      </div>
    </div>
  </div>
);

export default OtherProjectsFooter;
