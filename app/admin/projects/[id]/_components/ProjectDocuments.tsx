/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState, useEffect } from "react";
import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { FileText, Upload, History, Download, Eye, Plus, Folder, FileCode, FileCheck, FileText as FileDoc } from "lucide-react";
import { toast } from "react-hot-toast";

interface ProjectDocument {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  revision: number;
  status: string;
  documentGroupId: string | null;
  createdAt: string;
  uploadedBy?: {
    name: string;
  };
}

interface ProjectDocumentsProps {
  projectId: string;
}

export default function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "BLUEPRINT",
  });

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/project-documents?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.filter((doc: ProjectDocument) => doc.status === "ACTIVE"));
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (res: any[]) => {
    if (res && res.length > 0) {
      setUploading(true);
      try {
        const response = await fetch('/api/project-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            title: formData.title,
            type: formData.type,
            fileUrl: res[0].url,
            revision: 0,
            status: "ACTIVE",
            documentGroupId: crypto.randomUUID(),
          }),
        });

        if (response.ok) {
          toast.success("Doküman başarıyla yüklendi");
          await fetchDocuments();
          setIsUploadModalOpen(false);
          setFormData({ title: "", type: "BLUEPRINT" });
        } else {
          toast.error("Doküman kaydedilirken hata oluştu");
        }
      } catch (error) {
        console.error("Error saving document:", error);
        toast.error("Doküman kaydedilirken hata oluştu");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRevisionUpload = async (res: any[]) => {
    if (res && res.length > 0 && selectedDocument) {
      setUploading(true);
      try {
        // Mevcut aktif dokümanı OBSOLETE yap
        await fetch(`/api/project-documents/${selectedDocument.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "OBSOLETE" }),
        });

        // Yeni revizyon oluştur
        const response = await fetch('/api/project-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            title: selectedDocument.title,
            type: selectedDocument.type,
            fileUrl: res[0].url,
            revision: selectedDocument.revision + 1,
            status: "ACTIVE",
            documentGroupId: selectedDocument.documentGroupId,
          }),
        });

        if (response.ok) {
          toast.success(`Rev ${selectedDocument.revision + 1} başarıyla oluşturuldu`);
          await fetchDocuments();
          setIsRevisionModalOpen(false);
          setSelectedDocument(null);
        } else {
          toast.error("Revizyon kaydedilirken hata oluştu");
        }
      } catch (error) {
        console.error("Error saving revision:", error);
        toast.error("Revizyon kaydedilirken hata oluştu");
      } finally {
        setUploading(false);
      }
    }
  };

  const fetchHistory = async (documentGroupId: string) => {
    try {
      const response = await fetch(`/api/project-documents?groupId=${documentGroupId}`);
      if (response.ok) {
        const data = await response.json();
        setShowHistory(documentGroupId);
        setDocuments(prev => [...prev, ...data.filter((doc: ProjectDocument) => doc.status === "OBSOLETE")]);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BLUEPRINT": return <FileCode className="w-5 h-5 text-blue-400" />;
      case "SPECIFICATION": return <FileCheck className="w-5 h-5 text-green-400" />;
      case "CONTRACT": return <FileDoc className="w-5 h-5 text-purple-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "BLUEPRINT": return "Proje";
      case "SPECIFICATION": return "Şartname";
      case "CONTRACT": return "Sözleşme";
      default: return "Diğer";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Aktif</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
            <span>Eski Revizyon</span>
          </div>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Doküman Ekle
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Folder className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p>Henüz doküman eklenmemiş.</p>
          <p className="text-sm mt-2">İlk dokümanı eklemek için "Yeni Doküman Ekle" butonuna tıklayın.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`bg-slate-900 rounded-lg border p-4 ${
                doc.status === "ACTIVE" ? "border-slate-700" : "border-slate-800 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {getTypeIcon(doc.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium">{doc.title}</h4>
                      <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                        Rev {doc.revision}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                        {getTypeLabel(doc.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{new Date(doc.createdAt).toLocaleDateString("tr-TR")}</span>
                      {doc.uploadedBy && <span>{doc.uploadedBy.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === "ACTIVE" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedDocument(doc);
                          setIsRevisionModalOpen(true);
                        }}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded transition-colors"
                        title="Yeni Revizyon Yükle"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      {doc.documentGroupId && (
                        <button
                          onClick={() => {
                            if (showHistory === doc.documentGroupId) {
                              setShowHistory(null);
                              fetchDocuments();
                            } else {
                              fetchHistory(doc.documentGroupId!);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                          title="Geçmiş Revizyonları Gör"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-green-400 hover:text-green-300 hover:bg-slate-800 rounded transition-colors"
                    title="Görüntüle"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={doc.fileUrl}
                    download
                    className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                    title="İndir"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Yeni Doküman Ekle</h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Doküman Adı *</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: A Blok Zemin Kat Mimari"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Doküman Tipi *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BLUEPRINT">Proje (Blueprint)</option>
                  <option value="SPECIFICATION">Şartname</option>
                  <option value="CONTRACT">Sözleşme</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Dosya Yükle *</label>
                <UploadDropzone<OurFileRouter, "projectDocumentUploader">
                  endpoint="projectDocumentUploader"
                  config={{ mode: "auto" }}
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(error: Error) => {
                    toast.error(`Yükleme hatası: ${error.message}`);
                  }}
                />
              </div>

              {uploading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isRevisionModalOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Yeni Revizyon Yükle</h2>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-300 mb-1">Doküman: <span className="text-white">{selectedDocument.title}</span></p>
              <p className="text-sm text-slate-300">Mevcut Revizyon: <span className="text-white">Rev {selectedDocument.revision}</span></p>
              <p className="text-sm text-slate-300">Yeni Revizyon: <span className="text-green-400">Rev {selectedDocument.revision + 1}</span></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Dosya Yükle *</label>
              <UploadDropzone<OurFileRouter, "projectDocumentUploader">
                endpoint="projectDocumentUploader"
                config={{ mode: "auto" }}
                onClientUploadComplete={handleRevisionUpload}
                onUploadError={(error: Error) => {
                  toast.error(`Yükleme hatası: ${error.message}`);
                }}
              />
            </div>

            {uploading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
