import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createEntry, updateEntry, fetchEntry } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

interface TaxonomyRef {
  id: number;
  name: string;
}

export function usePrasangaYadiEntryForm(id?: number) {
  const navigate = useNavigate();
  const { project } = useProject();
  const isEdit = !!id;

  const [uniqueNumber, setUniqueNumber] = useState('');
  const [prasangaName, setPrasangaName] = useState('');
  const [kaviNames, setKaviNames] = useState<string[]>([]);
  const [type, setType] = useState('');
  const [publishStatus, setPublishStatus] = useState('');
  const [prasangaType, setPrasangaType] = useState('');
  const [prasangaLanguage, setPrasangaLanguage] = useState('');
  const [storySource, setStorySource] = useState('');
  const [prasangaKoshaLink, setPrasangaKoshaLink] = useState('');
  const [pratisangrahaLink, setPratisangrahaLink] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [status, setStatus] = useState('');
  const [hasPendingDeletion, setHasPendingDeletion] = useState(false);
  const [sendForReview, setSendForReview] = useState(false);
  const draftEntryIdRef = useRef<number | null>(id ?? null);

  useEffect(() => {
    if (!isEdit) return;
    fetchEntry(project, id!).then((res) => {
      const e = res.data;
      setUniqueNumber((e.unique_number as string) || '');
      setPrasangaName((e.prasanga_name as string) || '');
      setKaviNames(((e.kavi as TaxonomyRef[]) || []).map((k) => k.name));
      setType((e.type as string) || '');
      setPublishStatus((e.publish_status as string) || '');
      setPrasangaType((e.prasanga_type as string) || '');
      setPrasangaLanguage((e.prasanga_language as string) || '');
      setStorySource((e.story_source as string) || '');
      setPrasangaKoshaLink((e.prasanga_kosha_link as string) || '');
      setPratisangrahaLink((e.pratisangraha_link as string) || '');
      setNotes((e.notes as string) || '');
      setStatus(e.status);
      setHasPendingDeletion(e.has_pending_deletion);
    }).catch(console.error).finally(() => setLoading(false));
  }, [project, id, isEdit]);

  const handleSave = async (action: 'draft' | 'submit') => {
    if (!prasangaName.trim()) {
      toast.error('Prasanga name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        unique_number: uniqueNumber || null,
        prasanga_name: prasangaName,
        kavi_names: kaviNames,
        type: type || null,
        publish_status: publishStatus || null,
        prasanga_type: prasangaType || null,
        prasanga_language: prasangaLanguage || null,
        story_source: storySource || null,
        prasanga_kosha_link: prasangaKoshaLink || null,
        pratisangraha_link: pratisangrahaLink || null,
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
    uniqueNumber, setUniqueNumber,
    prasangaName, setPrasangaName,
    kaviNames, setKaviNames,
    type, setType,
    publishStatus, setPublishStatus,
    prasangaType, setPrasangaType,
    prasangaLanguage, setPrasangaLanguage,
    storySource, setStorySource,
    prasangaKoshaLink, setPrasangaKoshaLink,
    pratisangrahaLink, setPratisangrahaLink,
    notes, setNotes,
    saving, handleSave,
  };
}
