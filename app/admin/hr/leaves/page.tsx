"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * 4857 Sayılı İş Kanunu Uyumlu İzin ve Avans Yönetimi Modülü (İK Yönetici Paneli)
 */

import React, { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  DollarSign,
  Plus,
  Filter,
  Search,
  Sparkles,
  ShieldCheck,
  Palmtree,
  CreditCard,
  LayoutGrid,
  List,
  Check,
  X,
  ChevronRight,
  Info,
  Building,
  Loader2
} from "lucide-react"
import { toast } from "react-hot-toast"
import {
  calculateLeaveDays,
  getLeaveRequestsAction,
  updateLeaveRequestStatusAction,
  createLeaveRequestAction,
  getAdvanceRequestsAction,
  updateAdvanceRequestStatusAction,
  createAdvanceRequestAction,
  getHrOverviewStatsAction
} from "@/app/actions/hr"

export default function HrLeavesAndAdvancesPage() {
  const [activeTab, setActiveTab] = useState<"leaves" | "advances">("leaves")
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)

  // Veri State'leri
  const [leaves, setLeaves] = useState<any[]>([])
  const [advances, setAdvances] = useState<any[]>([])
  const [stats, setStats] = useState({
    pendingLeaves: 0,
    approvedLeaves: 0,
    pendingAdvances: 0,
    approvedAdvanceTotal: 0
  })

  // Modallar
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Yeni İzin Formu State'leri
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "YILLIK",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    reason: "",
    userId: ""
  })
  const [leaveCalculation, setLeaveCalculation] = useState<{
    totalDays: number
    calendarDays: number
    sundaysCount: number
    holidaysCount: number
    holidaysList: Array<{ date: string; name: string }>
  } | null>(null)
  const [calculatingDays, setCalculatingDays] = useState(false)

  // Yeni Avans Formu State'leri
  const [advanceForm, setAdvanceForm] = useState({
    amount: "15000",
    deductMonth: new Date().toISOString().slice(0, 7), // Örn: "2026-10"
    reason: "",
    userId: ""
  })

  // Verileri yükle
  const loadData = async () => {
    setLoading(true)
    try {
      const [leavesRes, advancesRes, statsRes] = await Promise.all([
        getLeaveRequestsAction(),
        getAdvanceRequestsAction(),
        getHrOverviewStatsAction()
      ])

      if (leavesRes.success && leavesRes.leaves) {
        setLeaves(leavesRes.leaves)
      }
      if (advancesRes.success && advancesRes.advances) {
        setAdvances(advancesRes.advances)
      }
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats)
      }
    } catch (err) {
      console.error("Error loading HR data:", err)
      toast.error("Veriler yüklenirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Tarih değiştikçe 4857 İş Kanunu gününü otomatik hesapla
  useEffect(() => {
    if (!isLeaveModalOpen) return
    const runCalc = async () => {
      try {
        setCalculatingDays(true)
        const res = await calculateLeaveDays(leaveForm.startDate, leaveForm.endDate)
        setLeaveCalculation(res)
      } catch {
        setLeaveCalculation(null)
      } finally {
        setCalculatingDays(false)
      }
    }
    runCalc()
  }, [leaveForm.startDate, leaveForm.endDate, isLeaveModalOpen])

  // İzin Durumunu Güncelle
  const handleUpdateLeaveStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    setActionLoadingId(id)
    try {
      const res = await updateLeaveRequestStatusAction(id, newStatus)
      if (res.success) {
        toast.success(newStatus === "APPROVED" ? "İzin talebi onaylandı!" : "İzin talebi reddedildi.")
        setLeaves(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
        loadData()
      } else {
        toast.error(res.error || "İşlem başarısız.")
      }
    } catch {
      toast.error("İşlem sırasında hata oluştu.")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Avans Durumunu Güncelle
  const handleUpdateAdvanceStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    setActionLoadingId(id)
    try {
      const res = await updateAdvanceRequestStatusAction(id, newStatus)
      if (res.success) {
        toast.success(newStatus === "APPROVED" ? "Avans talebi onaylandı ve bordroya işlendi!" : "Avans talebi reddedildi.")
        setAdvances(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
        loadData()
      } else {
        toast.error(res.error || "İşlem başarısız.")
      }
    } catch {
      toast.error("İşlem sırasında hata oluştu.")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Yeni İzin Talebi Kaydet
  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await createLeaveRequestAction({
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason
      })

      if (res.success) {
        toast.success("İzin talebi 4857 İş Kanunu kurallarına göre hesaplanarak kaydedildi!", { icon: "🏖️" })
        setIsLeaveModalOpen(false)
        loadData()
      } else {
        toast.error(res.error || "İzin oluşturulamadı.")
      }
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.")
    }
  }

  // Yeni Avans Talebi Kaydet
  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await createAdvanceRequestAction({
        amount: parseFloat(advanceForm.amount),
        deductMonth: advanceForm.deductMonth,
        reason: advanceForm.reason
      })

      if (res.success) {
        toast.success("Avans talebi başarıyla oluşturuldu!", { icon: "💵" })
        setIsAdvanceModalOpen(false)
        loadData()
      } else {
        toast.error(res.error || "Avans oluşturulamadı.")
      }
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu.")
    }
  }

  // Filtreleme
  const filteredLeaves = leaves.filter(item => {
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter
    const nameStr = item.user?.name || item.personel?.name || "Personel"
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const filteredAdvances = advances.filter(item => {
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter
    const nameStr = item.user?.name || "Personel"
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.deductMonth && item.deductMonth.includes(searchQuery))
    return matchesStatus && matchesSearch
  })

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case "YILLIK":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Yıllık İzin</span>
      case "MAZERET":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Mazeret İzni</span>
      case "RAPORLU":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">Raporlu / Sağlık</span>
      case "UCRETSIZ":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Ücretsiz İzin</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">{type}</span>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Onaylandı</span>
      case "REJECTED":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"><XCircle className="w-3.5 h-3.5 text-rose-400" /> Reddedildi</span>
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"><Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Onay Bekliyor</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-8">
      
      {/* BAŞLIK & ÜST AKSİYONLAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>4857 Sayılı İş Kanunu ve Bordro Mahsubu Mimarisi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>İzin ve Avans Yönetimi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Personellerin kanuni iş gününe göre hesaplanan izin talepleri ile maaş bordrosundan kesilecek avans taleplerinin tek merkezden yönetimi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni İzin Talebi</span>
          </button>
          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all"
          >
            <DollarSign className="w-4 h-4" />
            <span>Yeni Avans Talebi</span>
          </button>
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Onay Bekleyen İzinler</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{stats.pendingLeaves}</p>
          <p className="text-[11px] text-slate-400 mt-1">4857 İş Kanunu onay sırasındaki talepler</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Onaylanan İzinler</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{stats.approvedLeaves}</p>
          <p className="text-[11px] text-slate-400 mt-1">İş takvimine işlenmiş onaylı kayıtlar</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Bekleyen Avanslar</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">{stats.pendingAdvances}</p>
          <p className="text-[11px] text-slate-400 mt-1">Maaş mahsubu bekleyen talepler</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Onaylanan Avans Toplamı</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3 font-mono">
            {stats.approvedAdvanceTotal.toLocaleString("tr-TR")} ₺
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Bordro kesintisine hazır toplam tutar</p>
        </div>
      </div>

      {/* SEKMELER & FİLTRELER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        
        {/* TAB SEÇİMİ */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab("leaves")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "leaves"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Palmtree className="w-4 h-4" />
            <span>İzin Talepleri ({leaves.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("advances")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "advances"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Avans Talepleri ({advances.length})</span>
          </button>
        </div>

        {/* FİLTRE VE ARAMA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Personel veya açıklama ara..."
              className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="PENDING">Onay Bekleyenler</option>
            <option value="APPROVED">Onaylananlar</option>
            <option value="REJECTED">Reddedilenler</option>
          </select>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg ${viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400"}`}
              title="Tablo Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg ${viewMode === "kanban" ? "bg-slate-800 text-white" : "text-slate-400"}`}
              title="Kanban Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* İÇERİK ALANI */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : activeTab === "leaves" ? (
        /* İZİN TALEPLERİ GÖRÜNÜMÜ */
        viewMode === "table" ? (
          /* TABLO (DATAGRID) GÖRÜNÜMÜ */
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="py-4 px-4">Personel</th>
                    <th className="py-4 px-4">İzin Türü</th>
                    <th className="py-4 px-4">Tarih Aralığı</th>
                    <th className="py-4 px-4">4857 Kanuni İş Günü</th>
                    <th className="py-4 px-4">Açıklama / Neden</th>
                    <th className="py-4 px-4">Durum</th>
                    <th className="py-4 px-4 text-right">Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map((leave) => {
                      const personName = leave.user?.name || leave.personel?.name || "Bilinmeyen Personel"
                      const personEmail = leave.user?.email || leave.personel?.position || "Şantiye Ekibi"
                      const totalWorkDays = leave.totalDays ?? leave.days ?? 1

                      return (
                        <tr key={leave.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs uppercase">
                                {personName.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{personName}</p>
                                <p className="text-xs text-slate-400">{personEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {getLeaveTypeBadge(leave.leaveType || leave.type || "YILLIK")}
                          </td>
                          <td className="py-4 px-4 font-mono text-xs text-slate-200">
                            <div className="space-y-0.5">
                              <div>{new Date(leave.startDate).toLocaleDateString("tr-TR")}</div>
                              <div className="text-slate-500 text-[11px]">→ {new Date(leave.endDate).toLocaleDateString("tr-TR")}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-950/60 text-blue-300 font-mono font-bold text-xs border border-blue-800/50">
                              <span>{totalWorkDays} İş Günü</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-sans">
                              (Pazar & Tatiller düşüldü)
                            </p>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-400 max-w-xs truncate">
                            {leave.reason || "Belirtilmedi"}
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(leave.status)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {leave.status === "PENDING" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleUpdateLeaveStatus(leave.id, "APPROVED")}
                                  disabled={actionLoadingId === leave.id}
                                  className="p-2 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/40 transition-all"
                                  title="İzni Onayla"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateLeaveStatus(leave.id, "REJECTED")}
                                  disabled={actionLoadingId === leave.id}
                                  className="p-2 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 transition-all"
                                  title="İzni Reddet"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 font-mono">İşlendi</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* KANBAN GÖRÜNÜMÜ */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["PENDING", "APPROVED", "REJECTED"] as const).map((colStatus) => {
              const colLeaves = filteredLeaves.filter((l) => l.status === colStatus)
              const colTitle =
                colStatus === "PENDING"
                  ? "Onay Bekleyenler"
                  : colStatus === "APPROVED"
                  ? "Onaylanan İzinler"
                  : "Reddedilenler"
              const colBorder =
                colStatus === "PENDING"
                  ? "border-amber-500/30"
                  : colStatus === "APPROVED"
                  ? "border-emerald-500/30"
                  : "border-rose-500/30"

              return (
                <div key={colStatus} className={`bg-slate-900/80 rounded-2xl border ${colBorder} p-4 space-y-4`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{colTitle}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300">
                        {colLeaves.length}
                      </span>
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {colLeaves.map((leave) => {
                      const personName = leave.user?.name || leave.personel?.name || "Personel"
                      const totalWorkDays = leave.totalDays ?? leave.days ?? 1

                      return (
                        <div key={leave.id} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-white text-sm">{personName}</p>
                              <p className="text-xs text-slate-400">{leave.user?.email || "Şantiye Görevlisi"}</p>
                            </div>
                            {getLeaveTypeBadge(leave.leaveType || leave.type || "YILLIK")}
                          </div>

                          <div className="p-2.5 bg-slate-900/60 rounded-lg text-xs space-y-1 font-mono">
                            <div className="text-slate-300 flex items-center justify-between">
                              <span>Tarih:</span>
                              <span>{new Date(leave.startDate).toLocaleDateString("tr-TR")} - {new Date(leave.endDate).toLocaleDateString("tr-TR")}</span>
                            </div>
                            <div className="text-blue-400 font-bold flex items-center justify-between">
                              <span>Kanuni İş Günü:</span>
                              <span>{totalWorkDays} Gün</span>
                            </div>
                          </div>

                          {leave.reason && (
                            <p className="text-xs text-slate-400 italic">&ldquo;{leave.reason}&rdquo;</p>
                          )}

                          {colStatus === "PENDING" && (
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
                              <button
                                onClick={() => handleUpdateLeaveStatus(leave.id, "APPROVED")}
                                disabled={actionLoadingId === leave.id}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Onayla</span>
                              </button>
                              <button
                                onClick={() => handleUpdateLeaveStatus(leave.id, "REJECTED")}
                                disabled={actionLoadingId === leave.id}
                                className="flex-1 py-2 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-bold border border-rose-500/40 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reddet</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* AVANS TALEPLERİ GÖRÜNÜMÜ */
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-4 px-4">Personel</th>
                  <th className="py-4 px-4">Talep Edilen Avans Tutarı</th>
                  <th className="py-4 px-4">Bordro Mahsup Ayı</th>
                  <th className="py-4 px-4">Talep Tarihi</th>
                  <th className="py-4 px-4">Gerekçe / Açıklama</th>
                  <th className="py-4 px-4">Durum</th>
                  <th className="py-4 px-4 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredAdvances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Avans talebi bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredAdvances.map((adv) => {
                    const personName = adv.user?.name || "Personel"
                    const personEmail = adv.user?.email || "Personel Hesabı"

                    return (
                      <tr key={adv.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-300 font-bold text-xs uppercase">
                              {personName.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{personName}</p>
                              <p className="text-xs text-slate-400">{personEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-base font-black font-mono text-emerald-400">
                            {Number(adv.amount).toLocaleString("tr-TR")} ₺
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                            {adv.deductMonth} Bordrosu
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-400">
                          {new Date(adv.createdAt).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-400 max-w-xs truncate">
                          {adv.reason || "Maaş avansı"}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(adv.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {adv.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdateAdvanceStatus(adv.id, "APPROVED")}
                                disabled={actionLoadingId === adv.id}
                                className="p-2 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/40 transition-all"
                                title="Avansı Onayla & Bordroya İşle"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateAdvanceStatus(adv.id, "REJECTED")}
                                disabled={actionLoadingId === adv.id}
                                className="p-2 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 transition-all"
                                title="Avansı Reddet"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">Bordroya Aktarıldı</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* YENİ İZİN TALEBİ MODALI (4857 İŞ KANUNU HESAPLAYICILI) */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-blue-950 text-blue-300 border border-blue-800 mb-2">
                <Palmtree className="w-3.5 h-3.5 text-blue-400" />
                <span>4857 Sayılı Kanun Uyumlu İzin Başvurusu</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">Yeni İzin Talebi Oluştur</h2>
            </div>

            <form onSubmit={handleCreateLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">İzin Türü</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="YILLIK">Yıllık Ücretli İzin (Madde 53)</option>
                  <option value="MAZERET">Mazeret İzni (Evlilik / Doğum / Vefat)</option>
                  <option value="RAPORLU">Hastalık / İstirahat Raporu</option>
                  <option value="UCRETSIZ">Ücretsiz İzin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono"
                    required
                  />
                </div>
              </div>

              {/* ANLIK 4857 İŞ KANUNU HESAPLAMA PANELİ */}
              {calculatingDays ? (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Kanuni tatil günleri taranıyor...</span>
                </div>
              ) : leaveCalculation ? (
                <div className="p-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-950 border border-blue-800/50 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>4857 Kanuni İzin Süresi:</span>
                    </span>
                    <span className="text-lg font-black font-mono text-white">
                      {leaveCalculation.totalDays} İş Günü
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span>Takvim Gün Sayısı:</span>
                      <span className="font-mono text-slate-300">{leaveCalculation.calendarDays} gün</span>
                    </div>
                    {leaveCalculation.sundaysCount > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Düşülen Hafta Tatili (Pazar):</span>
                        <span className="font-mono">-{leaveCalculation.sundaysCount} gün</span>
                      </div>
                    )}
                    {leaveCalculation.holidaysCount > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>Düşülen Resmi Tatiller:</span>
                        <span className="font-mono">-{leaveCalculation.holidaysCount} gün</span>
                      </div>
                    )}
                    {leaveCalculation.holidaysList.length > 0 && (
                      <div className="text-[10px] text-rose-300 font-medium">
                        Çakışan Tatiller: {leaveCalculation.holidaysList.map(h => h.name).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Talep Nedeni / Not</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="İzin gerekçesini belirtin..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm resize-none h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30"
                >
                  Talebi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YENİ AVANS TALEBİ MODALI */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setIsAdvanceModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Maaş Avansı & Bordro Mahsubu</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">Yeni Avans Talebi Oluştur</h2>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Talep Edilen Avans Tutarı (₺) *</label>
                <input
                  type="number"
                  step="100"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  placeholder="Örn: 15000"
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-lg font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Mahsup Edilecek Bordro Ayı *</label>
                <input
                  type="month"
                  value={advanceForm.deductMonth}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, deductMonth: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Onaylandığında bu ayın bordrosundan otomatik kesinti kalemi olarak işlenecektir.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Talep Gerekçesi</label>
                <textarea
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="Avans talep gerekçesi..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm resize-none h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  Avansı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
