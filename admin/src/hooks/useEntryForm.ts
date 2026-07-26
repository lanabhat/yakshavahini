import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  createEntry, updateEntry, fetchEntry, initUpload, verifyUpload,
} from '@/services/api';
import { uploadDirectlyToDrive } from '@/lib/directDriveUpload';

export function useEntryForm(id?: number) {
  const navigate = useNavigate();
  const isEdit = !!id;

  const [nameOfTheMattu, setNameOfTheMattu] = useState('');
  const [linkToPdfDocument, setLinkToPdfDocument] = useState('');
  const [dateKannada, setDateKannada] = useState('');
  const [dateEnglish, setDateEnglish] = useState('');
  const [notes, setNotes] = useState('');
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
  const [youtubeInput, setYoutubeInput] = useState('');
  const [driveFileName, setDriveFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const draftEntryIdRef = useRef<number | null>(id ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit) return;
    fetchEntry(id!).then((res) => {
      const e = res.data;
      setNameOfTheMattu(e.name_of_the_mattu);
      setLinkToPdfDocument(e.link_to_pdf_document);
      setDateKannada(e.date_kannada);
      setDateEnglish(e.date_english);
      setNotes(e.notes);
      setYoutubeLinks(e.youtube_video_links || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id, isEdit]);

  const addYoutubeLink = () => {
    const url = youtubeInput.trim();
    if (url && !youtubeLinks.includes(url)) setYoutubeLinks([...youtubeLinks, url]);
    setYoutubeInput('');
  };

  const removeYoutubeLink = (url: string) => setYoutubeLinks(youtubeLinks.filter((u) => u !== url));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      let entryId = draftEntryIdRef.current;
      if (!entryId) {
        const created = await createEntry({ name_of_the_mattu: nameOfTheMattu || 'draft', action: 'draft' });
        entryId = created.data.id;
        draftEntryIdRef.current = entryId;
      }
      const init = await initUpload(entryId, driveFileName.trim() || undefined);
      await uploadDirectlyToDrive(init.data.upload_url, init.data.access_token, file, setUploadProgress);
      const done = await verifyUpload(entryId, init.data.file_name, init.data.drive_account_id, 'link_to_pdf_document');
      setLinkToPdfDocument(done.data.url);
      toast.success('PDF uploaded');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (action: 'draft' | 'submit') => {
    if (!nameOfTheMattu.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name_of_the_mattu: nameOfTheMattu,
        link_to_pdf_document: linkToPdfDocument || null,
        date_kannada: dateKannada || null,
        date_english: dateEnglish || null,
        notes: notes || null,
        youtube_video_links: youtubeLinks,
        action,
      };
      if (draftEntryIdRef.current) {
        await updateEntry(draftEntryIdRef.current, payload);
      } else {
        await createEntry(payload);
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
    nameOfTheMattu, setNameOfTheMattu,
    linkToPdfDocument, setLinkToPdfDocument,
    dateKannada, setDateKannada,
    dateEnglish, setDateEnglish,
    notes, setNotes,
    youtubeLinks, youtubeInput, setYoutubeInput, addYoutubeLink, removeYoutubeLink,
    driveFileName, setDriveFileName,
    uploading, uploadProgress, saving,
    fileRef, handleFileChange, handleSave,
  };
}
