import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthState } from '@/hooks/useAuth';
import { ProjectProvider } from '@/contexts/ProjectContext';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import Shell from '@/components/Shell/Shell';
import Login from '@/pages/Login/Login';
import Library from '@/pages/Library/Library';
import EntryFormRouter from '@/pages/EntryForm/EntryFormRouter';
import PendingQueue from '@/pages/PendingQueue/PendingQueue';
import DriveAccounts from '@/pages/DriveAccounts/DriveAccounts';
import Users from '@/pages/Users/Users';
import TaxonomyManager from '@/pages/Taxonomy/TaxonomyManager';
import FilterSettings from '@/pages/FilterSettings/FilterSettings';
import ListDisplaySettings from '@/pages/ListDisplaySettings/ListDisplaySettings';
import DeletionApprovalQueue from '@/pages/Deletions/DeletionApprovalQueue';
import LandingPageEditor from '@/pages/LandingPageEditor/LandingPageEditor';
import HomePageEditor from '@/pages/HomePageEditor/HomePageEditor';

const App: React.FC = () => {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute role="volunteer"><Shell /></ProtectedRoute>}>
              <Route path="/" element={<Library />} />
              <Route path="/entries/new" element={<EntryFormRouter />} />
              <Route path="/entries/:id/edit" element={<EntryFormRouter />} />
              <Route path="/pending" element={<ProtectedRoute role="editor"><PendingQueue /></ProtectedRoute>} />
              <Route path="/taxonomy" element={<ProtectedRoute role="editor"><TaxonomyManager /></ProtectedRoute>} />
              <Route path="/filters" element={<ProtectedRoute role="editor"><FilterSettings /></ProtectedRoute>} />
              <Route path="/list-display" element={<ProtectedRoute role="editor"><ListDisplaySettings /></ProtectedRoute>} />
              <Route path="/deletions" element={<ProtectedRoute role="editor"><DeletionApprovalQueue /></ProtectedRoute>} />
              <Route path="/landing-page" element={<ProtectedRoute role="editor"><LandingPageEditor /></ProtectedRoute>} />
              <Route path="/home-page" element={<ProtectedRoute role="editor"><HomePageEditor /></ProtectedRoute>} />
              <Route path="/drive-accounts" element={<ProtectedRoute role="admin"><DriveAccounts /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute role="admin"><Users /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </AuthContext.Provider>
  );
};

export default App;
