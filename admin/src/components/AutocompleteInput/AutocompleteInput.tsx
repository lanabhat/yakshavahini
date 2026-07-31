import React, { useEffect, useRef, useState } from 'react';
import { autocomplete } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

interface Props {
  field: string;
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

const AutocompleteInput: React.FC<Props> = ({ field, value, onValueChange, label, placeholder, style }) => {
  const { project } = useProject();
  const [suggestions, setSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(() => {
      autocomplete(project, field, value).then((res) => {
        setSuggestions(res.data);
        setOpen(res.data.length > 0);
        setActiveIdx(-1);
      }).catch(() => setSuggestions([]));
    }, 280);
    return () => clearTimeout(t);
  }, [project, field, value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (name: string) => {
    onValueChange(name);
    setOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); select(suggestions[activeIdx].name); }
    if (e.key === 'Escape') setOpen(false);
  };

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ps-border)',
    fontSize: 13.5, width: '100%', outline: 'none', background: 'var(--ps-surface)', color: 'var(--ps-text)',
    ...style,
  };
  const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: 'var(--ps-muted)', display: 'block', marginBottom: 6 };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        value={value}
        placeholder={placeholder}
        style={inputStyle}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && (
        <div style={{
          position: 'absolute', zIndex: 50, width: '100%', marginTop: 4, borderRadius: 8, overflow: 'hidden',
          background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', boxShadow: 'var(--ps-shadow-md)',
        }}>
          <ul style={{ maxHeight: 208, overflowY: 'auto', padding: '4px 0', margin: 0, listStyle: 'none' }}>
            {suggestions.map((s, idx) => (
              <li
                key={s.id}
                onMouseDown={() => select(s.name)}
                className="kn-sans"
                style={{
                  padding: '8px 12px', fontSize: 13.5, cursor: 'pointer',
                  background: idx === activeIdx ? 'var(--ps-accent-soft)' : 'transparent',
                  color: idx === activeIdx ? 'var(--ps-accent-text)' : 'var(--ps-text)',
                }}
              >
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
