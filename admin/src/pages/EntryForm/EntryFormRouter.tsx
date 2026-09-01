import React from 'react';
import { useProject } from '@/contexts/ProjectContext';
import EntryForm from './EntryForm';
import PustakaEntryForm from './PustakaEntryForm';
import SanghatanaEntryForm from './SanghatanaEntryForm';
import DrishyaShravyaEntryForm from './DrishyaShravyaEntryForm';
import PrasangaYadiEntryForm from './PrasangaYadiEntryForm';

// Each project's entry shape is different enough (Mattukosha: plain scalar
// fields; Pustaka Kosha: taxonomy FK/M2M fields; Sanghatana Kosha: plain
// scalar fields with different names) that they get their own form component
// rather than one form trying to be schema-driven for all of them. Adding a
// new project means adding one more branch here.
const EntryFormRouter: React.FC = () => {
  const { project } = useProject();
  if (project.slug === 'pustakakosha') return <PustakaEntryForm />;
  if (project.slug === 'sanghatanakosha') return <SanghatanaEntryForm />;
  if (project.slug === 'drishyashravyakosha') return <DrishyaShravyaEntryForm />;
  if (project.slug === 'prasangayadi') return <PrasangaYadiEntryForm />;
  return <EntryForm />;
};

export default EntryFormRouter;
