/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";
import { useEffect, useState } from 'react';
import { useNetworkState } from 'react-use';
import { db } from '@/lib/offline-db';
import { toast } from 'react-hot-toast';

export default function OfflineSyncManager() {
  const { online } = useNetworkState();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // İnternet varsa ve şu an eşitleme yapmıyorsak tetikle
    if (online && !isSyncing) {
      syncOfflineReports();
    }
  }, [online]);

  const syncOfflineReports = async () => {
    setIsSyncing(true);
    try {
      const pendingReports = await db.offlineReports.where('syncStatus').equals('pending').toArray();
      if (pendingReports.length === 0) return; // Bekleyen rapor yoksa sessizce çık

      toast.loading(`📶 İnternet geldi! ${pendingReports.length} rapor buluta aktarılıyor...`, { id: 'sync-toast' });

      let successCount = 0;

      for (const report of pendingReports) {
        try {
          const uploadPromises = [];
          
          // Base64 verilerini Blob'a çevirip Cloudinary için hazırlıyoruz
          if (report.markedBlueprintBase64) {
            const blob = await (await fetch(report.markedBlueprintBase64)).blob();
            const formData = new FormData();
            formData.append("file", blob, "blueprint-offline.png");
            uploadPromises.push(fetch("/api/upload", { method: "POST", body: formData }).then(res => res.json()));
          }
          
          if (report.markedPhotoBase64) {
            const blob = await (await fetch(report.markedPhotoBase64)).blob();
            const formData = new FormData();
            formData.append("file", blob, "photo-offline.png");
            uploadPromises.push(fetch("/api/upload", { method: "POST", body: formData }).then(res => res.json()));
          }
          
          if (report.dxfBase64) {
            const blob = new Blob([report.dxfBase64], { type: 'application/dxf' });
            const formData = new FormData();
            formData.append("file", blob, "rapor-cizimi-offline.dxf");
            uploadPromises.push(fetch("/api/upload", { method: "POST", body: formData }).then(res => res.json()));
          }

          const uploadResults = await Promise.all(uploadPromises);
          
          // Yüklenen URL'leri sırasıyla eşleştir
          let resultIndex = 0;
          const markedBlueprintUrl = report.markedBlueprintBase64 ? uploadResults[resultIndex++]?.url : null;
          const markedPhotoUrl = report.markedPhotoBase64 ? uploadResults[resultIndex++]?.url : null;
          const dxfUrl = report.dxfBase64 ? uploadResults[resultIndex++]?.url : null;

          // Asıl veritabanına (Prisma) kaydet
          const payload = {
            projectId: report.projectId,
            title: report.title,
            description: report.description,
            findings: report.findings,
            markedBlueprintUrl,
            markedPhotoUrl,
            dxfUrl
          };

          let res;
          if (report.operation === 'update' && report.reportId) {
            // Güncelleme işlemi
            res = await fetch(`/api/admin/inspection-reports/${report.reportId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
          } else {
            // Yeni oluşturma işlemi
            res = await fetch("/api/admin/inspection-reports", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
          }

          if (res.ok) {
            // Başarıyla buluta gittiyse, yerel hafızadan sil!
            if (report.id) await db.offlineReports.delete(report.id);
            successCount++;
          }
        } catch (err) {
          console.error("Rapor eşitlenemedi:", err);
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} çevrimdışı rapor buluta eşitlendi!`, { id: 'sync-toast' });
      } else {
        toast.dismiss('sync-toast');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return null; // Arayüzde yer kaplamayan, arka planda çalışan hayalet bileşen
}