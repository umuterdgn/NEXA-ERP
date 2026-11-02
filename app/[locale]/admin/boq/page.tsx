/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Keşif & Metraj (BoQ) Yönetim Sayfası
 */

import { prisma } from "@/lib/prisma"
import CreateBoQModal from "@/components/boq/CreateBoQModal"
import { Calculator } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BoQPage() {
  const items = await prisma.boQItem
    .findMany({
      orderBy: { itemCode: "asc" },
    })
    .catch(() => [])

  const totalContractAmount = items.reduce(
    (sum, item) => sum + (item.totalAmount || 0),
    0
  )

  return (
    <div className="flex-1 w-full h-full p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Keşif & Metraj (BoQ)</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Metraj cetveli ve hakediş keşif kalemleri yönetimi
          </p>
        </div>
        {/* Eski statik buton yerine Client Component modal butonu */}
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

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Poz No</th>
                    <th className="px-4 py-3">İş Kalemi / Tanım</th>
                    <th className="px-4 py-3">Birim</th>
                    <th className="px-4 py-3 text-right">Planlanan Miktar</th>
                    <th className="px-4 py-3 text-right">Tamamlanan</th>
                    <th className="px-4 py-3 text-right">Birim Fiyat</th>
                    <th className="px-4 py-3 text-right">Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {items.map((item) => {
                    const planned = item.plannedQuantity || item.contractQuantity || 0
                    const completed = item.completedQuantity || 0
                    const progressPercent = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0
                    const total = item.totalPrice || item.totalAmount || planned * item.unitPrice

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-blue-400">
                          {item.pozNo || item.itemCode || "-"}
                        </td>
                        <td className="px-4 py-3 text-white font-sans text-sm">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-sans">
                          {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-200">
                          {planned.toLocaleString("tr-TR")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-emerald-400 font-semibold">
                            {completed.toLocaleString("tr-TR")}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1.5 font-sans">
                            (%{progressPercent})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-200">
                          {item.unitPrice.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">
                          {total.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
