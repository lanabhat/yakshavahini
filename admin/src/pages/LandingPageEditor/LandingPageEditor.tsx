import React, { useEffect, useState } from 'react';
import { Loader2, ChevronUp, ChevronDown, X, Plus, AlignLeft, MousePointerClick, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { fetchLandingPage, updateLandingPage } from '@/services/api';
import type { LandingBlock, LandingButtonTarget } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';
import LandingBlocksPreview from '@/components/LandingBlocksPreview/LandingBlocksPreview';

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ps-border)',
  fontSize: 13.5, width: '100%', outline: 'none', background: 'var(--ps-surface)', color: 'var(--ps-text)',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--ps-muted)', display: 'block', marginBottom: 4 };
const iconBtnStyle: React.CSSProperties = {
  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, border: '1px solid var(--ps-border)', background: 'var(--ps-bg)', cursor: 'pointer', flexShrink: 0,
};

const LandingPageEditor: React.FC = () => {
  const { project } = useProject();
  const [blocks, setBlocks] = useState<LandingBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchLandingPage(project)
      .then((r) => setBlocks(r.data.blocks))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [project]);

  const addParagraph = () => setBlocks((prev) => [...prev, { type: 'paragraph', text: '' }]);
  const addButton = () => setBlocks((prev) => [...prev, { type: 'button', label: '', target_type: 'library' }]);
  const remove = (index: number) => setBlocks((prev) => prev.filter((_, i) => i !== index));
  const move = (index: number, delta: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const updateBlock = (index: number, patch: Partial<LandingBlock>) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } as LandingBlock : b)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateLandingPage(project, blocks);
      setBlocks(res.data.blocks);
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: 'var(--ps-text)' }}>
            Landing Page
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ps-muted)', marginBottom: 20 }}>
            Build {project.name}&rsquo;s public landing page out of paragraphs and buttons, in the order
            they should appear. If left empty, the public site falls back to its default stats page.
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
            Preview — how this looks on the public site
          </div>
          <LandingBlocksPreview blocks={blocks} />
        </div>
      )}

      {blocks.length === 0 ? (
        <p style={{ color: 'var(--ps-faint)', fontSize: 13, marginBottom: 16 }}>No content yet — add a paragraph or button below.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {blocks.map((block, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, padding: '12px 14px',
              borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={{ ...iconBtnStyle, height: 22, opacity: i === 0 ? 0.4 : 1 }}>
                  <ChevronUp style={{ width: 12, height: 12 }} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} style={{ ...iconBtnStyle, height: 22, opacity: i === blocks.length - 1 ? 0.4 : 1 }}>
                  <ChevronDown style={{ width: 12, height: 12 }} />
                </button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {block.type === 'paragraph' ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--ps-muted)', textTransform: 'uppercase' }}>
                      <AlignLeft style={{ width: 12, height: 12 }} /> Paragraph
                    </div>
                    <textarea
                      value={block.text}
                      onChange={(e) => updateBlock(i, { text: e.target.value })}
                      style={{ ...inputStyle, minHeight: 70 }}
                      placeholder="Paragraph text..."
                    />
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--ps-muted)', textTransform: 'uppercase' }}>
                      <MousePointerClick style={{ width: 12, height: 12 }} /> Button
                    </div>
                    <div>
                      <label style={labelStyle}>Label</label>
                      <input style={inputStyle} value={block.label} onChange={(e) => updateBlock(i, { label: e.target.value })} placeholder="e.g. Browse Library" />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Redirects to</label>
                        <select
                          value={block.target_type}
                          onChange={(e) => updateBlock(i, { target_type: e.target.value as LandingButtonTarget })}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          <option value="library">This project&rsquo;s Library</option>
                          <option value="home">This project&rsquo;s Home</option>
                          <option value="external">A link (external URL)</option>
                        </select>
                      </div>
                      {block.target_type === 'external' && (
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>URL</label>
                          <input style={inputStyle} value={block.url || ''} onChange={(e) => updateBlock(i, { url: e.target.value })} placeholder="https://..." />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <button onClick={() => remove(i)} style={{ ...iconBtnStyle, borderColor: '#FECACA', color: '#DC2626', alignSelf: 'flex-start' }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={addParagraph} className="kn-sans"
          style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, padding: '7px 12px',
            borderRadius: 999, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
            color: 'var(--ps-text)', cursor: 'pointer',
          }}>
          <Plus style={{ width: 12, height: 12 }} /> Add paragraph
        </button>
        <button onClick={addButton} className="kn-sans"
          style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, padding: '7px 12px',
            borderRadius: 999, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
            color: 'var(--ps-text)', cursor: 'pointer',
          }}>
          <Plus style={{ width: 12, height: 12 }} /> Add button
        </button>
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--ps-grad)', color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

export default LandingPageEditor;
