/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Keşif & Metraj (BoQ) Yönetim Sayfası
 * - ADIM 1: IFC Modelinden Otomatik Metraj (BoQ) Çıkarma
 * - ADIM 2: Bütçe Sapma (Over-budget) Uyarıları & Bütçe Sağlığı Özeti
 * - ADIM 3: Otomatik Taşeron Hakediş Fişi (Finans & Hakedişler)
 */

import { prisma } from "@/lib/prisma"
import CreateBoQModal from "@/components/boq/CreateBoQModal"
import IfcBoqExtractorModal from "@/components/boq/IfcBoqExtractorModal"
import BoQTableClient from "@/components/boq/BoQTableClient"

export const dynamic = "force-dynamic"

export default async function BoQPage() {
  const items = await prisma.boQItem
    .findMany({
      orderBy: { createdAt: "desc" },
    })
    .catch(() => [])

  return (
    <div className="flex-1 w-full h-full p-6 overflow-y-auto">
      {/* Sayfa Üst Başlığı & Butonlar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>Keşif & Metraj (BoQ)</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              BIM 2.0
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Metraj cetveli, otomatik IFC model çıkarımı, bütçe sapma alarmları ve taşeron hakediş fişleri
          </p>
        </div>

        {/* ADIM 1: "🏗️ IFC Modelinden Otomatik Metraj (BoQ) Çıkar" & "+ Yeni Keşif Ekle" */}
        <div className="flex flex-wrap items-center gap-2.5">
          <IfcBoqExtractorModal />
          <CreateBoQModal />
        </div>
      </div>

      {/* Akıllı Tablo, Bütçe Sağlığı Kartı ve Finans Sekmesi */}
      <BoQTableClient items={items as any} />
    </div>
  )
}
