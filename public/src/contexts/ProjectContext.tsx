import React, { createContext, useContext } from 'react';
import type { ProjectConfig } from '@/config/projects';

const ProjectContext = createContext<ProjectConfig | null>(null);

export const ProjectProvider: React.FC<{ project: ProjectConfig; children: React.ReactNode }> = ({ project, children }) => (
  <ProjectContext.Provider value={project}>{children}</ProjectContext.Provider>
);

// Only valid inside a route nested under ProjectLayout, which always
// supplies a project — components can rely on this never being null there.
export function useProject(): ProjectConfig {
  const project = useContext(ProjectContext);
  if (!project) throw new Error('useProject() called outside a project route');
  return project;
}
