import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PROJECTS } from '@/config/projects';
import { EXTERNAL_APPS } from '@/config/externalApps';
import { openExternalApp } from '@/lib/externalAppLink';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { fetchSiteHomePage, fetchSiteUpdates } from '@/services/api';
import type { SiteLandingBlock, SiteUpdateItem } from '@/services/api';
import SiteBlocks from '@/components/SiteBlocks/SiteBlocks';
import UpdatesSection from '@/components/UpdatesSection/UpdatesSection';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'simple', label: 'Simple' },
  { id: 'library', label: 'Library' },
  { id: 'dark', label: 'Dark' },
];

const ProjectPicker: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [blocks, setBlocks] = useState<SiteLandingBlock[]>([]);
  const [updates, setUpdates] = useState<SiteUpdateItem[]>([]);

  useEffect(() => {
    fetchSiteHomePage().then((r) => setBlocks(r.data.blocks)).catch(console.error);
    fetchSiteUpdates().then((r) => setUpdates(r.data)).catch(console.error);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--ps-bg)', position: 'relative', paddingTop: 'clamp(24px, 8vh, 90px)' }}>
      <div style={{
        position: 'absolute', top: 16, right: 16,
        display: 'flex', alignItems: 'center', gap: 2,
        background: 'var(--ps-surface-2)', borderRadius: 8,
        padding: 3, border: '1px solid var(--ps-border)',
      }}>
        {THEMES.map(({ id, label }) => (
          <button key={id} onClick={() => setTheme(id)}
            style={{
              fontSize: 11.5, fontWeight: theme === id ? 600 : 400,
              padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: theme === id ? 'var(--ps-surface)' : 'transparent',
              color: theme === id ? 'var(--ps-accent-text)' : 'var(--ps-muted)',
              boxShadow: theme === id ? 'var(--ps-shadow-sm)' : 'none',
              transition: 'all 0.15s',
            }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ maxWidth: 640, padding: '40px 22px', textAlign: 'center' }}>
        <img src="/yakshavahini.svg" alt="Yakshavahini" style={{ width: '100%', maxWidth: 480, height: 'auto', margin: '0 auto 20px', display: 'block' }} />
        <p style={{ color: 'var(--ps-muted)', fontSize: 14, marginBottom: 32 }}>Choose a collection to browse</p>

        {blocks.length > 0 && <SiteBlocks blocks={blocks} />}

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

      {updates.length > 0 && (
        <div style={{ width: '100%' }}>
          <UpdatesSection updates={updates.slice(0, 5)} />
        </div>
      )}
    </div>
  );
};

export default ProjectPicker;
