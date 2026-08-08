import React from 'react';
import { Link } from 'react-router-dom';
import type { SiteLandingBlock } from '@/services/api';

// The site-wide (root "/") counterpart of LandingBlocks.tsx — same
// paragraph/button rendering, but a button's target is either an external
// URL or one of the specific projects (no "this project's home/library"
// concept exists at the root).
const paragraphStyle: React.CSSProperties = {
  fontSize: 'clamp(14px, 3.8vw, 15.5px)', lineHeight: 1.9, color: 'var(--ps-text)',
  marginBottom: 20, whiteSpace: 'pre-line',
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-block', background: 'var(--ps-grad)', color: '#fff', textDecoration: 'none',
  borderRadius: 999, padding: 'clamp(11px, 3vw, 14px) clamp(20px, 6vw, 30px)', fontWeight: 700,
  fontSize: 'clamp(13.5px, 3.8vw, 15.5px)', boxShadow: 'var(--ps-shadow-md)',
};

const delayFor = (i: number) => `${0.08 + i * 0.05}s`;

interface Props {
  blocks: SiteLandingBlock[];
}

const SiteBlocks: React.FC<Props> = ({ blocks }) => (
  <>
    {blocks.map((block, i) => {
      if (block.type === 'paragraph') {
        return (
          <p
            key={i}
            className="kn-sans ps-animate-in"
            style={{ ...paragraphStyle, '--ps-delay': delayFor(i) } as React.CSSProperties}
          >
            {block.text}
          </p>
        );
      }

      return (
        <div
          key={i}
          className="ps-animate-in"
          style={{ textAlign: 'center', margin: '28px 0', '--ps-delay': delayFor(i) } as React.CSSProperties}
        >
          {block.target_type === 'external' ? (
            <a href={block.url} target="_blank" rel="noopener noreferrer" className="kn-sans" style={buttonStyle}>
              {block.label}
            </a>
          ) : (
            <Link to={`/${block.project_slug}`} className="kn-sans" style={buttonStyle}>
              {block.label}
            </Link>
          )}
        </div>
      );
    })}
  </>
);

export default SiteBlocks;
