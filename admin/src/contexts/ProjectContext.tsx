import React, { createContext, useContext, useState } from 'react';
import { getProject, DEFAULT_PROJECT_SLUG } from '@/config/projects';
import type { ProjectConfig } from '@/config/projects';

const STORAGE_KEY = 'admin_active_project';

interface ProjectContextValue {
  project: ProjectConfig;
  setProjectSlug: (slug: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<ProjectConfig>(() =>
    getProject(localStorage.getItem(STORAGE_KEY) || DEFAULT_PROJECT_SLUG),
  );

  const setProjectSlug = (slug: string) => {
    localStorage.setItem(STORAGE_KEY, slug);
    setProject(getProject(slug));
  };

  return (
    <ProjectContext.Provider value={{ project, setProjectSlug }}>
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject() called outside a ProjectProvider');
  return ctx;
}
