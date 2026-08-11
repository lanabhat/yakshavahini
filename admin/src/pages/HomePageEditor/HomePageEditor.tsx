import React, { useEffect, useState } from 'react';
import {
  Loader2, ChevronUp, ChevronDown, X, Plus, AlignLeft, MousePointerClick, Eye, EyeOff, Pencil, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchSiteHomePage, updateSiteHomePage,
  fetchSiteUpdates, createSiteUpdate, updateSiteUpdate, deleteSiteUpdate,
} from '@/services/api';
import type { SiteLandingBlock, SiteButtonTarget, SiteUpdateItem } from '@/services/api';
import { PROJECTS } from '@/config/projects';
import SiteBlocksPreview from '@/components/SiteBlocksPreview/SiteBlocksPreview';

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ps-border)',
  fontSize: 13.5, width: '100%', outline: 'none', background: 'var(--ps-surface)', color: 'var(--ps-text)',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--ps-muted)', display: 'block', marginBottom: 4 };
const iconBtnStyle: React.CSSProperties = {
  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, border: '1px solid var(--ps-border)', background: 'var(--ps-bg)', cursor: 'pointer', flexShrink: 0,
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

const HomePageEditor: React.FC = () => {
  // -- home page blocks --
  const [blocks, setBlocks] = useState<SiteLandingBlock[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // -- updates --
  const [updates, setUpdates] = useState<SiteUpdateItem[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingText, setEditingText] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchSiteHomePage()
      .then((r) => {
        setBlocks(r.data.blocks);
        setMaintenanceMode(r.data.maintenance_mode);
        setMaintenanceMessage(r.data.maintenance_message);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    setUpdatesLoading(true);
    fetchSiteUpdates()
      .then((r) => setUpdates(r.data))
      .catch(console.error)
      .finally(() => setUpdatesLoading(false));
  }, []);

  const addParagraph = () => setBlocks((prev) => [...prev, { type: 'paragraph', text: '' }]);
  const addButton = () => setBlocks((prev) => [...prev, { type: 'button', label: '', target_type: 'external' }]);
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
  const updateBlock = (index: number, patch: Partial<SiteLandingBlock>) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } as SiteLandingBlock : b)));
  };

  const handleSaveBlocks = async () => {
    setSaving(true);
    try {
      const res = await updateSiteHomePage({
        blocks, maintenance_mode: maintenanceMode, maintenance_message: maintenanceMessage,
      });
      setBlocks(res.data.blocks);
      setMaintenanceMode(res.data.maintenance_mode);
      setMaintenanceMessage(res.data.maintenance_message);
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    const text = newText.trim();
    if (!title || !text) return;
    setCreating(true);
    try {
      const res = await createSiteUpdate(title, text);
      setUpdates((prev) => [res.data, ...prev]);
      setNewTitle('');
      setNewText('');
      toast.success('Update added');
    } catch {
      toast.error('Failed to add update');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (u: SiteUpdateItem) => {
    setEditingId(u.id);
    setEditingTitle(u.title);
    setEditingText(u.text);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
    setEditingText('');
  };
  const saveEdit = async (u: SiteUpdateItem) => {
    const title = editingTitle.trim();
    const text = editingText.trim();
    if (!title || !text) return;
    setBusyId(u.id);
    try {
      const res = await updateSiteUpdate(u.id, { title, text });
      setUpdates((prev) => prev.map((item) => (item.id === u.id ? res.data : item)));
      cancelEdit();
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setBusyId(null);
    }
  };
  const handleDeleteUpdate = async (u: SiteUpdateItem) => {
    if (!window.confirm(`Delete "${u.title}"? This cannot be undone.`)) return;
    setBusyId(u.id);
    try {
      await deleteSiteUpdate(u.id);
      setUpdates((prev) => prev.filter((item) => item.id !== u.id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: 'var(--ps-text)' }}>
            Home Page
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ps-muted)', marginBottom: 20 }}>
            Build the text shown on Yakshavahini&rsquo;s root page, above the project cards, out of
            paragraphs and buttons. Only the latest 5 updates below show publicly.
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

      <div style={{
        borderRadius: 12, border: `1px solid ${maintenanceMode ? '#FECACA' : 'var(--ps-border)'}`,
        background: maintenanceMode ? '#FEF2F2' : 'var(--ps-surface)', padding: '14px 16px', marginBottom: 20,
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--ps-text)', cursor: 'pointer' }}>
          <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
          Maintenance mode
        </label>
        <p style={{ fontSize: 12, color: 'var(--ps-muted)', margin: '4px 0 0' }}>
          When on, the public home page shows only the logo and this message below — the paragraphs/buttons
          above and the project cards/Updates are all hidden until this is turned off.
        </p>
        {maintenanceMode && (
          <textarea
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            placeholder="e.g. We're doing scheduled maintenance — back shortly."
            style={{ ...inputStyle, minHeight: 60, marginTop: 10 }}
          />
        )}
      </div>

      {showPreview && (
        <div style={{
          borderRadius: 14, border: '1px solid var(--ps-border)', background: 'var(--ps-bg)',
          padding: '20px 22px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ps-faint)', textTransform: 'uppercase', marginBottom: 12 }}>
            Preview — how this looks on the public home page
          </div>
          {maintenanceMode ? (
            <p style={{ fontSize: 14, color: 'var(--ps-muted)' }}>
              {maintenanceMessage || <span style={{ color: 'var(--ps-faint)' }}>(no message set)</span>}
            </p>
          ) : (
            <SiteBlocksPreview blocks={blocks} />
          )}
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
                      <input style={inputStyle} value={block.label} onChange={(e) => updateBlock(i, { label: e.target.value })} placeholder="e.g. Read more" />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Redirects to</label>
                        <select
                          value={block.target_type}
                          onChange={(e) => updateBlock(i, { target_type: e.target.value as SiteButtonTarget })}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          <option value="external">A link (external URL)</option>
                          <option value="project">A specific project</option>
                        </select>
                      </div>
                      {block.target_type === 'external' && (
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>URL</label>
                          <input style={inputStyle} value={block.url || ''} onChange={(e) => updateBlock(i, { url: e.target.value })} placeholder="https://..." />
                        </div>
                      )}
                      {block.target_type === 'project' && (
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>Project</label>
                          <select
                            value={block.project_slug || ''}
                            onChange={(e) => updateBlock(i, { project_slug: e.target.value })}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                          >
                            <option value="" disabled>Choose a project&hellip;</option>
                            {PROJECTS.map((p) => (
                              <option key={p.slug} value={p.slug}>{p.name}</option>
                            ))}
                          </select>
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

      <button onClick={handleSaveBlocks} disabled={saving}
        style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--ps-grad)', color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, marginBottom: 36 }}>
        {saving ? 'Saving...' : 'Save'}
      </button>

      <h2 className="ps-serif" style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, color: 'var(--ps-text)' }}>
        Updates
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ps-muted)', marginBottom: 16 }}>
        Short announcements shown below the project cards. Only the 5 most recent show publicly.
      </p>

      <form onSubmit={handleCreateUpdate} style={{
        display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16,
        padding: 12, borderRadius: 10, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)',
      }}>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title" style={inputStyle} />
        <textarea value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Update text..." style={{ ...inputStyle, minHeight: 60 }} />
        <button type="submit" disabled={creating || !newTitle.trim() || !newText.trim()}
          style={{
            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: 'none', background: 'var(--ps-grad)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
          {creating ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
          Add update
        </button>
      </form>

      {updatesLoading ? (
        <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />
      ) : updates.length === 0 ? (
        <p style={{ color: 'var(--ps-faint)', fontSize: 13 }}>No updates yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {updates.map((u) => (
            <div key={u.id} style={{ borderRadius: 10, padding: 12, background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
              {editingId === u.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} autoFocus style={inputStyle} />
                  <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} style={{ ...inputStyle, minHeight: 60 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveEdit(u)} disabled={busyId === u.id} style={iconBtnStyle}>
                      <Check style={{ width: 14, height: 14 }} />
                    </button>
                    <button onClick={cancelEdit} disabled={busyId === u.id} style={iconBtnStyle}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="kn-sans" style={{ fontWeight: 600, color: 'var(--ps-text)' }}>{u.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--ps-faint)' }}>{formatDate(u.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ps-muted)', margin: '4px 0 0', whiteSpace: 'pre-line' }}>{u.text}</p>
                  </div>
                  <button onClick={() => startEdit(u)} disabled={busyId === u.id} style={iconBtnStyle}>
                    <Pencil style={{ width: 13, height: 13 }} />
                  </button>
                  <button onClick={() => handleDeleteUpdate(u)} disabled={busyId === u.id}
                    style={{ ...iconBtnStyle, borderColor: '#FECACA', color: '#DC2626' }}>
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePageEditor;
