import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  createEntry, updateEntry, fetchEntry, initUpload, verifyUpload,
} from '@/services/api';
import { uploadDirectlyToDrive } from '@/lib/directDriveUpload';
import { useProject } from '@/contexts/ProjectContext';

interface TaxonomyRef {
  id: number;
  name: string;
}

export function usePustakaEntryForm(id?: number) {
  const navigate = useNavigate();
  const { project } = useProject();
  const isEdit = !!id;

  const [bookName, setBookName] = useState('');
  const [authorNames, setAuthorNames] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [version, setVersion] = useState('');
  const [year, setYear] = useState('');
  const [isbn, setIsbn] = useState('');
  const [pdfLink, setPdfLink] = useState('');
  const [contributorNames, setContributorNames] = useState<string[]>([]);
  const [dateAdded, setDateAdded] = useState('');
  const [dateAddedEnglish, setDateAddedEnglish] = useState('');
  const [summary, setSummary] = useState('');
  const [moreDetails, setMoreDetails] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [notes, setNotes] = useState('');
  const [driveFileName, setDriveFileName] = useState('');
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
      setBookName(e.book_name as string);
      setAuthorNames(((e.authors as TaxonomyRef[]) || []).map((a) => a.name));
      setDetails((e.details as string) || '');
      setCategoryName((e.category as TaxonomyRef | null)?.name || '');
      setPublisherName((e.publisher as TaxonomyRef | null)?.name || '');
      setVersion((e.version as string) || '');
      setYear((e.year as string) || '');
      setIsbn((e.isbn as string) || '');
      setPdfLink((e.pdf_link as string) || '');
      setContributorNames(((e.contributors as TaxonomyRef[]) || []).map((c) => c.name));
      setDateAdded((e.date_added as string) || '');
      setDateAddedEnglish((e.date_added_english as string) || '');
      setSummary((e.summary as string) || '');
      setMoreDetails((e.more_details as string) || '');
      setThumbnail((e.thumbnail as string) || '');
      setNotes(e.notes || '');
      setStatus(e.status);
      setHasPendingDeletion(e.has_pending_deletion);
    }).catch(console.error).finally(() => setLoading(false));
  }, [project, id, isEdit]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      let entryId = draftEntryIdRef.current;
      if (!entryId) {
        const created = await createEntry(project, { book_name: bookName || 'draft', action: 'draft' });
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
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (action: 'draft' | 'submit') => {
    if (!bookName.trim()) {
      toast.error('Book name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        book_name: bookName,
        authors_names: authorNames,
        details: details || null,
        category_name: categoryName || '',
        publisher_name: publisherName || '',
        version: version || null,
        year: year || null,
        isbn: isbn || null,
        pdf_link: pdfLink || null,
        contributors_names: contributorNames,
        date_added: dateAdded || null,
        date_added_english: dateAddedEnglish || null,
        summary: summary || null,
        more_details: moreDetails || null,
        thumbnail: thumbnail || null,
        notes: notes || null,
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
    bookName, setBookName,
    authorNames, setAuthorNames,
    details, setDetails,
    categoryName, setCategoryName,
    publisherName, setPublisherName,
    version, setVersion,
    year, setYear,
    isbn, setIsbn,
    pdfLink, setPdfLink,
    contributorNames, setContributorNames,
    dateAdded, setDateAdded,
    dateAddedEnglish, setDateAddedEnglish,
    summary, setSummary,
    moreDetails, setMoreDetails,
    thumbnail, setThumbnail,
    notes, setNotes,
    driveFileName, setDriveFileName,
    uploading, uploadProgress, saving,
    fileRef, handleFileChange, handleSave,
  };
}
