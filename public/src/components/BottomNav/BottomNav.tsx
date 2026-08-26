import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';

const BottomNav: React.FC = () => {
  const project = useProject();

  const items = [
    { label: project.nameKannada, href: `/${project.slug}`, icon: LayoutGrid, end: true },
    { label: 'Home', href: '/', icon: Home, end: true },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch h-16"
      style={{ background: 'var(--ps-surface)', borderTop: '1px solid var(--ps-border)', boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}
    >
      {items.map(({ label, href, icon: Icon, end }) => (
        <NavLink key={href} to={href} end={end}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium"
          style={({ isActive }) => ({ color: isActive ? 'var(--ps-accent-text)' : 'var(--ps-faint)', textDecoration: 'none' })}
        >
          {({ isActive }) => (
            <>
              <Icon className="w-5 h-5" style={{ color: isActive ? 'var(--ps-accent-text)' : 'var(--ps-faint)' }} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
