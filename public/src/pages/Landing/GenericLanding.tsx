import React, { useEffect, useState } from 'react';
import { fetchLandingPage } from '@/services/api';
import type { LandingBlock } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';
import LandingBlocks from '@/components/LandingBlocks/LandingBlocks';
import OtherProjectsFooter from '@/components/OtherProjectsFooter/OtherProjectsFooter';
import Home from '@/pages/Home/Home';

// Renders the admin-authored landing page for whichever project is active.
// Falls back to the generic stats/Recently-Added Home page when the admin
// hasn't configured any content yet for this project (see
// LandingPageConfigView on the backend — an unconfigured project reports an
// empty block list, not a 404).
const GenericLanding: React.FC = () => {
  const project = useProject();
  const [blocks, setBlocks] = useState<LandingBlock[] | null>(null);

  useEffect(() => {
    setBlocks(null);
    fetchLandingPage(project).then((r) => setBlocks(r.data.blocks)).catch(() => setBlocks([]));
  }, [project]);

  if (blocks === null) return null;
  if (blocks.length === 0) return <Home />;

  return (
    <div style={{ background: 'var(--ps-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(20px, 5vw, 40px) clamp(14px, 4vw, 22px) clamp(32px, 6vw, 60px)' }}>
        <div
          className="kn-sans ps-animate-in"
          style={{
            background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 18,
            boxShadow: 'var(--ps-shadow-md)', padding: 'clamp(20px, 5vw, 48px) clamp(16px, 5vw, 44px)',
            maxWidth: '100%', overflowWrap: 'break-word',
          }}
        >
          <h1
            className="kn-serif ps-animate-in"
            style={{
              fontWeight: 700, fontSize: 'clamp(24px, 6vw, 36px)', color: 'var(--ps-text)',
              marginBottom: 'clamp(18px, 4vw, 30px)', textAlign: 'center',
            }}
          >
            {project.nameKannada}
          </h1>
          <LandingBlocks project={project} blocks={blocks} />
        </div>
      </div>

      <OtherProjectsFooter />
    </div>
  );
};

export default GenericLanding;
