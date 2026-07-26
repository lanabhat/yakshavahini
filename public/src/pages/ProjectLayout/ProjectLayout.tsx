import React from 'react';
import { useParams, Navigate, Outlet } from 'react-router-dom';
import { getProject } from '@/config/projects';
import { ProjectProvider } from '@/contexts/ProjectContext';
import Navbar from '@/components/Navbar/Navbar';

const ProjectLayout: React.FC = () => {
  const { project: slug } = useParams<{ project: string }>();
  const project = getProject(slug);

  if (!project || !project.active) return <Navigate to="/" replace />;

  return (
    <ProjectProvider project={project}>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </ProjectProvider>
  );
};

export default ProjectLayout;
