import React from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDrishyaShravyaEntryForm } from '@/hooks/useDrishyaShravyaEntryForm';
import DeleteEntryButton from '@/components/DeleteEntryButton/DeleteEntryButton';
import { useAuth } from '@/hooks/useAuth';

const DrishyaShravyaEntryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const s = useDrishyaShravyaEntryForm(id ? parseInt(id) : undefined);
  const { role } = useAuth();

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ps-border)',
    fontSize: 13.5, width: '100%', outline: 'none', background: 'var(--ps-surface)', color: 'var(--ps-text)',
  };
  const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: 'var(--ps-muted)', display: 'block', marginBottom: 6 };

  if (s.loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: 'var(--ps-text)' }}>
        {s.isEdit ? 'Edit Entry' : 'New Entry'}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>ಕಾರ್ಯಕ್ರಮ (Event type)</label>
          <input style={inputStyle} value={s.eventType} onChange={(e) => s.setEventType(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>ವಿಷಯ (Subject) *</label>
          <input style={inputStyle} value={s.subject} onChange={(e) => s.setSubject(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>ವಿವರಗಳು (Details)</label>
          <textarea style={{ ...inputStyle, minHeight: 60 }} value={s.details} onChange={(e) => s.setDetails(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ದಿನಾಂಕ (Kannada)</label>
            <input style={inputStyle} value={s.dateKannada} onChange={(e) => s.setDateKannada(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Date (English)</label>
            <input style={inputStyle} type="date" value={s.dateEnglish} onChange={(e) => s.setDateEnglish(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>YouTube/Facebook Link</label>
          <input style={inputStyle} value={s.videoLink} onChange={(e) => s.setVideoLink(e.target.value)}
            placeholder="https://youtube.com/... or https://facebook.com/..." />
        </div>

        <div>
          <label style={labelStyle}>ಹೆಚ್ಚಿನ ವಿವರಗಳು (Additional Info)</label>
          <textarea style={{ ...inputStyle, minHeight: 60 }} value={s.notes} onChange={(e) => s.setNotes(e.target.value)} />
        </div>

        {role === 'admin' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ps-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={s.sendForReview} onChange={(e) => s.setSendForReview(e.target.checked)} />
            Send for review (another editor/admin must approve, instead of auto-approving)
          </label>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={() => s.handleSave('draft')} disabled={s.saving}
            style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}>
            Save Draft
          </button>
          <button onClick={() => s.handleSave('submit')} disabled={s.saving}
            style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--ps-grad)', color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}>
            {s.isEdit ? 'Save' : 'Submit'}
          </button>
          {s.isEdit && id && (
            <DeleteEntryButton entryId={parseInt(id)} status={s.status} hasPendingDeletion={s.hasPendingDeletion} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DrishyaShravyaEntryForm;
