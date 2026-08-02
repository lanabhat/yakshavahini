import React, { useEffect, useState } from 'react';
import { Loader2, ChevronUp, ChevronDown, X, Plus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { fetchListDisplayConfig, updateListDisplayConfig, searchAllEntries } from '@/services/api';
import type { ListDisplayFieldOption, ListDisplaySelection, FontSize, Entry } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';
import ListFieldsPreview from '@/components/ListFieldsPreview/ListFieldsPreview';

const DEFAULT_SIZE: FontSize = 'sm';

const ListDisplaySettings: React.FC = () => {
  const { project } = useProject();
  const [available, setAvailable] = useState<ListDisplayFieldOption[]>([]);
  const [selected, setSelected] = useState<ListDisplaySelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sampleEntry, setSampleEntry] = useState<Entry | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSampleEntry(null);
    fetchListDisplayConfig(project)
      .then((r) => {
        setAvailable(r.data.available);
        setSelected(r.data.selected);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [project]);

  useEffect(() => {
    if (!showPreview || sampleEntry) return;
    setSampleLoading(true);
    searchAllEntries(project, { pageno: 0 })
      .then((r) => setSampleEntry(r.data.dataset[0] ?? null))
      .catch(console.error)
      .finally(() => setSampleLoading(false));
  }, [showPreview, sampleEntry, project]);

  const selectedFieldNames = new Set(selected.map((s) => s.field));
  const unselected = available.filter((opt) => !selectedFieldNames.has(opt.field));
  const labelFor = (field: string) => available.find((a) => a.field === field)?.label ?? field;

  const add = (field: string) => setSelected((prev) => [...prev, { field, font_size: DEFAULT_SIZE }]);
  const remove = (field: string) => setSelected((prev) => prev.filter((s) => s.field !== field));
  const setSize = (field: string, font_size: FontSize) =>
    setSelected((prev) => prev.map((s) => (s.field === field ? { ...s, font_size } : s)));
  const move = (index: number, delta: number) => {
    setSelected((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateListDisplayConfig(project, selected);
      setSelected(res.data.selected);
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', fontSize: 13.5,
  };
  const iconBtnStyle: React.CSSProperties = {
    width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, border: '1px solid var(--ps-border)', background: 'var(--ps-bg)', cursor: 'pointer', flexShrink: 0,
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: 'var(--ps-text)' }}>
            List View Display Fields
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ps-muted)', marginBottom: 20 }}>
            Choose which extra fields appear under the title on {project.name}&rsquo;s public library
            list, the order they appear in, and how large each one shows.
          </p>
        </div>
        <button onClick={() => setShowPreview((v) => !v)} className="kn-sans"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '7px 12px', flexShrink: 0,
            borderRadius: 8, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
            color: 'var(--ps-text)', cursor: 'pointer',
          }}>
          {showPreview ? <EyeOff style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
          {showPreview ? 'Hide preview' : 'Preview'}
        </button>
      </div>

      {showPreview && (
        <div style={{
          borderRadius: 14, border: '1px solid var(--ps-border)', background: 'var(--ps-bg)',
          padding: '20px 22px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ps-faint)', textTransform: 'uppercase', marginBottom: 12 }}>
            Preview — how this looks on the public library list
          </div>
          {sampleLoading ? (
            <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />
          ) : sampleEntry ? (
            <ListFieldsPreview entry={sampleEntry} titleField={project.titleField} selected={selected} available={available} />
          ) : (
            <p style={{ color: 'var(--ps-faint)', fontSize: 13 }}>No entries yet to preview with.</p>
          )}
        </div>
      )}

      {available.length === 0 ? (
        <p style={{ color: 'var(--ps-muted)' }}>{project.name} has no displayable fields.</p>
      ) : (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ps-muted)', marginBottom: 8 }}>
            Selected (display order)
          </div>
          {selected.length === 0 ? (
            <p style={{ color: 'var(--ps-faint)', fontSize: 13, marginBottom: 16 }}>Nothing selected — only the title shows.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {selected.map((s, i) => (
                <div key={s.field} style={rowStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => move(i, -1)} disabled={i === 0} style={{ ...iconBtnStyle, height: 12, opacity: i === 0 ? 0.4 : 1 }}>
                      <ChevronUp style={{ width: 12, height: 12 }} />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === selected.length - 1} style={{ ...iconBtnStyle, height: 12, opacity: i === selected.length - 1 ? 0.4 : 1 }}>
                      <ChevronDown style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                  <span className="kn-sans" style={{ color: 'var(--ps-text)', fontWeight: 600, flex: 1 }}>{labelFor(s.field)}</span>
                  <select
                    value={s.font_size}
                    onChange={(e) => setSize(s.field, e.target.value as FontSize)}
                    style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--ps-border)', fontSize: 12.5, background: 'var(--ps-bg)', color: 'var(--ps-text)' }}
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                  <button onClick={() => remove(s.field)} style={{ ...iconBtnStyle, borderColor: '#FECACA', color: '#DC2626' }}>
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {unselected.length > 0 && (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ps-muted)', marginBottom: 8 }}>
                Add a field
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {unselected.map((opt) => (
                  <button key={opt.field} onClick={() => add(opt.field)} className="kn-sans"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, padding: '6px 10px',
                      borderRadius: 999, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
                      color: 'var(--ps-text)', cursor: 'pointer',
                    }}>
                    <Plus style={{ width: 12, height: 12 }} /> {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {available.length > 0 && (
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--ps-grad)', color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      )}
    </div>
  );
};

export default ListDisplaySettings;
