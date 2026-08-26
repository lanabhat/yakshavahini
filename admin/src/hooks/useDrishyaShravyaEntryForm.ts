import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createEntry, updateEntry, fetchEntry } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

interface TaxonomyRef {
  id: number;
  name: string;
}

export function useDrishyaShravyaEntryForm(id?: number) {
  const navigate = useNavigate();
  const { project } = useProject();
  const isEdit = !!id;

  const [eventType, setEventType] = useState('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [dateKannada, setDateKannada] = useState('');
  const [dateEnglish, setDateEnglish] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [presenterNames, setPresenterNames] = useState<string[]>([]);
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
      setEventType((e.event_type as string) || '');
      setSubject((e.subject as string) || '');
      setDetails((e.details as string) || '');
      setDateKannada((e.date_kannada as string) || '');
      setDateEnglish((e.date_english as string) || '');
      setVideoLink((e.video_link as string) || '');
      setPresenterNames(((e.presenters as TaxonomyRef[]) || []).map((p) => p.name));
      setNotes((e.notes as string) || '');
      setStatus(e.status);
      setHasPendingDeletion(e.has_pending_deletion);
    }).catch(console.error).finally(() => setLoading(false));
  }, [project, id, isEdit]);

  const handleSave = async (action: 'draft' | 'submit') => {
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        event_type: eventType || null,
        subject,
        details: details || null,
        date_kannada: dateKannada || null,
        date_english: dateEnglish || null,
        video_link: videoLink || null,
        presenters_names: presenterNames,
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
    eventType, setEventType,
    subject, setSubject,
    details, setDetails,
    dateKannada, setDateKannada,
    dateEnglish, setDateEnglish,
    videoLink, setVideoLink,
    presenterNames, setPresenterNames,
    notes, setNotes,
    saving, handleSave,
  };
}
