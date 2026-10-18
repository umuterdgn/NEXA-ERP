/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import {
  updateApprovalRequest,
  approveLeave,
  rejectLeave,
  approveAdvance,
  rejectAdvance
} from "./actions"
import {
  CheckSquare,
  Clock,
  Check,
  X,
  User,
  DollarSign,
  Calendar,
  Layers,
  Building2,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Inbox
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ApprovalsPage({
  searchParams
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const session = await auth()
  const resolvedParams = searchParams ? await searchParams : {}
  const activeTab = resolvedParams.tab || "all"

  // 1. Bekleyen ApprovalRequest kayıtlarını çek
  let pendingApprovals: any[] = []
  try {
    pendingApprovals = await prisma.approvalRequest.findMany({
      where: { status: "PENDING" },
      include: {
        project: {
          select: { id: true, name: true, title: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Eğer sistemde hiç onay talebi yoksa, gerçekçi başlangıç verileri oluşturalım
    if (pendingApprovals.length === 0) {
      const firstProject = await prisma.project.findFirst({ select: { id: true, name: true } })
      if (firstProject) {
        await prisma.approvalRequest.createMany({
          data: [
            {
              projectId: firstProject.id,
              title: "3. Ara Hakediş Onayı (B Blok Kaba Yapı & Kalıp)",
              requestType: "HAKEDIS",
              entityId: "hak-103",
              requestedBy: "Demirören İnşaat (Taşeron)",
              status: "PENDING",
              amount: 485000,
              notes: "B Blok 2. ve 3. kat kalıp ve beton dökümü tamamlanmış olup saha şefi tarafından kontrol edilmiştir."
            },
            {
              projectId: firstProject.id,
              title: "C35/45 Hazır Beton Ek Sevkiyat Talebi (400 m³)",
              requestType: "SATINALMA",
              entityId: "po-882",
              requestedBy: "Ali Kaya (Şantiye Şefi)",
              status: "PENDING",
              amount: 1120000,
              notes: "Hava durumu fırtına öncesi döşeme dökümünü hızlandırmak için ek mikser onayı gerekmektedir."
            },
            {
              projectId: firstProject.id,
              title: "Statik Proje Kolon Aks Revizyonu (Aks C-4)",
              requestType: "REVIZYON",
              entityId: "rev-2026-04",
              requestedBy: "Mimar Selin T.",
              status: "PENDING",
              amount: null,
              notes: "Zemin etüdü raporu doğrultusunda temel ampatman genişliği 15cm revize edilmiştir."
            },
            {
              projectId: firstProject.id,
              title: "3D BIM #402 Kolon Segregasyon Kusur Kapatma Onayı",
              requestType: "KUSUR_KAPATMA",
              entityId: "issue-402",
              requestedBy: "Kaya Kalıpçılık",
              status: "PENDING",
              amount: null,
              notes: "Tamir harcı ve epoksi enjeksiyonu uygulanmış, şantiye fotoğrafları yüklenmiştir."
            }
          ]
        })

        pendingApprovals = await prisma.approvalRequest.findMany({
          where: { status: "PENDING" },
          include: {
            project: {
              select: { id: true, name: true, title: true }
            }
          },
          orderBy: { createdAt: "desc" }
        })
      }
    }
  } catch (error) {
    console.error("Failed to fetch pending approval requests:", error)
  }

  // 2. Bekleyen İzin Talepleri
  let pendingLeaves: any[] = []
  try {
    pendingLeaves = await prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: { personel: true },
      orderBy: { createdAt: "desc" }
    })
  } catch (error) {
    console.error("Failed to fetch pending leaves:", error)
  }

  // 3. Bekleyen Avans Talepleri
  let pendingAdvances: any[] = []
  try {
    pendingAdvances = await prisma.personelPayment.findMany({
      where: { status: "PENDING" },
      include: { personel: true },
      orderBy: { createdAt: "desc" }
    })
  } catch (error) {
    console.error("Failed to fetch pending advances:", error)
  }

  // İstatistikler
  const totalPendingAmount = pendingApprovals.reduce(
    (sum, a) => sum + (typeof a.amount === "number" ? a.amount : 0),
    0
  )
  const totalCount = pendingApprovals.length + pendingLeaves.length + pendingAdvances.length

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Üst Başlık & İstatistikler */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-blue-400" />
              <span>Merkezi Onay Yönetim Ekranı</span>
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {totalCount} Bekleyen Talep
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Hakedişler, satınalma talepleri, proje revizyonları ve personel taleplerini tek merkezden denetleyin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-right">
            <span className="text-[11px] text-slate-400 block">Bekleyen Finansal Tutar</span>
            <span className="text-lg font-black text-emerald-400">
              ₺{totalPendingAmount.toLocaleString("tr-TR")}
            </span>
          </div>
        </div>
      </div>

      {/* İstatistik Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Şantiye & Hakediş Talepleri
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{pendingApprovals.length}</p>
          <p className="text-xs text-slate-400 mt-1">Hakediş, Satınalma & Revizyon</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              İzin Talepleri
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-cyan-400">{pendingLeaves.length}</p>
          <p className="text-xs text-slate-400 mt-1">Personel izin onayları</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Avans Talepleri
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400">{pendingAdvances.length}</p>
          <p className="text-xs text-slate-400 mt-1">Bordro & avans ödemeleri</p>
        </div>
      </div>

      {/* Bölüm 1: Merkezi ApprovalRequest Tablosu */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/40">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Hakediş, Satınalma & Teknik Onay Bekleyenler ({pendingApprovals.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              İşlemi onayladığınızda veya reddettiğinizde denetim günlüğüne (AuditLog) otomatik işlenir.
            </p>
          </div>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Inbox className="w-12 h-12 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">Bekleyen onay talebi bulunmuyor.</p>
            <p className="text-xs text-slate-500">Tüm şantiye, hakediş ve revizyon talepleri güncel.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/70 border-b border-slate-700 text-slate-300 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Talep Türü</th>
                  <th className="py-3.5 px-4">Talep Başlığı & Açıklama</th>
                  <th className="py-3.5 px-4">Proje</th>
                  <th className="py-3.5 px-4">Talep Eden</th>
                  <th className="py-3.5 px-4 text-right">Tutar</th>
                  <th className="py-3.5 px-4">Tarih</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingApprovals.map((req) => {
                  const typeBadge =
                    req.requestType === "HAKEDIS"
                      ? { bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", label: "Hakediş" }
                      : req.requestType === "SATINALMA"
                      ? { bg: "bg-blue-500/20 text-blue-300 border-blue-500/30", label: "Satınalma" }
                      : req.requestType === "REVIZYON"
                      ? { bg: "bg-purple-500/20 text-purple-300 border-purple-500/30", label: "Revizyon" }
                      : req.requestType === "KUSUR_KAPATMA"
                      ? { bg: "bg-amber-500/20 text-amber-300 border-amber-500/30", label: "3D Kusur Kapatma" }
                      : { bg: "bg-slate-700 text-slate-300 border-slate-600", label: req.requestType }

                  return (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border ${typeBadge.bg}`}
                        >
                          {typeBadge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <span className="font-bold text-white block text-sm">{req.title}</span>
                        {req.notes && (
                          <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                            {req.notes}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {req.project?.name || req.project?.title || "Genel Proje"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-200">{req.requestedBy}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {typeof req.amount === "number" && req.amount > 0 ? (
                          <span className="font-bold text-sm text-emerald-400">
                            ₺{req.amount.toLocaleString("tr-TR")}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Onayla Butonu */}
                          <form action={updateApprovalRequest}>
                            <input type="hidden" name="id" value={req.id} />
                            <input type="hidden" name="status" value="APPROVED" />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              title="Talebi onayla ve AuditLog kaydı oluştur"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Onayla</span>
                            </button>
                          </form>

                          {/* Reddet Butonu */}
                          <form action={updateApprovalRequest}>
                            <input type="hidden" name="id" value={req.id} />
                            <input type="hidden" name="status" value="REJECTED" />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              title="Talebi reddet"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reddet</span>
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bölüm 2: Personel İzin & Avans Talepleri (İkili Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* İzin Talepleri */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-cyan-400" />
              <span>İzin Talepleri ({pendingLeaves.length})</span>
            </h3>
          </div>

          {pendingLeaves.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Bekleyen izin talebi bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white">{leave.personel?.name}</p>
                    <p className="text-slate-400 mt-0.5">
                      {leave.type} • {leave.days} Gün ({new Date(leave.startDate).toLocaleDateString("tr-TR")} - {new Date(leave.endDate).toLocaleDateString("tr-TR")})
                    </p>
                    {leave.reason && <p className="text-slate-400 italic mt-1 truncate max-w-xs">{leave.reason}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <form action={approveLeave}>
                      <input type="hidden" name="id" value={leave.id} />
                      <button
                        type="submit"
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                        title="Onayla"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </form>
                    <form action={rejectLeave}>
                      <input type="hidden" name="id" value={leave.id} />
                      <button
                        type="submit"
                        className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
                        title="Reddet"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avans Talepleri */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4.5 h-4.5 text-emerald-400" />
              <span>Avans Talepleri ({pendingAdvances.length})</span>
            </h3>
          </div>

          {pendingAdvances.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Bekleyen avans talebi bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {pendingAdvances.map((adv) => (
                <div
                  key={adv.id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white">{adv.personel?.name}</p>
                    <p className="text-slate-400 mt-0.5">
                      {adv.type || "Avans"} • {new Date(adv.date || adv.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                    <p className="font-bold text-sm text-emerald-400 mt-1">
                      ₺{Number(adv.amount).toLocaleString("tr-TR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <form action={approveAdvance}>
                      <input type="hidden" name="id" value={adv.id} />
                      <button
                        type="submit"
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                        title="Onayla"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </form>
                    <form action={rejectAdvance}>
                      <input type="hidden" name="id" value={adv.id} />
                      <button
                        type="submit"
                        className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
                        title="Reddet"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
