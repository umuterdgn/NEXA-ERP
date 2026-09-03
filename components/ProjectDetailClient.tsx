"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import ProjectEditForm from "@/components/ProjectEditForm"

interface ProjectDetailClientProps {
  project: any
}

export default function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const handleProjectUpdated = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  return <ProjectEditForm project={project} onProjectUpdated={handleProjectUpdated} />
}
