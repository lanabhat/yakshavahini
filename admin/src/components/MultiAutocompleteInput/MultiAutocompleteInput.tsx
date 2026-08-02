import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { autocomplete } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

interface Props {
  field: string;
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  placeholder?: string;
}

const MultiAutocompleteInput: React.FC<Props> = ({ field, values, onChange, label, placeholder }) => {
  const { project } = useProject();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (input.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(() => {
      autocomplete(project, field, input).then((res) => {
        const filtered = res.data.filter((s) => !values.includes(s.name));
        setSuggestions(filtered);
        setOpen(filtered.length > 0);
      }).catch(() => setSuggestions([]));
    }, 280);
    return () => clearTimeout(t);
  }, [project, field, input, values]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const add = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInput('');
    setOpen(false);
    setSuggestions([]);
  };

  const remove = (name: string) => onChange(values.filter((v) => v !== name));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add(input);
    }
    if (e.key === 'Escape') setOpen(false);
  };

  const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: 'var(--ps-muted)', display: 'block', marginBottom: 6 };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && <label style={labelStyle}>{label}</label>}
      {values.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {values.map((v) => (
            <span key={v} className="kn-sans" style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, padding: '4px 8px',
              borderRadius: 999, background: 'var(--ps-accent-soft)', color: 'var(--ps-accent-text)',
            }}>
              {v}
              <button onClick={() => remove(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
                <X style={{ width: 11, height: 11 }} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        placeholder={placeholder}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => input.length > 0 && suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        style={{
          padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ps-border)',
          fontSize: 13.5, width: '100%', outline: 'none', background: 'var(--ps-surface)', color: 'var(--ps-text)',
        }}
      />
      {open && (
        <div style={{
          position: 'absolute', zIndex: 50, width: '100%', marginTop: 4, borderRadius: 8, overflow: 'hidden',
          background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', boxShadow: 'var(--ps-shadow-md)',
        }}>
          <ul style={{ maxHeight: 208, overflowY: 'auto', padding: '4px 0', margin: 0, listStyle: 'none' }}>
            {suggestions.map((s) => (
              <li key={s.id} onMouseDown={() => add(s.name)} className="kn-sans"
                style={{ padding: '8px 12px', fontSize: 13.5, cursor: 'pointer', color: 'var(--ps-text)' }}>
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiAutocompleteInput;
