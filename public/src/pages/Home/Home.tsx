import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStats } from '@/services/api';
import type { StatsData } from '@/services/api';
import EntryCard from '@/components/EntryCard/EntryCard';
import { PROJECT } from '@/config/project';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    fetchStats().then((r) => setStats(r.data)).catch(console.error);
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 22px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 className="kn-serif" style={{ fontWeight: 700, fontSize: 'clamp(28px, 5vw, 44px)', color: 'var(--ps-text)', margin: '0 0 12px' }}>
          {PROJECT.nameKannada}
        </h1>
        <p style={{ color: 'var(--ps-muted)', fontSize: 15 }}>{stats?.total ?? 0} entries</p>
        <button onClick={() => navigate('/library')}
          style={{
            marginTop: 20, background: 'var(--ps-grad)', color: '#fff', border: 'none',
            borderRadius: 999, padding: '12px 26px', fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
            boxShadow: 'var(--ps-shadow-md)',
          }}>
          Browse Library
        </button>
      </div>

      {stats?.recently_added && stats.recently_added.length > 0 && (
        <section>
          <h2 className="ps-serif" style={{ fontSize: 19, fontWeight: 600, marginBottom: 14, color: 'var(--ps-text)' }}>
            Recently Added
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {stats.recently_added.map((e) => <EntryCard key={e.id} entry={e} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
