import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar/Navbar';
import Home from '@/pages/Home/Home';
import Library from '@/pages/Library/Library';
import EntryDetail from '@/pages/EntryDetail/EntryDetail';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: 'var(--ps-bg)' }}>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/entry/:id" element={<EntryDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
