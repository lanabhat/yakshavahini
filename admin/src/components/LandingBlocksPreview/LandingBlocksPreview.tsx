import React from 'react';
import type { LandingBlock } from '@/services/api';

// A non-interactive port of the public app's LandingBlocks.tsx, used to give
// admins a live preview of unsaved landing-page edits without needing to
// save first or duplicate the public app's routing.
const paragraphStyle: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.8, color: 'var(--ps-text)', marginBottom: 18, whiteSpace: 'pre-line',
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-block', background: 'var(--ps-grad)', color: '#fff', textDecoration: 'none',
  borderRadius: 999, padding: '11px 24px', fontWeight: 700, fontSize: 14, cursor: 'default',
};

interface Props {
  blocks: LandingBlock[];
}

const LandingBlocksPreview: React.FC<Props> = ({ blocks }) => {
  if (blocks.length === 0) {
    return <p style={{ color: 'var(--ps-faint)', fontSize: 13 }}>Nothing to preview yet — add a paragraph or button.</p>;
  }

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'paragraph') {
          return (
            <p key={i} className="kn-sans" style={paragraphStyle}>
              {block.text || <span style={{ color: 'var(--ps-faint)' }}>(empty paragraph)</span>}
            </p>
          );
        }
        return (
          <div key={i} style={{ textAlign: 'center', margin: '20px 0' }}>
            <span className="kn-sans" style={buttonStyle}>
              {block.label || '(untitled button)'}
            </span>
          </div>
        );
      })}
    </>
  );
};

export default LandingBlocksPreview;
