import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutGrid, ListChecks, HardDrive, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PROJECT } from '@/config/project';

const NAV_ITEMS = [
  { label: 'Library', href: '/', icon: LayoutGrid },
  { label: 'Pending Review', href: '/pending', icon: ListChecks },
  { label: 'Drive Accounts', href: '/drive-accounts', icon: HardDrive, roles: ['admin'] },
  { label: 'Users', href: '/users', icon: Users, roles: ['admin'] },
];

const Shell: React.FC = () => {
  const { user, role, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--ps-bg)' }}>
      <aside style={{ width: 220, borderRight: '1px solid var(--ps-border)', padding: '20px 14px', flexShrink: 0 }}>
        <div className="ps-serif" style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--ps-text)' }}>
          {PROJECT.name} Admin
        </div>
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
