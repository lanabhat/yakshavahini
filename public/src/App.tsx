import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProjectPicker from '@/pages/ProjectPicker/ProjectPicker';
import ProjectLayout from '@/pages/ProjectLayout/ProjectLayout';
import ProjectIndex from '@/pages/ProjectLayout/ProjectIndex';
import Home from '@/pages/Home/Home';
import Library from '@/pages/Library/Library';
import EntryDetail from '@/pages/EntryDetail/EntryDetail';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen" style={{ background: 'var(--ps-bg)' }}>
          <Routes>
            <Route path="/" element={<ProjectPicker />} />
            <Route path="/:project" element={<ProjectLayout />}>
              <Route index element={<ProjectIndex />} />
              <Route path="home" element={<Home />} />
              <Route path="library" element={<Library />} />
              <Route path="entry/:id" element={<EntryDetail />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
