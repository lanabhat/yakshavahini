import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { usePrasangaYadiEntryForm } from '@/hooks/usePrasangaYadiEntryForm';
import MultiAutocompleteInput from '@/components/MultiAutocompleteInput/MultiAutocompleteInput';
import TaxonomyPicker from '@/components/TaxonomyPicker/TaxonomyPicker';
import DeleteEntryButton from '@/components/DeleteEntryButton/DeleteEntryButton';
import { useAuth } from '@/hooks/useAuth';

type PickerField = 'kavi' | null;

const PrasangaYadiEntryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const s = usePrasangaYadiEntryForm(id ? parseInt(id) : undefined);
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
          <label style={labelStyle}>ಪ್ರಸಂಗದ ಹೆಸರು (Prasanga name) *</label>
          <input style={inputStyle} value={s.prasangaName} onChange={(e) => s.setPrasangaName(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>ಅನನ್ಯ ಸಂಖ್ಯೆ (Unique number)</label>
          <input style={inputStyle} value={s.uniqueNumber} onChange={(e) => s.setUniqueNumber(e.target.value)} />
        </div>

        <div>
          <MultiAutocompleteInput
            field="kavi" label="ಪ್ರಸಂಗ ಕವಿ (Kavi)"
            values={s.kaviNames} onChange={s.setKaviNames}
            placeholder="Type and press Enter..."
          />
          <button type="button" onClick={() => setOpenPicker('kavi')} style={browseBtnStyle}>
            <Search style={{ width: 12, height: 12 }} /> Browse existing
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ವಿಧ (Type)</label>
            <input style={inputStyle} value={s.type} onChange={(e) => s.setType(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ಪ್ರಕಟಿತವೇ? (Publish status)</label>
            <input style={inputStyle} value={s.publishStatus} onChange={(e) => s.setPublishStatus(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ಪ್ರಸಂಗ ವಿಧ (Prasanga type)</label>
            <input style={inputStyle} value={s.prasangaType} onChange={(e) => s.setPrasangaType(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ಪ್ರಸಂಗ ಭಾಷೆ (Prasanga language)</label>
            <input style={inputStyle} value={s.prasangaLanguage} onChange={(e) => s.setPrasangaLanguage(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>ಆಧಾರ ಗ್ರಂಥ (Story source)</label>
          <input style={inputStyle} value={s.storySource} onChange={(e) => s.setStorySource(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>ಯಕ್ಷಪ್ರಸಂಗಕೋಶದಲ್ಲಿ ಪ್ರತಿಗೆ ಕೊಂಡಿ (Prasanga Kosha link)</label>
          <input style={inputStyle} value={s.prasangaKoshaLink} onChange={(e) => s.setPrasangaKoshaLink(e.target.value)}
            placeholder="https://drive.google.com/..." />
        </div>

        <div>
          <label style={labelStyle}>ಪ್ರಸಂಗಪ್ರತಿಸಂಗ್ರಹದಲ್ಲಿ ಪ್ರತಿಗೆ ಕೊಂಡಿ (Pratisangraha link)</label>
          <input style={inputStyle} value={s.pratisangrahaLink} onChange={(e) => s.setPratisangrahaLink(e.target.value)}
            placeholder="https://drive.google.com/..." />
        </div>

        <div>
          <label style={labelStyle}>ಟಿಪ್ಪಣಿ (Notes)</label>
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

      {openPicker === 'kavi' && (
        <TaxonomyPicker
          field="kavi" label="ಪ್ರಸಂಗ ಕವಿ (Kavi)" mode="multi"
          selectedNames={s.kaviNames} onToggle={toggleMulti(s.kaviNames, s.setKaviNames)}
          onClose={() => setOpenPicker(null)}
        />
      )}
    </div>
  );
};

export default PrasangaYadiEntryForm;
