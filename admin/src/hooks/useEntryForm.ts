import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  createEntry, updateEntry, fetchEntry, initUpload, verifyUpload,
} from '@/services/api';
import { uploadDirectlyToDrive } from '@/lib/directDriveUpload';
import { useProject } from '@/contexts/ProjectContext';

export function useEntryForm(id?: number) {
  const navigate = useNavigate();
  const { project } = useProject();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [situations, setSituations] = useState('');
  const [ragas, setRagas] = useState('');
  const [pdfLink, setPdfLink] = useState('');
  const [dateKannada, setDateKannada] = useState('');
  const [dateEnglish, setDateEnglish] = useState('');
  const [notes, setNotes] = useState('');
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
  const [youtubeInput, setYoutubeInput] = useState('');
  const [driveFileName, setDriveFileName] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [status, setStatus] = useState('');
  const [hasPendingDeletion, setHasPendingDeletion] = useState(false);
  const [sendForReview, setSendForReview] = useState(false);
  const draftEntryIdRef = useRef<number | null>(id ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit) return;
    fetchEntry(project, id!).then((res) => {
      const e = res.data;
      setName(e.name as string);
      setType(e.type as string);
      setSituations(e.situations as string);
      setRagas(e.ragas as string);
      setPdfLink(e.pdf_link as string);
      setDateKannada(e.date_kannada as string);
      setDateEnglish(e.date_english as string);
      setNotes(e.notes);
      setYoutubeLinks((e.youtube_video_links as string[]) || []);
      setStatus(e.status);
      setHasPendingDeletion(e.has_pending_deletion);
    }).catch(console.error).finally(() => setLoading(false));
  }, [project, id, isEdit]);

  const addYoutubeLink = () => {
    const url = youtubeInput.trim();
    if (url && !youtubeLinks.includes(url)) setYoutubeLinks([...youtubeLinks, url]);
    setYoutubeInput('');
  };

  const removeYoutubeLink = (url: string) => setYoutubeLinks(youtubeLinks.filter((u) => u !== url));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setUploading(true);
    setUploadProgress(0);
    try {
      let entryId = draftEntryIdRef.current;
      if (!entryId) {
        const created = await createEntry(project, { name: name || 'draft', action: 'draft' });
        entryId = created.data.id;
        draftEntryIdRef.current = entryId;
      }
      const init = await initUpload(project, entryId, driveFileName.trim() || undefined);
      await uploadDirectlyToDrive(init.data.upload_url, init.data.access_token, file, setUploadProgress);
      const done = await verifyUpload(project, entryId, init.data.file_name, init.data.drive_account_id, 'pdf_link');
      setPdfLink(done.data.url);
      toast.success('PDF uploaded');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Upload failed');
    } finally {
      setUploading(false);
      setSelectedFileName('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (action: 'draft' | 'submit') => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        type: type || null,
        situations: situations || null,
        ragas: ragas || null,
        pdf_link: pdfLink || null,
        date_kannada: dateKannada || null,
        date_english: dateEnglish || null,
        notes: notes || null,
        youtube_video_links: youtubeLinks,
        action,
        ...(action === 'submit' && sendForReview ? { send_for_review: true } : {}),
      };
      if (draftEntryIdRef.current) {
        await updateEntry(project, draftEntryIdRef.current, payload);
      } else {
        await createEntry(project, payload);
      }
      toast.success('Saved');
      navigate('/');
    } catch {
      toast.error('Error saving entry');
    } finally {
      setSaving(false);
    }
  };

  return {
    isEdit, loading,
    status, hasPendingDeletion,
    sendForReview, setSendForReview,
    name, setName,
    type, setType,
    situations, setSituations,
    ragas, setRagas,
    pdfLink, setPdfLink,
    dateKannada, setDateKannada,
    dateEnglish, setDateEnglish,
    notes, setNotes,
    youtubeLinks, youtubeInput, setYoutubeInput, addYoutubeLink, removeYoutubeLink,
    driveFileName, setDriveFileName,
    selectedFileName,
    uploading, uploadProgress, saving,
    fileRef, handleFileChange, handleSave,
  };
}
