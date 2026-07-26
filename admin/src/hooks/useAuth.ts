import { useState, useEffect, createContext, useContext } from 'react';
import { fetchMe } from '../services/api';

interface AuthUser {
  email: string;
  name: string;
  picture: string;
  role: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  isAuthenticated: false,
  role: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const useAuthState = (): AuthState => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((r) => setUser({ email: r.data.email, name: r.data.name, picture: r.data.picture, role: r.data.role }))
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return { user, isAuthenticated: !!user, role: user?.role ?? null, loading, setUser, logout };
};
