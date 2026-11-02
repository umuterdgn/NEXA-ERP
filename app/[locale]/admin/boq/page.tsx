/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Keşif & Metraj (BoQ) Yönetim Sayfası
 */

import { prisma } from "@/lib/prisma"
import CreateBoQModal from "@/components/boq/CreateBoQModal"
import BoQTableClient from "@/components/boq/BoQTableClient"
import { Calculator } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BoQPage() {
  const items = await prisma.boQItem
    .findMany({
      orderBy: { createdAt: "desc" },
    })
    .catch(() => [])

  const totalContractAmount = items.reduce(
    (sum, item) => sum + (item.totalPrice || item.totalAmount || 0),
    0
  )

  return (
    <div className="flex-1 w-full h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Keşif & Metraj (BoQ)</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Metraj cetveli, otomatik hakediş ilerlemesi ve 3D BIM entegrasyonu
          </p>
        </div>
        <CreateBoQModal />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
          <Calculator className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-slate-300 font-medium">
            Henüz kayıtlı keşif kalemi bulunmuyor.
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Metraj ve keşif tabloları (BoQ) burada listelenecektir. Yeni imalat
            eklemek için yukarıdaki butonu kullanabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Toplam Kalem Sayısı</span>
              <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Toplam Sözleşme Bedeli</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                {totalContractAmount.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                ₺
              </p>
            </div>
          </div>

          {/* ADIM 2 & 3: Akıllı Tablo (Progress Bar & 3D BIM Entegrasyonu) */}
          <BoQTableClient items={items as any} />
        </div>
      )}
    </div>
  )
}
