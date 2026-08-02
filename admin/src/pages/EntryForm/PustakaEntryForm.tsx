import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, Upload, Loader2, Search } from 'lucide-react';
import { usePustakaEntryForm } from '@/hooks/usePustakaEntryForm';
import AutocompleteInput from '@/components/AutocompleteInput/AutocompleteInput';
import MultiAutocompleteInput from '@/components/MultiAutocompleteInput/MultiAutocompleteInput';
import TaxonomyPicker from '@/components/TaxonomyPicker/TaxonomyPicker';
import DeleteEntryButton from '@/components/DeleteEntryButton/DeleteEntryButton';
import { useAuth } from '@/hooks/useAuth';

type PickerField = 'authors' | 'category' | 'publisher' | 'contributors' | null;

const PustakaEntryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const s = usePustakaEntryForm(id ? parseInt(id) : undefined);
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
          <label style={labelStyle}>ಪುಸ್ತಕದ ಹೆಸರು (Book name) *</label>
          <input style={inputStyle} value={s.bookName} onChange={(e) => s.setBookName(e.target.value)} />
        </div>

        <div>
          <MultiAutocompleteInput
            field="authors" label="ಲೇಖಕ/ಸಂಪಾದಕ (Author/Editor)"
            values={s.authorNames} onChange={s.setAuthorNames}
            placeholder="Type a name and press Enter..."
          />
          <button type="button" onClick={() => setOpenPicker('authors')} style={browseBtnStyle}>
            <Search style={{ width: 12, height: 12 }} /> Browse existing
          </button>
        </div>

        <div>
          <label style={labelStyle}>ವಿವರಗಳು (Details)</label>
          <textarea style={{ ...inputStyle, minHeight: 60 }} value={s.details} onChange={(e) => s.setDetails(e.target.value)} />
        </div>

        <div>
          <AutocompleteInput
            field="category" label="ಪುಸ್ತಕದ ವಿಭಾಗ (Category)"
            value={s.categoryName} onValueChange={s.setCategoryName}
          />
          <button type="button" onClick={() => setOpenPicker('category')} style={browseBtnStyle}>
            <Search style={{ width: 12, height: 12 }} /> Browse existing
          </button>
        </div>

        <div>
          <AutocompleteInput
            field="publisher" label="ಪ್ರಕಾಶಕ (Publisher)"
            value={s.publisherName} onValueChange={s.setPublisherName}
          />
          <button type="button" onClick={() => setOpenPicker('publisher')} style={browseBtnStyle}>
            <Search style={{ width: 12, height: 12 }} /> Browse existing
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ಆವೃತ್ತಿ (Version)</label>
            <input style={inputStyle} value={s.version} onChange={(e) => s.setVersion(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ಪ್ರಕಾಶನ ಕಾಲ (Year)</label>
            <input style={inputStyle} value={s.year} onChange={(e) => s.setYear(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>ಪುಸ್ತಕದ ಐ.ಎಸ್.ಬಿ.ಎನ್ (ISBN)</label>
          <input style={inputStyle} value={s.isbn} onChange={(e) => s.setIsbn(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>ಮುಖಚಿತ್ರ (Thumbnail image URL)</label>
          <input style={inputStyle} value={s.thumbnail} onChange={(e) => s.setThumbnail(e.target.value)}
            placeholder="https://drive.google.com/... or any direct image URL" />
          {s.thumbnail && (
            <img src={s.thumbnail} alt="" style={{ marginTop: 8, width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ps-border)' }} />
          )}
        </div>

        <div>
          <label style={labelStyle}>ಪುಸ್ತಕದ ಕೊಂಡಿ (Document)</label>
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

        <div>
          <MultiAutocompleteInput
            field="contributors" label="ಕೋಶಕ್ಕೆ ಸೇರಿಸಲು ಸಹಕರಿದವರು (Contributors)"
            values={s.contributorNames} onChange={s.setContributorNames}
            placeholder="Type a name and press Enter..."
          />
          <button type="button" onClick={() => setOpenPicker('contributors')} style={browseBtnStyle}>
            <Search style={{ width: 12, height: 12 }} /> Browse existing
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ಕೋಶಕ್ಕೆ ಸೇರಿಸಲ್ಪಟ್ಟ ದಿನಾಂಕ (Kannada)</label>
            <input style={inputStyle} value={s.dateAdded} onChange={(e) => s.setDateAdded(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Date added (English)</label>
            <input style={inputStyle} type="date" value={s.dateAddedEnglish} onChange={(e) => s.setDateAddedEnglish(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>ಸಾರಾಂಶ (Summary)</label>
          <textarea style={{ ...inputStyle, minHeight: 70 }} value={s.summary} onChange={(e) => s.setSummary(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>ಹೆಚ್ಚಿನ ವಿವರ (More details)</label>
          <textarea style={{ ...inputStyle, minHeight: 70 }} value={s.moreDetails} onChange={(e) => s.setMoreDetails(e.target.value)}
            placeholder="Extra context or search keywords to help this entry get found..." />
        </div>

        <div>
          <label style={labelStyle}>ಟಿಪ್ಪಣಿ (Notes)</label>
          <textarea style={{ ...inputStyle, minHeight: 70 }} value={s.notes} onChange={(e) => s.setNotes(e.target.value)} />
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

      {openPicker === 'authors' && (
        <TaxonomyPicker
          field="authors" label="ಲೇಖಕ/ಸಂಪಾದಕ (Author/Editor)" mode="multi"
          selectedNames={s.authorNames} onToggle={toggleMulti(s.authorNames, s.setAuthorNames)}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'category' && (
        <TaxonomyPicker
          field="category" label="ಪುಸ್ತಕದ ವಿಭಾಗ (Category)" mode="single"
          selectedNames={s.categoryName ? [s.categoryName] : []} onToggle={s.setCategoryName}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'publisher' && (
        <TaxonomyPicker
          field="publisher" label="ಪ್ರಕಾಶಕ (Publisher)" mode="single"
          selectedNames={s.publisherName ? [s.publisherName] : []} onToggle={s.setPublisherName}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === 'contributors' && (
        <TaxonomyPicker
          field="contributors" label="ಕೋಶಕ್ಕೆ ಸೇರಿಸಲು ಸಹಕರಿದವರು (Contributors)" mode="multi"
          selectedNames={s.contributorNames} onToggle={toggleMulti(s.contributorNames, s.setContributorNames)}
          onClose={() => setOpenPicker(null)}
        />
      )}
    </div>
  );
};

export default PustakaEntryForm;
