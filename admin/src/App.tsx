import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthState } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import Shell from '@/components/Shell/Shell';
import Login from '@/pages/Login/Login';
import Library from '@/pages/Library/Library';
import EntryForm from '@/pages/EntryForm/EntryForm';
import PendingQueue from '@/pages/PendingQueue/PendingQueue';
import DriveAccounts from '@/pages/DriveAccounts/DriveAccounts';
import Users from '@/pages/Users/Users';

const App: React.FC = () => {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute role="volunteer"><Shell /></ProtectedRoute>}>
            <Route path="/" element={<Library />} />
            <Route path="/entries/new" element={<EntryForm />} />
            <Route path="/entries/:id/edit" element={<EntryForm />} />
            <Route path="/pending" element={<ProtectedRoute role="editor"><PendingQueue /></ProtectedRoute>} />
            <Route path="/drive-accounts" element={<ProtectedRoute role="admin"><DriveAccounts /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute role="admin"><Users /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default App;
