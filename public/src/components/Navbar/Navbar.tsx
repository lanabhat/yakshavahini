import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PROJECT } from '@/config/project';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/library?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header style={{ background: 'var(--ps-bg)', borderBottom: '1px solid var(--ps-border)' }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-5">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--ps-grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span className="kn-serif" style={{ color: '#fff', fontSize: 19, fontWeight: 700 }}>ಮ</span>
          </div>
          <div style={{ lineHeight: 1.1 }} className="hidden sm:block">
            <div className="ps-serif" style={{ fontWeight: 600, fontSize: 16, color: 'var(--ps-text)' }}>{PROJECT.name}</div>
            <div className="kn-sans" style={{ fontSize: 11, color: 'var(--ps-muted)' }}>{PROJECT.nameKannada}</div>
          </div>
        </Link>

        <div className="hidden sm:flex flex-1 max-w-xs items-center gap-2"
          style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 999, padding: '8px 14px' }}>
          <Search style={{ width: 14, height: 14, color: 'var(--ps-faint)' }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleSearch}
            placeholder="Search..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: 'var(--ps-text)', width: '100%' }} />
        </div>
        <div className="flex-1" />
        <Link to="/library" className="kn-sans" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ps-muted)' }}>Library</Link>
      </div>
    </header>
  );
};

export default Navbar;
