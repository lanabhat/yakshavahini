import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { importDrishyaShravyaCsv } from '@/services/api';
import type { CsvImportSummary } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

// Only wired up for Drishya-Kavya Sanchaya so far (see backend/
// drishyashravyakosha/csv_import.py) — the CSV column mapping is
// project-specific, not schema-driven like the rest of the admin app.
// EntryFormRouter.tsx-style: extend this page (or add a sibling) if
// another project needs the same "import from CSV" capability later.
const ImportCsv: React.FC = () => {
  const { project } = useProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<CsvImportSummary | null>(null);

  const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: 'var(--ps-muted)', display: 'block', marginBottom: 6 };

  const handleImport = async () => {
    if (!file) {
      toast.error('Choose a CSV file first');
      return;
    }
    if (clearExisting && !window.confirm(
      `This will DELETE every existing ${project.name} entry before importing. This cannot be undone. Continue?`,
    )) {
      return;
    }
    setImporting(true);
    setSummary(null);
    try {
      const res = await importDrishyaShravyaCsv(project, file, clearExisting);
      setSummary(res.data);
      toast.success('Import finished');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 className="ps-serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--ps-text)' }}>
        Import CSV
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ps-muted)', marginBottom: 20 }}>
        Bulk-import {project.name} entries from a CSV export. Expected columns:
        event_type, subject, date, presenter, video_link.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>CSV file</label>
          <input
            ref={fileRef} type="file" accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--ps-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={clearExisting} onChange={(e) => setClearExisting(e.target.checked)} style={{ marginTop: 2 }} />
          <span>
            Delete all existing {project.name} entries first, then import every row.
            <br />
            <span style={{ color: 'var(--ps-faint)' }}>
              If left unchecked, only rows whose subject isn&apos;t already in the database are imported — existing entries are left untouched.
            </span>
          </span>
        </label>

        <button onClick={handleImport} disabled={importing || !file}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--ps-grad)', color: '#fff',
            cursor: importing || !file ? 'default' : 'pointer', opacity: importing || !file ? 0.6 : 1,
            fontSize: 13.5, fontWeight: 600, width: 'fit-content',
          }}>
          {importing ? <Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> : <Upload style={{ width: 15, height: 15 }} />}
          {importing ? 'Importing…' : 'Import'}
        </button>

        {summary && (
          <div style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 12, padding: 16, fontSize: 13.5, color: 'var(--ps-text)' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Result</div>
            <div>{summary.total_rows} row(s) in the file.</div>
            {summary.deleted > 0 && <div>Deleted {summary.deleted} existing entr{summary.deleted === 1 ? 'y' : 'ies'}.</div>}
            <div>Created {summary.created} entr{summary.created === 1 ? 'y' : 'ies'}.</div>
            {summary.skipped_existing > 0 && <div>Skipped {summary.skipped_existing} already-present (by subject).</div>}
            {summary.skipped_blank > 0 && <div>Skipped {summary.skipped_blank} blank-subject row(s).</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportCsv;
