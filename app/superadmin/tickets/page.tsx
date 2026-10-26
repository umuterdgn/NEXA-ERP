/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Superadmin Helpdesk & Destek Talepleri (/superadmin/tickets)
 */

"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  LifeBuoy,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Building2,
  Send,
  X,
  ExternalLink,
  Loader2,
  RefreshCw,
  User,
  ShieldAlert,
} from "lucide-react"
import toast from "react-hot-toast"

interface SupportTicketItem {
  id: string
  tenantId: string
  userId: string
  subject: string
  message: string
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  response?: string | null
  createdAt: string
  updatedAt: string
  tenant?: {
    id: string
    name: string
    type: string
    subscriptionPlan: string
  }
}

export default function SuperadminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")

  // Modal / Detay State
  const [activeTicket, setActiveTicket] = useState<SupportTicketItem | null>(null)
  const [responseText, setResponseText] = useState("")
  const [submittingResponse, setSubmittingResponse] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/superadmin/tickets")
      const result = await res.json()
      if (result.success) {
        setTickets(result.data)
      } else {
        toast.error("Destek biletleri alınamadı")
      }
    } catch {
      toast.error("Ağ hatası")
    } finally {
      setLoading(false)
    }
  }

  // Bilet açıldığında yanıt taslağını doldur
  const handleOpenTicket = (ticket: SupportTicketItem) => {
    setActiveTicket(ticket)
    setResponseText(ticket.response || "")
  }

  // Yanıt gönder ve statü güncelle
  const handleResolveTicket = async (targetStatus: "IN_PROGRESS" | "RESOLVED" | "OPEN") => {
    if (!activeTicket) return

    setSubmittingResponse(true)
    try {
      const res = await fetch("/api/superadmin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeTicket.id,
          status: targetStatus,
          response: responseText,
        }),
      })

      const result = await res.json()
      if (result.success) {
        toast.success(
          targetStatus === "RESOLVED"
            ? "Bilet başarıyla çözüldü ve yanıt müşteriye iletildi!"
            : "Bilet durumu güncellendi."
        )
        setActiveTicket(null)
        fetchTickets()
      } else {
        toast.error(result.error || "Güncelleme başarısız")
      }
    } catch {
      toast.error("İşlem hatası")
    } finally {
      setSubmittingResponse(false)
    }
  }

  // KPI'lar
  const openCount = tickets.filter((t) => t.status === "OPEN").length
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length
  const urgentCount = tickets.filter((t) => (t.priority === "HIGH" || t.priority === "URGENT") && t.status !== "RESOLVED").length

  // Filtreleme
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.tenant?.name && t.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "ALL" ? true : t.status === statusFilter
    const matchesPriority = priorityFilter === "ALL" ? true : t.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <LifeBuoy className="h-7 w-7 text-purple-400" />
            Destek Merkezi & Helpdesk
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Müşteri kuruluşlardan (Tenantlar) gelen teknik ve operasyonel taleplerin merkezi yönetimi
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Açık / Bekleyen Talepler</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{openCount}</span>
            <span className="text-xs text-rose-400 font-medium">İnceleme Bekliyor</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">İşleme Alınanlar</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-300">{inProgressCount}</span>
            <span className="text-xs text-slate-400">Geliştirici İncelemesinde</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Çözümlenen Talepler</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">{resolvedCount}</span>
            <span className="text-xs text-emerald-300">Başarıyla Kapatıldı</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Yüksek Öncelikli</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-purple-400">{urgentCount}</span>
            <span className="text-xs text-purple-300">Kritik SLA</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Konu, mesaj veya firma ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Statü:
          </span>
          {[
            { key: "ALL", label: "Tümü" },
            { key: "OPEN", label: "Açık" },
            { key: "IN_PROGRESS", label: "İşlemde" },
            { key: "RESOLVED", label: "Çözüldü" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                statusFilter === f.key
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-500 mb-2" />
            Destek biletleri yükleniyor...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            Filtrelere uygun destek talebi bulunamadı.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isResolved = ticket.status === "RESOLVED"
            const isOpen = ticket.status === "OPEN"

            return (
              <div
                key={ticket.id}
                onClick={() => handleOpenTicket(ticket)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/40 transition-all cursor-pointer shadow-lg group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Statü Badge */}
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          isResolved
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                            : isOpen
                            ? "bg-rose-950/80 text-rose-300 border border-rose-500/40"
                            : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {ticket.status === "RESOLVED"
                          ? "✓ Çözüldü"
                          : ticket.status === "OPEN"
                          ? "● Açık Talep"
                          : "◐ İşlemde"}
                      </span>

                      {/* Öncelik Badge */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                          ticket.priority === "URGENT" || ticket.priority === "HIGH"
                            ? "bg-rose-900/40 text-rose-300 border border-rose-700/50"
                            : ticket.priority === "MEDIUM"
                            ? "bg-amber-900/40 text-amber-300 border border-amber-700/50"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {ticket.priority}
                      </span>

                      {/* Firma Adı */}
                      {ticket.tenant && (
                        <span className="text-xs text-purple-300 font-medium flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {ticket.tenant.name}
                        </span>
                      )}

                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(ticket.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                      {ticket.subject}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {ticket.message}
                    </p>
                  </div>

                  <div className="sm:self-center shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenTicket(ticket)
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 transition flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Yanıtla / İncele
                    </button>
                  </div>
                </div>

                {/* Eğer çözüm yanıtı varsa önizleme */}
                {ticket.response && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs text-emerald-400/90 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/20">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-300">Superadmin Çözüm Notu:</span>{" "}
                      {ticket.response}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Yanıt / Çözüm Modalı */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 font-semibold">
                    Destek Bileti #{activeTicket.id.slice(-6)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {activeTicket.tenant?.name}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  {activeTicket.subject}
                </h2>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Müşteri Mesajı */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Müşteri Mesajı
                </span>
                <span className="font-mono">
                  {new Date(activeTicket.createdAt).toLocaleString("tr-TR")}
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {activeTicket.message}
              </p>
            </div>

            {/* Superadmin Yanıt Formu */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Superadmin Yanıtı & Çözüm Metni
              </label>
              <textarea
                rows={4}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Müşteriye iletilecek teknik açıklama veya çözüm notunu buraya yazın..."
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Modal Aksiyon Butonları */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResolveTicket("IN_PROGRESS")}
                  disabled={submittingResponse}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 transition"
                >
                  İşlemde Yap
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveTicket("OPEN")}
                  disabled={submittingResponse}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Açık Bırak
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveTicket("RESOLVED")}
                  disabled={submittingResponse || !responseText.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingResponse ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Yanıtla & Çözüldü İşaretle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
