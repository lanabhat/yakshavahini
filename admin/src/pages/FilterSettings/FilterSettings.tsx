import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchFilterConfig, updateFilterConfig } from '@/services/api';
import type { FilterFieldOption } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

const FilterSettings: React.FC = () => {
  const { project } = useProject();
  const [available, setAvailable] = useState<FilterFieldOption[]>([]);
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchFilterConfig(project)
      .then((r) => {
        setAvailable(r.data.available);
        setEnabled(new Set(r.data.enabled));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [project]);

  const toggle = (field: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateFilterConfig(project, Array.from(enabled));
      setEnabled(new Set(res.data.enabled));
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: 'var(--ps-text)' }}>
        Public Filter Sidebar
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ps-muted)', marginBottom: 20 }}>
        Choose which fields appear as filters on {project.name}&rsquo;s public library page.
      </p>

      {available.length === 0 ? (
        <p style={{ color: 'var(--ps-muted)' }}>{project.name} has no facet-able fields.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {available.map((opt) => (
            <label key={opt.field} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
              cursor: 'pointer', fontSize: 13.5,
            }}>
              <input type="checkbox" checked={enabled.has(opt.field)} onChange={() => toggle(opt.field)} />
              <span className="kn-sans" style={{ color: 'var(--ps-text)', fontWeight: 600 }}>{opt.label}</span>
              <span style={{ color: 'var(--ps-faint)', fontSize: 11.5, marginLeft: 'auto' }}>
                {opt.kind === 'taxonomy' ? 'taxonomy' : 'scalar'}
              </span>
            </label>
          ))}
        </div>
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

export default FilterSettings;
