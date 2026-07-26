import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProjectPicker from '@/pages/ProjectPicker/ProjectPicker';
import ProjectLayout from '@/pages/ProjectLayout/ProjectLayout';
import Home from '@/pages/Home/Home';
import Library from '@/pages/Library/Library';
import EntryDetail from '@/pages/EntryDetail/EntryDetail';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: 'var(--ps-bg)' }}>
        <Routes>
          <Route path="/" element={<ProjectPicker />} />
          <Route path="/:project" element={<ProjectLayout />}>
            <Route index element={<Home />} />
            <Route path="library" element={<Library />} />
            <Route path="entry/:id" element={<EntryDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
