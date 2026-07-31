import React from 'react';
import { Link } from 'react-router-dom';
import { PROJECTS } from '@/config/projects';
import { EXTERNAL_APPS } from '@/config/externalApps';
import { openExternalApp } from '@/lib/externalAppLink';

const ProjectPicker: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ps-bg)' }}>
      <div style={{ maxWidth: 640, padding: '40px 22px', textAlign: 'center' }}>
        <img src="/logo.png" alt="Yakshavahini" style={{ height: 'clamp(110px, 22vw, 150px)', width: 'auto', margin: '0 auto 20px', display: 'block' }} />
        <p style={{ color: 'var(--ps-muted)', fontSize: 14, marginBottom: 32 }}>Choose a collection to browse</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {PROJECTS.map((p) => (
            p.active ? (
              <Link key={p.slug} to={`/${p.slug}`} style={{
                display: 'flex', flexDirection: 'column', gap: 6, textDecoration: 'none',
                background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 16,
                padding: '20px 16px', boxShadow: 'var(--ps-shadow-sm)', transition: 'box-shadow .15s, transform .15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--ps-shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--ps-shadow-sm)'; e.currentTarget.style.transform = ''; }}
              >
                <span className="kn-serif" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ps-text)' }}>{p.nameKannada}</span>
                <span style={{ fontSize: 12.5, color: 'var(--ps-muted)' }}>{p.name}</span>
              </Link>
            ) : (
              <div key={p.slug} style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                background: 'var(--ps-surface-2)', border: '1px dashed var(--ps-border)', borderRadius: 16,
                padding: '20px 16px', opacity: 0.6,
              }}>
                <span className="kn-serif" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ps-muted)' }}>{p.nameKannada}</span>
                <span style={{ fontSize: 12.5, color: 'var(--ps-faint)' }}>{p.name} · Coming soon</span>
              </div>
            )
          ))}
          {EXTERNAL_APPS.map((app) => (
            <a
              key={app.key}
              href={app.webUrl}
              onClick={(e) => { e.preventDefault(); openExternalApp(app.deepLinkHost, app.webUrl); }}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6, textDecoration: 'none',
                background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 16,
                padding: '20px 16px', boxShadow: 'var(--ps-shadow-sm)', transition: 'box-shadow .15s, transform .15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--ps-shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--ps-shadow-sm)'; e.currentTarget.style.transform = ''; }}
            >
              <span className="kn-serif" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ps-text)' }}>{app.nameKannada}</span>
              <span style={{ fontSize: 12.5, color: 'var(--ps-muted)' }}>{app.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectPicker;
