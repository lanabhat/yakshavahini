import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutGrid, ListChecks, HardDrive, Users, Tags, SlidersHorizontal, Rows3, Trash2, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';
import { PROJECTS } from '@/config/projects';

const Shell: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { project, setProjectSlug } = useProject();

  const NAV_ITEMS = [
    { label: 'Library', href: '/', icon: LayoutGrid },
    { label: 'Pending Review', href: '/pending', icon: ListChecks },
    ...(project.taxonomyFields.length > 0 ? [{ label: 'Taxonomy', href: '/taxonomy', icon: Tags }] : []),
    { label: 'Filters', href: '/filters', icon: SlidersHorizontal, roles: ['editor', 'admin'] },
    { label: 'List Display', href: '/list-display', icon: Rows3, roles: ['editor', 'admin'] },
    { label: 'Deletion Requests', href: '/deletions', icon: Trash2, roles: ['editor', 'admin'] },
    { label: 'Landing Page', href: '/landing-page', icon: FileText, roles: ['editor', 'admin'] },
    { label: 'Drive Accounts', href: '/drive-accounts', icon: HardDrive, roles: ['admin'] },
    { label: 'Users', href: '/users', icon: Users, roles: ['admin'] },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--ps-bg)' }}>
      <aside style={{ width: 220, borderRight: '1px solid var(--ps-border)', padding: '20px 14px', flexShrink: 0 }}>
        <div className="ps-serif" style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--ps-text)' }}>
          Yakshavahini Admin
        </div>
        <select
          value={project.slug}
          onChange={(e) => setProjectSlug(e.target.value)}
          style={{
            width: '100%', marginBottom: 12, padding: '7px 10px', borderRadius: 8,
            border: '1px solid var(--ps-border)', fontSize: 13, background: 'var(--ps-surface)', color: 'var(--ps-text)',
          }}
        >
          {PROJECTS.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
        <div style={{ fontSize: 12, color: 'var(--ps-muted)', marginBottom: 20 }}>{user?.email}</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role || '')).map(({ label, href, icon: Icon }) => (
            <NavLink key={href} to={href} end={href === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                fontSize: 13.5, textDecoration: 'none',
                background: isActive ? 'var(--ps-accent-soft)' : 'transparent',
                color: isActive ? 'var(--ps-accent-text)' : 'var(--ps-muted)',
              })}>
              <Icon style={{ width: 16, height: 16 }} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} style={{ marginTop: 20, fontSize: 12.5, color: 'var(--ps-faint)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign out
        </button>
      </aside>
      <main style={{ flex: 1, padding: 24, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Shell;
