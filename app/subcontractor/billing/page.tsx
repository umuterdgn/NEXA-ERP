/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export default async function SubcontractorBillingPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return (
      <div className="p-6">
        <div className="text-red-400">Oturum bulunamadı</div>
      </div>
    )
  }

  // Get personel record to find company association
  const personel = await prisma.personel.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      company: true,
    },
  })

  if (!personel?.companyId) {
    return (
      <div className="p-6">
        <div className="text-red-400">Firma bilgisi bulunamadı</div>
      </div>
    )
  }

  const subcontractorId = personel.companyId

  const billings = await prisma.progressBilling.findMany({
    where: { subcontractorId },
    include: {
      project: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const statusColors = {
    DRAFT: "bg-yellow-500/20 text-yellow-400",
    PENDING_APPROVAL: "bg-blue-500/20 text-blue-400",
    APPROVED: "bg-green-500/20 text-green-400",
    PAID: "bg-purple-500/20 text-purple-400"
  }

  const statusLabels = {
    DRAFT: "Taslak",
    PENDING_APPROVAL: "Onay Bekliyor",
    APPROVED: "Onaylandı",
    PAID: "Ödendi"
  }

  const totalAmount = billings.reduce((sum, b) => sum + b.totalAmount, 0)
  const paidAmount = billings.filter(b => b.status === "PAID").reduce((sum, b) => sum + b.totalAmount, 0)
  const pendingAmount = billings.filter(b => b.status === "PENDING_APPROVAL" || b.status === "APPROVED").reduce((sum, b) => sum + b.totalAmount, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Hakedişlerim</h1>
        <p className="text-slate-400 mt-1">Ödeme durumlarınızı takip edin</p>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Toplam Hakediş Tutarı</div>
          <div className="text-2xl font-bold text-white mt-2">
            ₺{totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Ödenen Tutar</div>
          <div className="text-2xl font-bold text-green-400 mt-2">
            ₺{paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Bekleyen Tutar</div>
          <div className="text-2xl font-bold text-blue-400 mt-2">
            ₺{pendingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Hakediş Tablosu */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Proje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Dönem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {billings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Henüz hakediş kaydı bulunmuyor
                  </td>
                </tr>
              ) : (
                billings.map((billing) => (
                  <tr key={billing.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{billing.project.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {billing.periodMonth}/{billing.periodYear}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        ₺{billing.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[billing.status as keyof typeof statusColors]}`}>
                        {statusLabels[billing.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-400">
                        {new Date(billing.createdAt).toLocaleDateString("tr-TR")}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bilgi Notu */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 print:hidden">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-400">Bilgi</h4>
            <p className="text-sm text-slate-400 mt-1">
              Hakedişler ana firma tarafından oluşturulur ve onaylanır. Ödeme durumlarını buradan takip edebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
