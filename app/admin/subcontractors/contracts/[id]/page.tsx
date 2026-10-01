/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import { ArrowLeft, Calendar, Building2, User, FileText, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, name: true, city: true, district: true }
      },
      subcontractor: {
        select: { id: true, name: true, taxNumber: true, contactName: true, phone: true }
      },
      billings: {
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!contract) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-red-400 mb-2">Sözleşme Bulunamadı</h2>
          <p className="text-slate-400 mb-4">Bu ID ile eşleşen bir sözleşme kaydı bulunamadı.</p>
          <Link
            href="/admin/subcontractors/contracts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Sözleşmeler Listesine Dön
          </Link>
        </div>
      </div>
    )
  }

  const statusColors = {
    ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
    COMPLETED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    TERMINATED: "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const statusLabels = {
    ACTIVE: "Aktif",
    COMPLETED: "Tamamlandı",
    TERMINATED: "Feshedildi"
  }

  const totalPaid = contract.billings
    .filter(b => b.status === "PAID")
    .reduce((sum, b) => sum + (b.netPayable || 0), 0)

  const remainingAmount = contract.totalAmount - totalPaid

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/subcontractors/contracts"
            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{contract.title}</h1>
            <p className="text-slate-400 mt-1">Sözleşme Detayları</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-lg border text-sm font-medium ${statusColors[contract.status as keyof typeof statusColors]}`}>
          {statusLabels[contract.status as keyof typeof statusLabels]}
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Details Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Sözleşme Bilgileri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Sözleşme ID</label>
                <p className="text-white font-mono text-sm">{contract.id}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Başlangıç Tarihi</label>
                <p className="text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {contract.startDate ? new Date(contract.startDate).toLocaleDateString("tr-TR") : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Bitiş Tarihi</label>
                <p className="text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {contract.endDate ? new Date(contract.endDate).toLocaleDateString("tr-TR") : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Toplam Tutar</label>
                <p className="text-white font-semibold">
                  ₺{(contract.totalAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-400" />
              Proje Bilgileri
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Proje Adı</label>
                <p className="text-white">{contract.project?.name || 'Bilinmiyor'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Şehir</label>
                  <p className="text-white">{contract.project?.city || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">İlçe</label>
                  <p className="text-white">{contract.project?.district || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Hakediş Geçmişi
            </h2>
            {contract.billings.length > 0 ? (
              <div className="space-y-3">
                {contract.billings.map((billing) => (
                  <div key={billing.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {billing.periodMonth}/{billing.periodYear} Dönemi
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {billing.createdAt ? new Date(billing.createdAt).toLocaleDateString("tr-TR") : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          ₺{(billing.netPayable || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                          billing.status === "PAID" ? "bg-green-500/20 text-green-400" :
                          billing.status === "APPROVED" ? "bg-blue-500/20 text-blue-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {billing.status === "PAID" ? "Ödendi" :
                           billing.status === "APPROVED" ? "Onaylandı" :
                           billing.status === "PENDING_APPROVAL" ? "Onay Bekliyor" : billing.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>Henüz hakediş kaydı bulunmuyor</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subcontractor Info */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-400" />
              Taşeron Bilgileri
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Firma Adı</label>
                <p className="text-white">{contract.subcontractor?.name || 'Bilinmiyor'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Vergi No</label>
                <p className="text-white">{contract.subcontractor?.taxNumber || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">İletişim Kişisi</label>
                <p className="text-white">{contract.subcontractor?.contactName || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Telefon</label>
                <p className="text-white">{contract.subcontractor?.phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Ödeme Özeti
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Toplam Sözleşme</span>
                <span className="text-white font-semibold">
                  ₺{(contract.totalAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Ödenen</span>
                <span className="text-green-400 font-semibold">
                  ₺{(totalPaid || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Kalan</span>
                  <span className={`font-semibold ${remainingAmount > 0 ? "text-orange-400" : "text-green-400"}`}>
                    ₺{(remainingAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">İlerleme</span>
                  <span className="text-white">
                    {contract.totalAmount > 0 ? ((totalPaid / contract.totalAmount) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${contract.totalAmount > 0 ? (totalPaid / contract.totalAmount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
