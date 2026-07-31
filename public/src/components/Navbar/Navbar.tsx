import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';

const THEMES: { id: Theme; label: string }[] = [
  { id: 'simple', label: 'Simple' },
  { id: 'library', label: 'Library' },
  { id: 'dark', label: 'Dark' },
];

const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const project = useProject();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/${project.slug}/library?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header style={{ background: 'var(--ps-bg)', borderBottom: '1px solid var(--ps-border)' }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 h-14 flex items-center gap-2 sm:gap-5">
        <Link to={`/${project.slug}`} className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--ps-grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span className="kn-serif" style={{ color: '#fff', fontSize: 19, fontWeight: 700 }}>{project.nameKannada.charAt(0)}</span>
          </div>
          <div style={{ lineHeight: 1.1, minWidth: 0 }} className="hidden sm:block">
            <div className="ps-serif truncate" style={{ fontWeight: 600, fontSize: 16, color: 'var(--ps-text)' }}>{project.name}</div>
            <div className="kn-sans truncate" style={{ fontSize: 11, color: 'var(--ps-muted)' }}>{project.nameKannada}</div>
          </div>
        </Link>

        <div className="hidden sm:flex flex-1 min-w-0 max-w-xs items-center gap-2"
          style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 999, padding: '8px 14px' }}>
          <Search style={{ width: 14, height: 14, color: 'var(--ps-faint)', flexShrink: 0 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleSearch}
            placeholder="Search..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: 'var(--ps-text)', width: '100%', minWidth: 0 }} />
        </div>
        <div className="flex-1 min-w-0" />

        <div style={{
          alignItems: 'center', gap: 2,
          background: 'var(--ps-surface-2)', borderRadius: 8,
          padding: 3, border: '1px solid var(--ps-border)',
        }} className="hidden sm:flex shrink-0">
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
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          className="sm:hidden shrink-0"
          style={{
            fontSize: 11.5, fontWeight: 600,
            padding: '5px 6px', borderRadius: 6, maxWidth: 78,
            background: 'var(--ps-surface-2)', color: 'var(--ps-accent-text)',
            border: '1px solid var(--ps-border)', outline: 'none',
          }}
          aria-label="Theme"
        >
          {THEMES.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>

        <Link to="/" title="Home" className="hidden md:flex items-center shrink-0" style={{ color: 'var(--ps-faint)' }}>
          <Home style={{ width: 16, height: 16 }} />
        </Link>
        <Link to={`/${project.slug}/library`} className="kn-sans shrink-0" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ps-muted)', whiteSpace: 'nowrap' }}>ಪ್ರವೇಶಿಸಿ</Link>
      </div>
    </header>
  );
};

export default Navbar;
