"use client";
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Project Detail Client Actions (Edit Project + Belge/Proje Yükle Modal)
 */

import { useState } from "react";
import { Upload, FileUp } from "lucide-react";
import ProjectEditForm from "@/components/ProjectEditForm";
import ProjectDocumentUploadModal from "@/components/project/ProjectDocumentUploadModal";

interface ProjectDetailClientProps {
  project: any;
}

export default function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleProjectUpdated = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      {/* ADIM 2: Proje Detayları "Belge/Proje Yükle" Butonu */}
      <button
        type="button"
        onClick={() => setIsUploadModalOpen(true)}
        className="px-3.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        title="Yeni Proje Paftası veya PDF Belgesi Yükle"
      >
        <FileUp className="w-3.5 h-3.5" />
        <span>Belge/Proje Yükle</span>
      </button>

      {/* Mevcut Proje Düzenle Butonu */}
      <ProjectEditForm project={project} onProjectUpdated={handleProjectUpdated} />

      {/* Belge & PDF Yükleme Modalı */}
      <ProjectDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        projectId={project.id}
        projectName={project.name || project.title || ""}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
