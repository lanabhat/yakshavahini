import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createEntry, updateEntry, fetchEntry } from '@/services/api';
import { useProject } from '@/contexts/ProjectContext';

export function useSanghatanaEntryForm(id?: number) {
  const navigate = useNavigate();
  const { project } = useProject();
  const isEdit = !!id;

  const [nameOfTheOrg, setNameOfTheOrg] = useState('');
  const [details, setDetails] = useState('');
  const [typeOfOrg, setTypeOfOrg] = useState('');
  const [yakshaganaCategory, setYakshaganaCategory] = useState('');
  const [yakshaganaSubCategory, setYakshaganaSubCategory] = useState('');
  const [estabishmentDate, setEstabishmentDate] = useState('');
  const [stateOfTheEst, setStateOfTheEst] = useState('');
  const [headQuarter, setHeadQuarter] = useState('');
  const [detailsPdf, setDetailsPdf] = useState('');
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
      setNameOfTheOrg((e.name_of_the_org as string) || '');
      setDetails((e.details as string) || '');
      setTypeOfOrg((e.type_of_org as string) || '');
      setYakshaganaCategory((e.yakshagana_category as string) || '');
      setYakshaganaSubCategory((e.yakshagana_sub_category as string) || '');
      setEstabishmentDate((e.estabishment_date as string) || '');
      setStateOfTheEst((e.state_of_the_est as string) || '');
      setHeadQuarter((e.head_quarter as string) || '');
      setDetailsPdf((e.details_pdf as string) || '');
      setStatus(e.status);
      setHasPendingDeletion(e.has_pending_deletion);
    }).catch(console.error).finally(() => setLoading(false));
  }, [project, id, isEdit]);

  const handleSave = async (action: 'draft' | 'submit') => {
    if (!nameOfTheOrg.trim()) {
      toast.error('Organization name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name_of_the_org: nameOfTheOrg,
        details: details || null,
        type_of_org: typeOfOrg || null,
        yakshagana_category: yakshaganaCategory || null,
        yakshagana_sub_category: yakshaganaSubCategory || null,
        estabishment_date: estabishmentDate || null,
        state_of_the_est: stateOfTheEst || null,
        head_quarter: headQuarter || null,
        details_pdf: detailsPdf || null,
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
    nameOfTheOrg, setNameOfTheOrg,
    details, setDetails,
    typeOfOrg, setTypeOfOrg,
    yakshaganaCategory, setYakshaganaCategory,
    yakshaganaSubCategory, setYakshaganaSubCategory,
    estabishmentDate, setEstabishmentDate,
    stateOfTheEst, setStateOfTheEst,
    headQuarter, setHeadQuarter,
    detailsPdf, setDetailsPdf,
    saving, handleSave,
  };
}
