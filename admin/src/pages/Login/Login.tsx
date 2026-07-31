import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { adminLogin } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin(username, password);
      localStorage.setItem('auth_token', res.data.token);
      setUser({ email: res.data.email, name: res.data.name, picture: res.data.picture, role: res.data.role });
      navigate('/');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ps-bg)' }}>
      <form onSubmit={handleSubmit} style={{
        background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 16,
        padding: 32, width: 340, boxShadow: 'var(--ps-shadow-md)', display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <img src="/logo.png" alt="Yakshavahini" style={{ width: 48, height: 48, margin: '0 auto 4px', display: 'block' }} />
        <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: 'var(--ps-text)', textAlign: 'center' }}>
          Yakshavahini Admin
        </h1>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username or email"
          style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--ps-border)', fontSize: 14 }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password"
          style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--ps-border)', fontSize: 14 }} />
        <button type="submit" disabled={loading}
          style={{ background: 'var(--ps-grad)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default Login;
