import React from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSanghatanaEntryForm } from '@/hooks/useSanghatanaEntryForm';
import DeleteEntryButton from '@/components/DeleteEntryButton/DeleteEntryButton';

const SanghatanaEntryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const s = useSanghatanaEntryForm(id ? parseInt(id) : undefined);

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
          <label style={labelStyle}>ಸಂಘಟನೆಯ ಹೆಸರು (Name) *</label>
          <input style={inputStyle} value={s.nameOfTheOrg} onChange={(e) => s.setNameOfTheOrg(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>ಸಂಘಟನೆಯ ವಿವರ (Details)</label>
          <textarea style={{ ...inputStyle, minHeight: 60 }} value={s.details} onChange={(e) => s.setDetails(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>ಸಂಘಟನೆಯ ವಿಧ (Type of org)</label>
          <input style={inputStyle} value={s.typeOfOrg} onChange={(e) => s.setTypeOfOrg(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ಯಕ್ಷಗಾನ ಪ್ರಬೇಧ (Category)</label>
            <input style={inputStyle} value={s.yakshaganaCategory} onChange={(e) => s.setYakshaganaCategory(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ಯಕ್ಷಗಾನ ಉಪ ಪ್ರಬೇಧ (Sub-category)</label>
            <input style={inputStyle} value={s.yakshaganaSubCategory} onChange={(e) => s.setYakshaganaSubCategory(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ಸ್ಥಾಪನೆ ವರ್ಷ (Establishment year)</label>
            <input style={inputStyle} value={s.estabishmentDate} onChange={(e) => s.setEstabishmentDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>ಚೌಕಟ್ಟು / ಅಸ್ತಿತ್ವ (Framework)</label>
            <input style={inputStyle} value={s.stateOfTheEst} onChange={(e) => s.setStateOfTheEst(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>ಪ್ರಧಾನ ಕಛೇರಿಯ ಸ್ಥಳ (Head quarter)</label>
          <input style={inputStyle} value={s.headQuarter} onChange={(e) => s.setHeadQuarter(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>ಯಕ್ಷ ಸಂಘಟನೆಯ ವಿವರಗಳಿಗಾಗಿ ಕೊಂಡಿ (Document link)</label>
          <input style={inputStyle} value={s.detailsPdf} onChange={(e) => s.setDetailsPdf(e.target.value)}
            placeholder="https://drive.google.com/... (leave blank if none yet)" />
        </div>

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

export default SanghatanaEntryForm;
