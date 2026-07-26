import React from 'react';
import { Link } from 'react-router-dom';
import { PROJECTS } from '@/config/projects';

const ProjectPicker: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ps-bg)' }}>
      <div style={{ maxWidth: 640, padding: '40px 22px', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: 'var(--ps-grad)', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="kn-serif" style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>ಯ</span>
        </div>
        <h1 className="kn-serif" style={{ fontWeight: 700, fontSize: 'clamp(24px, 4vw, 34px)', color: 'var(--ps-text)', margin: '0 0 8px' }}>
          ಯಕ್ಷವಾಹಿನಿ
        </h1>
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
        </div>
      </div>
    </div>
  );
};

export default ProjectPicker;
