import React from 'react';
import { Link } from 'react-router-dom';
import type { LandingBlock } from '@/services/api';
import type { ProjectConfig } from '@/config/projects';

const paragraphStyle: React.CSSProperties = {
  fontSize: 'clamp(14px, 3.8vw, 15.5px)', lineHeight: 1.9, color: 'var(--ps-text)',
  marginBottom: 20, whiteSpace: 'pre-line',
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-block', background: 'var(--ps-grad)', color: '#fff', textDecoration: 'none',
  borderRadius: 999, padding: 'clamp(11px, 3vw, 14px) clamp(20px, 6vw, 30px)', fontWeight: 700,
  fontSize: 'clamp(13.5px, 3.8vw, 15.5px)', boxShadow: 'var(--ps-shadow-md)',
};

// Every block animates in on load, staggered by its position — small enough
// delays that a long article doesn't feel like it's still loading by the
// time you scroll to it.
const delayFor = (i: number) => `${0.08 + i * 0.05}s`;

interface Props {
  project: ProjectConfig;
  blocks: LandingBlock[];
}

const LandingBlocks: React.FC<Props> = ({ project, blocks }) => (
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
            <Link
              to={block.target_type === 'library' ? `/${project.slug}/library` : `/${project.slug}`}
              className="kn-sans"
              style={buttonStyle}
            >
              {block.label}
            </Link>
          )}
        </div>
      );
    })}
  </>
);

export default LandingBlocks;
