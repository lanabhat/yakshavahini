import React from 'react';
import GenericLanding from '@/pages/Landing/GenericLanding';

// Every project's index route renders its admin-authored landing page
// (paragraphs + buttons, edited via the admin portal's Landing Page
// settings) — see GenericLanding, which falls back to the generic
// stats-driven Home page for any project that hasn't been configured yet.
const ProjectIndex: React.FC = () => <GenericLanding />;

export default ProjectIndex;
