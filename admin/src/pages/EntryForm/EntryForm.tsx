import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, Upload, Loader2, Search } from 'lucide-react';
import { useEntryForm } from '@/hooks/useEntryForm';
import MultiAutocompleteInput from '@/components/MultiAutocompleteInput/MultiAutocompleteInput';
import TaxonomyPicker from '@/components/TaxonomyPicker/TaxonomyPicker';
import DeleteEntryButton from '@/components/DeleteEntryButton/DeleteEntryButton';
import { useAuth } from '@/hooks/useAuth';

type PickerField = 'situations' | 'ragas' | null;

const EntryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const s = useEntryForm(id ? parseInt(id) : undefined);
  const { role } = useAuth();
  const [openPicker, setOpenPicker] = useState<PickerField>(null);

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 8, border: '1px solid var(--ps-border)',
    fontSize: 13.5, width: '100%', outline: 'none', background: 'var(--ps-surface)', color: 'var(--ps-text)',
  };
  const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: 'var(--ps-muted)', display: 'block', marginBottom: 6 };
  const browseBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 12, color: 'var(--ps-accent-text)', fontWeight: 600, padding: 0,
  };

  const toggleMulti = (values: string[], onChange: (v: string[]) => void) => (name: string) => {
    onChange(values.includes(name) ? values.filter((v) => v !== name) : [...values, name]);
  };

  if (s.loading) return <Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} />;

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: 'var(--ps-text)' }}>
        {s.isEdit ? 'Edit Entry' : 'New Entry'}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>ಮಟ್ಟಿನ ಹೆಸರು (Name) *</label>
          <input style={inputStyle} value={s.name} onChange={(e) => s.setName(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>ಛಂದಸ್ಸಿನ ವಿಧ (Type)</label>
          <input style={inputStyle} value={s.type} onChange={(e) => s.setType(e.target.value)} />
        </div>

        <div>
          <MultiAutocompleteInput
            field="situations" label="ಸಂದರ್ಭ ಸೂಕ್ತತೆ (Situations)"
            values={s.situationNames} onChange={s.setSituationNames}
            placeholder="Type and press Enter..."
          />
          <button type="button" onClick={() => setOpenPicker('situations')} style={browseBtnStyle}>
            <Search style={{ width: 12, height: 12 }} /> Browse existing
          </button>
        </div>

        <div>
          <MultiAutocompleteInput
            field="ragas" label="ಹೊಂದುವ ರಾಗಗಳು (Ragas)"
            values={s.ragaNames} onChange={s.setRagaNames}
            placeholder="Type and press Enter..."
          />
          <button type="button" onClick={() => setOpenPicker('ragas')} style={browseBtnStyle}>
            <Search style={{ width: 12, height: 12 }} /> Browse existing
          </button>
        </div>

        <div>
          <label style={labelStyle}>ಮಟ್ಟಿನ ವಿವರದ ದಸ್ತಾವೇಜಿನ ಕೊಂಡಿ (Document)</label>
          {s.pdfLink ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a href={s.pdfLink} target="_blank" rel="noopener" style={{ fontSize: 13, color: 'var(--ps-accent-text)', wordBreak: 'break-all' }}>
                {s.pdfLink}
              </a>
              <button onClick={() => s.setPdfLink('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ps-faint)' }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ) : (
            <>
              <label style={{ ...labelStyle, fontWeight: 400, fontSize: 12 }}>Paste a link to a document already on Drive (PDF or Google Doc)</label>
              <input
                placeholder="https://drive.google.com/file/d/... or https://docs.google.com/document/d/..."
                style={{ ...inputStyle, marginBottom: 14 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    s.setPdfLink((e.target as HTMLInputElement).value.trim());
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) s.setPdfLink(e.target.value.trim());
                }}
              />

              <label style={{ ...labelStyle, fontWeight: 400, fontSize: 12 }}>Or upload a new PDF</label>
              <input value={s.driveFileName} onChange={(e) => s.setDriveFileName(e.target.value)}
                placeholder="Drive file name (optional)" style={{ ...inputStyle, marginBottom: 8 }} />
              <input ref={s.fileRef} type="file" accept="application/pdf" onChange={s.handleFileChange} disabled={s.uploading} style={{ display: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" onClick={() => s.fileRef.current?.click()} disabled={s.uploading}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', cursor: s.uploading ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ps-text)' }}>
                  Choose PDF
                </button>
                {s.selectedFileName && (
                  <span style={{ fontSize: 12.5, color: 'var(--ps-muted)' }}>{s.selectedFileName}</span>
                )}
              </div>
              {s.uploading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12.5, color: 'var(--ps-muted)' }}>
                  <Upload style={{ width: 13, height: 13 }} /> Uploading... {s.uploadProgress}%
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ದಸ್ತಾವೇಜನ್ನು ಸೇರಿಸಿದ ದಿನಾಂಕ (Kannada)</label>
            <input style={inputStyle} value={s.dateKannada} onChange={(e) => s.setDateKannada(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Date Added (English)</label>
            <input style={inputStyle} type="date" value={s.dateEnglish} onChange={(e) => s.setDateEnglish(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>ಟಿಪ್ಪಣಿ (Notes)</label>
          <textarea style={{ ...inputStyle, minHeight: 70 }} value={s.notes} onChange={(e) => s.setNotes(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>YouTube Video Links</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input style={inputStyle} value={s.youtubeInput} onChange={(e) => s.setYoutubeInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); s.addYoutubeLink(); } }} />
            <button onClick={s.addYoutubeLink} style={{ padding: '0 14px', borderRadius: 8, border: '1px solid var(--ps-border)', background: 'var(--ps-surface)', cursor: 'pointer', fontSize: 13 }}>
              Add
            </button>
          </div>
          {s.youtubeLinks.map((url) => (
            <div key={url} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ps-muted)', marginBottom: 4 }}>
              <span style={{ wordBreak: 'break-all', flex: 1 }}>{url}</span>
              <button onClick={() => s.removeYoutubeLink(url)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ps-faint)' }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ))}
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

      {openPicker === 'situations' && (
        <TaxonomyPicker
          field="situations" label="ಸಂದರ್ಭ ಸೂಕ್ತತೆ (Situations)" mode="multi"
          selectedNames={s.situationNames} onToggle={toggleMulti(s.situationNames, s.setSituationNames)}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'ragas' && (
        <TaxonomyPicker
          field="ragas" label="ಹೊಂದುವ ರಾಗಗಳು (Ragas)" mode="multi"
          selectedNames={s.ragaNames} onToggle={toggleMulti(s.ragaNames, s.setRagaNames)}
          onClose={() => setOpenPicker(null)}
        />
      )}
    </div>
  );
};

export default EntryForm;
