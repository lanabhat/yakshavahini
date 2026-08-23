import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { fetchEntry } from '@/services/api';
import type { Entry } from '@/services/api';
import { extractYoutubeId } from '@/lib/youtube';
import { useProject } from '@/contexts/ProjectContext';
import { displayFieldValue } from '@/lib/fieldDisplay';

// Handles Drive-hosted PDFs (/file/d/<id>), native Google Docs/Sheets/Slides
// (/document|spreadsheets|presentation/d/<id>), the older ?id= share format,
// and any plain .pdf URL.
function getDocEmbedUrl(url: string): string | null {
  if (!url) return null;
  const driveFile = url.match(/\/file\/d\/([^/?#]+)/);
  if (driveFile) return `https://drive.google.com/file/d/${driveFile[1]}/preview`;
  const googleDoc = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/?#]+)/);
  if (googleDoc) return `https://docs.google.com/${googleDoc[1]}/d/${googleDoc[2]}/preview`;
  const driveOpen = url.match(/[?&]id=([^&#]+)/);
  if (driveOpen) return `https://drive.google.com/file/d/${driveOpen[1]}/preview`;
  if (url.endsWith('.pdf') || url.includes('.pdf?')) return url;
  return null;
}

const EntryDetail: React.FC = () => {
  const project = useProject();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntry(project, parseInt(id!)).then((r) => setEntry(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [project, id]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Loader2 className="animate-spin" style={{ color: 'var(--ps-accent)' }} /></div>;
  }
  if (!entry) {
    return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ps-muted)' }}>Not found</div>;
  }

  const pdfLinkRaw = (entry[project.linkField || 'pdf_link'] as string) || '';
  // Some entries have placeholder text (e.g. "yet to be compiled") instead of
  // a real URL in this field — only treat it as a link if it actually looks
  // like one, matching the same guard EntryCard/EntryListRow already use.
  const pdfLink = pdfLinkRaw.startsWith('http') ? pdfLinkRaw : '';
  const pdfEmbed = getDocEmbedUrl(pdfLink);
  const videoLinks = (entry.youtube_video_links as string[]) || [];
  const videoIds = videoLinks.map(extractYoutubeId).filter(Boolean) as string[];
  const title = (entry[project.titleField] as string) || '';
  const dateKannada = project.dateKannadaField ? (entry[project.dateKannadaField] as string) : '';
  const dateEnglish = project.dateEnglishField ? (entry[project.dateEnglishField] as string) : '';
  const fields = project.displayFields
    .map((f) => ({ field: f, value: displayFieldValue(entry, f) }))
    .filter((f) => f.value);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '22px 22px 60px' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--ps-muted)', cursor: 'pointer', marginBottom: 18, fontSize: 13.5 }}>
        <ArrowLeft style={{ width: 15, height: 15 }} /> Back
      </button>

      <h1 className="kn-serif" style={{ fontWeight: 700, fontSize: 26, color: 'var(--ps-text)', margin: '0 0 14px' }}>
        {title}
      </h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        {dateKannada && <span className="kn-sans" style={{ fontSize: 13.5, color: 'var(--ps-muted)' }}>{dateKannada}</span>}
        {dateEnglish && <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: 'var(--ps-faint)' }}>{dateEnglish}</span>}
      </div>

      {fields.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
          {fields.map(({ field, value }) => (
            <div key={field.name} style={{ fontSize: 13.5 }}>
              <span style={{ color: 'var(--ps-muted)', marginRight: 6 }}>{field.label}:</span>
              <span className="kn-sans" style={{ color: 'var(--ps-text)' }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {entry.notes && (
        <div style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRadius: 14, padding: 16, marginBottom: 22 }}>
          <p style={{ fontSize: 14, color: 'var(--ps-text)', margin: 0, lineHeight: 1.6 }}>{entry.notes}</p>
        </div>
      )}

      {pdfLink && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ps-text)' }}>Document</span>
            <a href={pdfLink} target="_blank" rel="noopener"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--ps-accent-text)' }}>
              <ExternalLink style={{ width: 13, height: 13 }} /> Open
            </a>
          </div>
          {pdfEmbed && (
            <iframe src={pdfEmbed} title={title} style={{ width: '100%', height: '70vh', border: '1px solid var(--ps-border)', borderRadius: 12 }} />
          )}
        </div>
      )}

      {videoIds.length > 0 && (
        <div>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ps-text)', display: 'block', marginBottom: 8 }}>Videos</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {videoIds.map((vid) => (
              <div key={vid} style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--ps-border)' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${vid}`}
                  title={`YouTube video ${vid}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryDetail;
