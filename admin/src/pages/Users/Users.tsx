import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchUsers, updateUser } from '@/services/api';
import type { User } from '@/services/api';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchUsers().then((r) => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeRole = async (id: number, role: string) => {
    try {
      await updateUser(id, { role });
      toast.success('Updated');
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  if (loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  return (
    <div>
      <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: 'var(--ps-text)' }}>Users</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map((u) => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ps-text)' }}>{u.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ps-muted)' }}>{u.email}</div>
            </div>
            <select value={u.role || ''} onChange={(e) => changeRole(u.id, e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--ps-border)', fontSize: 12.5 }}>
              <option value="volunteer">Volunteer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
