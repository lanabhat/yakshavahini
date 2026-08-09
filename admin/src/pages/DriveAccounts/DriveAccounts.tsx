import React, { useEffect, useState } from 'react';
import { Loader2, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchDriveAccounts, startDriveOAuth, updateDriveAccount, deleteDriveAccount } from '@/services/api';
import type { DriveAccount } from '@/services/api';

const iconBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
  border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
};

const DriveAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<DriveAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    fetchDriveAccounts().then((r) => setAccounts(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const res = await startDriveOAuth();
      window.location.href = res.data.authorization_url;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to start Google sign-in');
      setConnecting(false);
    }
  };

  const makeDefault = async (account: DriveAccount) => {
    setBusyId(account.id);
    try {
      await updateDriveAccount(account.id, { is_default: true });
      setAccounts((prev) => prev.map((a) => ({ ...a, is_default: a.id === account.id })));
      toast.success(`"${account.label}" is now the default`);
    } catch {
      toast.error('Failed to set as default');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (account: DriveAccount) => {
    if (!window.confirm(`Delete "${account.label}"? This cannot be undone. Files it already uploaded stay intact, just without a linked account.`)) return;
    setBusyId(account.id);
    try {
      await deleteDriveAccount(account.id);
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ps-text)' }}>Drive Accounts</h1>
        <button onClick={connect} disabled={connecting} style={{ background: 'var(--ps-grad)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, cursor: connecting ? 'default' : 'pointer', opacity: connecting ? 0.6 : 1 }}>
          {connecting ? 'Connecting...' : 'Connect Google Account'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {accounts.map((a) => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '12px 16px', borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ps-text)' }}>{a.label} {a.is_default && '(default)'}</div>
              <div style={{ fontSize: 12, color: 'var(--ps-muted)' }}>{a.file_count} files · {a.is_active ? 'active' : 'inactive'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!a.is_default && (
                <button onClick={() => makeDefault(a)} disabled={busyId === a.id} style={iconBtnStyle}>
                  <Star style={{ width: 13, height: 13 }} /> Set as default
                </button>
              )}
              <button onClick={() => remove(a)} disabled={busyId === a.id}
                style={{ ...iconBtnStyle, borderColor: '#FECACA', color: '#DC2626' }}>
                <Trash2 style={{ width: 13, height: 13 }} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriveAccounts;
