/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function BillingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const billing = await prisma.progressBilling.findUnique({
    where: { id: resolvedParams.id },
    include: {
      project: {
        select: { name: true, contractValue: true, location: true }
      },
      subcontractor: {
        select: { name: true, taxNumber: true, taxOffice: true, phone: true, email: true }
      }
    }
  })

  // Bu hakedişe bağlı kesintileri çek
  const appliedDeductions = await prisma.deduction.findMany({
    where: {
      appliedToBillingId: resolvedParams.id,
    },
    orderBy: {
      date: 'desc',
    },
  })

  if (!billing) {
    notFound()
  }

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

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header - Sadece ekran görüntüsünde görünsün, yazdırmada gizlensin */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <Link href="/admin/billing" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block">
            ← Hakediş Yönetimi
          </Link>
          <h1 className="text-2xl font-bold text-white">Hakediş Detayı</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          🖨️ PDF / Yazdır
        </button>
      </div>

      {/* Yazdırılabilir Belge - A4 Format */}
      <div className="bg-white text-slate-900 rounded-lg p-8 max-w-4xl mx-auto shadow-xl print:shadow-none print:max-w-none">
        {/* Belge Başlığı */}
        <div className="text-center border-b-2 border-slate-300 pb-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">HAKEDİŞ BELGESİ</h1>
          <p className="text-slate-600 mt-2">Progress Payment Certificate</p>
        </div>

        {/* Firma Bilgileri */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Ana Firma</h3>
            <p className="text-slate-600 font-medium">Mahir Bakay Mühendislik</p>
            <p className="text-slate-500 text-sm mt-1">İnşaat ve Mühendislik Hizmetleri</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Taşeron Firma</h3>
            <p className="text-slate-600 font-medium">{billing.subcontractor.name}</p>
            <p className="text-slate-500 text-sm mt-1">Vergi No: {billing.subcontractor.taxNumber || "-"}</p>
            <p className="text-slate-500 text-sm">Vergi Dairesi: {billing.subcontractor.taxOffice || "-"}</p>
          </div>
        </div>

        {/* Proje Bilgileri */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 text-sm">Proje Adı:</span>
              <p className="text-slate-900 font-medium">{billing.project.name}</p>
            </div>
            <div>
              <span className="text-slate-500 text-sm">Dönem:</span>
              <p className="text-slate-900 font-medium">
                {monthNames[billing.periodMonth - 1]} {billing.periodYear}
              </p>
            </div>
            <div>
              <span className="text-slate-500 text-sm">Belge No:</span>
              <p className="text-slate-900 font-medium">{billing.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <span className="text-slate-500 text-sm">Belge Tarihi:</span>
              <p className="text-slate-900 font-medium">
                {new Date(billing.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
        </div>

        {/* Hakediş Tutarı */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-700 mb-1">Brüt Hakediş Tutarı</h3>
              <p className="text-slate-500 text-sm">Progress Payment Amount</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                ₺{billing.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Uygulanan Kesintiler */}
        {appliedDeductions.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-slate-700 mb-4">Uygulanan Kesintiler</h3>
            <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-red-200">
                  <th className="text-left py-2 text-sm text-slate-600">Sebep</th>
                  <th className="text-right py-2 text-sm text-slate-600">Tutar</th>
                  <th className="text-right py-2 text-sm text-slate-600">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {appliedDeductions.map((deduction) => (
                  <tr key={deduction.id} className="border-b border-red-100">
                    <td className="py-2 text-sm text-slate-700">{deduction.reason}</td>
                    <td className="py-2 text-sm text-red-600 text-right font-medium">
                      -₺{deduction.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 text-sm text-slate-600 text-right">
                      {new Date(deduction.date).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-red-300">
                  <td className="py-2 text-sm font-semibold text-slate-700">Toplam Kesinti</td>
                  <td className="py-2 text-sm font-bold text-red-600 text-right">
                    -₺{appliedDeductions.reduce((sum, d) => sum + d.amount, 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        )}

        {/* Net Ödenecek Tutar */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-700 mb-1">Net Ödenecek Tutar</h3>
              <p className="text-slate-500 text-sm">Net Payment Amount</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">
                ₺{(billing.netAmount || billing.totalAmount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Durum */}
        <div className="mb-6">
          <span className="text-slate-500 text-sm">Durum:</span>
          <span className={`ml-2 px-3 py-1 rounded text-sm font-medium ${statusColors[billing.status as keyof typeof statusColors]}`}>
            {statusLabels[billing.status as keyof typeof statusLabels]}
          </span>
        </div>

        {/* Notlar */}
        {billing.notes && (
          <div className="mb-6">
            <h3 className="font-semibold text-slate-700 mb-2">Notlar</h3>
            <div className="bg-slate-50 rounded-lg p-4 text-slate-600">
              {billing.notes}
            </div>
          </div>
        )}

        {/* İmza Alanı */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-slate-300">
          <div className="text-center">
            <div className="border-b border-slate-400 mb-2 pb-8">
              <p className="text-slate-600">Ana Firma Yetkili</p>
            </div>
            <p className="text-slate-500 text-sm">İmza ve Kaşe</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-400 mb-2 pb-8">
              <p className="text-slate-600">Taşeron Firma Yetkili</p>
            </div>
            <p className="text-slate-500 text-sm">İmza ve Kaşe</p>
          </div>
        </div>

        {/* Alt Bilgi - Sadece yazdırmada görünsün */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-slate-500 text-sm print:block hidden">
          <p>Bu belge Mahir Bakay Mühendislik tarafından otomatik olarak oluşturulmuştur.</p>
          <p className="mt-1">Belge No: {billing.id} | Tarih: {new Date(billing.createdAt).toLocaleString("tr-TR")}</p>
        </div>
      </div>

      {/* Ek Bilgiler - Yazdırmada gizlensin */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 print:hidden">
        <h3 className="text-lg font-semibold text-white mb-4">İşlemler</h3>
        <div className="flex gap-3">
          <Link
            href="/admin/billing"
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Listeye Dön
          </Link>
          {billing.status === "DRAFT" && (
            <button
              onClick={async () => {
                await fetch(`/api/progress-billing/${billing.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "PENDING_APPROVAL" })
                })
                window.location.reload()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Onaya Gönder
            </button>
          )}
          {billing.status === "PENDING_APPROVAL" && (
            <button
              onClick={async () => {
                await fetch(`/api/progress-billing/${billing.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "APPROVED" })
                })
                window.location.reload()
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            >
              Onayla
            </button>
          )}
          {billing.status === "APPROVED" && (
            <button
              onClick={async () => {
                await fetch(`/api/progress-billing/${billing.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "PAID" })
                })
                window.location.reload()
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
            >
              Ödendi İşaretle
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
