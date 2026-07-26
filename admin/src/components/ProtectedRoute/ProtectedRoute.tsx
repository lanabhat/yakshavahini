import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ROLE_RANK: Record<string, number> = { volunteer: 1, editor: 2, admin: 3 };

const ProtectedRoute: React.FC<{ role: 'volunteer' | 'editor' | 'admin'; children: React.ReactNode }> = ({ role, children }) => {
  const { isAuthenticated, role: userRole, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!userRole || ROLE_RANK[userRole] < ROLE_RANK[role]) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
