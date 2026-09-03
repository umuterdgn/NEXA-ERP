/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PhotoAnnotator from "@/components/PhotoAnnotator";

const AnnotatableFloorPlanViewer = dynamic(
  () => import("@/components/AnnotatableFloorPlanViewer"),
  { ssr: false, loading: () => <div className="w-full h-[600px] bg-slate-900 animate-pulse rounded-xl flex items-center justify-center">CAD Yükleniyor...</div> }
);

export default function CreateReportPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
    description: "",
    violations: ""
  });
  
  // Annotation URLs
  const [markedBlueprintUrl, setMarkedBlueprintUrl] = useState<string | null>(null);
  const [markedPhotoUrl, setMarkedPhotoUrl] = useState<string | null>(null);
  
  // DWG file URL (for CAD viewer)
  const [dwgFileUrl, setDwgFileUrl] = useState<string | null>(null);
  const [dwgFile, setDwgFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // Önbelleği kesin olarak iptal etmek için timestamp ekliyoruz
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/admin/projects?t=${timestamp}`, { cache: 'no-store' });
      const data = await response.json();
      
      console.log("📋 Client - API Response:", data);
      
      // Güvenli Veri Ayrıştırma (Defensive Parsing)
      let parsedProjects: any[] = [];
      
      if (Array.isArray(data)) {
        parsedProjects = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.projects)) {
          parsedProjects = data.projects;
        } else if (Array.isArray(data.data)) {
          parsedProjects = data.data;
        }
      }
      
      setProjects(parsedProjects);
      
      if (parsedProjects.length === 0) {
         console.warn("API boş veri döndürdü veya veri formatı eşleşmedi:", data);
      }
      
    } catch (error) {
      console.error("Projeler yüklenirken hata:", error);
      setProjects([]); // Hata anında kesinlikle boş dizi ata ki map çökmesin
    } finally {
      setLoading(false);
    }
  };

  const handleDwgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDwgFile(file);
    const url = URL.createObjectURL(file);
    setDwgFileUrl(url);
  };

  const handleSaveReport = async () => {
    if (!formData.projectId || !formData.title) {
      alert("Lütfen proje ve başlık alanlarını doldurun.");
      return;
    }

    try {
      setLoading(true);

      // Upload DWG annotation
      let dwgUrl = null;
      if (markedBlueprintUrl) {
        const dwgBlob = await (await fetch(markedBlueprintUrl)).blob();
        const dwgFormData = new FormData();
        dwgFormData.append("file", dwgBlob, "dwg-annotation.png");
        
        const dwgUploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: dwgFormData
        });
        const dwgUploadData = await dwgUploadResponse.json();
        dwgUrl = dwgUploadData.url;
      }

      // Upload Photo annotation
      let photoUrl = null;
      if (markedPhotoUrl) {
        const photoBlob = await (await fetch(markedPhotoUrl)).blob();
        const photoFormData = new FormData();
        photoFormData.append("file", photoBlob, "photo-annotation.png");
        
        const photoUploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: photoFormData
        });
        const photoUploadData = await photoUploadResponse.json();
        photoUrl = photoUploadData.url;
      }

      // Save report to database
      const reportData = {
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description,
        violations: formData.violations,
        markedBlueprintUrl: dwgUrl,
        markedPhotoUrl: photoUrl
      };

      const response = await fetch("/api/inspection/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        router.push("/admin/inspection");
      } else {
        alert("Rapor kaydedilirken hata oluştu.");
      }
    } catch (error) {
      console.error("Rapor kaydedilirken hata:", error);
      alert("Rapor kaydedilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Yapı Denetim Raporu Oluşturma</h1>
        <p className="text-slate-400">Yeni denetim raporu oluşturun, DWG planını ve saha fotoğrafını işaretleyin.</p>
      </div>

      {/* Bölüm 1: Rapor Detayları */}
      <div className="bg-slate-900 rounded-xl p-6 mb-6 border border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-4">📋 Rapor Detayları</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Proje Seçimi *</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Proje Seçin</option>
              {loading ? (
                <option disabled>Projeler yükleniyor...</option>
              ) : projects && projects.length > 0 ? (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name || project.title}
                  </option>
                ))
              ) : (
                <option disabled>Proje bulunamadı veya eklenmedi</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rapor Başlığı *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rapor başlığını girin"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Rapor açıklamasını girin"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Tespit Edilen Uygunsuzluklar</label>
            <textarea
              value={formData.violations}
              onChange={(e) => setFormData({ ...formData, violations: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Tespit edilen uygunsuzlukları listeleyin"
            />
          </div>
        </div>
      </div>

      {/* Bölüm 2: DWG Planı İşaretleme */}
      <div className="bg-slate-900 rounded-xl p-6 mb-6 border border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-4">📐 DWG Planı İşaretleme</h2>
        
        {!dwgFileUrl ? (
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".dwg,.dxf"
              onChange={handleDwgFileChange}
              className="hidden"
              id="dwg-file-input"
            />
            <label
              htmlFor="dwg-file-input"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              📁 DWG/DXF Dosyası Yükle
            </label>
            <p className="text-slate-400 mt-2 text-sm">DWG veya DXF formatında plan dosyası seçin</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-300">Dosya: {dwgFile?.name}</p>
              <button
                onClick={() => {
                  setDwgFileUrl(null);
                  setDwgFile(null);
                  setMarkedBlueprintUrl(null);
                }}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Dosyayı Değiştir
              </button>
            </div>
            <AnnotatableFloorPlanViewer
              key={dwgFileUrl}
              fileUrl={dwgFileUrl}
              onSaveAnnotation={(dataUrl: any) => setMarkedBlueprintUrl(dataUrl)}
            />
            {markedBlueprintUrl && (
              <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                <p className="text-sm text-green-400">✅ DWG çizimi onaylandı ve kaydedildi</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bölüm 3: Saha Fotoğrafı İşaretleme */}
      <div className="bg-slate-900 rounded-xl p-6 mb-6 border border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-4">📷 Saha Fotoğrafı İşaretleme</h2>
        
        <PhotoAnnotator
          onSaveAnnotation={(dataUrl: any) => setMarkedPhotoUrl(dataUrl)}
        />
        {markedPhotoUrl && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
            <p className="text-sm text-green-400">✅ Fotoğraf çizimi onaylandı ve kaydedildi</p>
          </div>
        )}
      </div>

      {/* Kaydet Butonu */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveReport}
          disabled={loading}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Kaydediliyor..." : "💾 Raporu Kaydet ve Arşive Ekle"}
        </button>
      </div>
    </div>
  );
}