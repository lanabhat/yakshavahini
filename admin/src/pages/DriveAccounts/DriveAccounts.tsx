import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchDriveAccounts, startDriveOAuth } from '@/services/api';
import type { DriveAccount } from '@/services/api';

const DriveAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<DriveAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriveAccounts().then((r) => setAccounts(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const connect = async () => {
    const res = await startDriveOAuth();
    window.location.href = res.data.authorization_url;
  };

  if (loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ps-text)' }}>Drive Accounts</h1>
        <button onClick={connect} style={{ background: 'var(--ps-grad)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
          Connect Google Account
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {accounts.map((a) => (
          <div key={a.id} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ps-text)' }}>{a.label} {a.is_default && '(default)'}</div>
            <div style={{ fontSize: 12, color: 'var(--ps-muted)' }}>{a.file_count} files · {a.is_active ? 'active' : 'inactive'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriveAccounts;
