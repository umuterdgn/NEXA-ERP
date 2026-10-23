/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * e-YİBF Merkezi Yönetim Paneli İstemci Bileşeni (Prisma)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Bot,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import TwoFactorModal from "@/components/rpa/TwoFactorModal";

interface YibfItem {
  id: string;
  yibfNo?: string | null;
  title: string;
  name?: string | null;
  location?: string | null;
  city?: string | null;
  district?: string | null;
  totalArea?: number | null;
  progress: number;
  status: string;
  createdAt: string | Date;
}

export default function YibfClientList({
  initialList,
}: {
  initialList: YibfItem[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [activeRpaSessionId, setActiveRpaSessionId] = useState("");

  const filteredList = initialList.filter((item) => {
    const term = searchTerm.toLowerCase();
    const yibf = (item.yibfNo || "").toLowerCase();
    const title = (item.title || item.name || "").toLowerCase();
    const loc = (item.location || `${item.city || ""} ${item.district || ""}`).toLowerCase();

    const matchesSearch = yibf.includes(term) || title.includes(term) || loc.includes(term);
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleGlobalSync = async () => {
    setIsSyncingAll(true);
    try {
      const res = await fetch("/api/yibf/rpa-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.requiresTwoFactor || data.status === "AWAITING_2FA") {
          setActiveRpaSessionId(data.sessionId);
          setTwoFactorModalOpen(true);
        } else {
          toast.success("Bakanlık e-YİBF portalıyla senkronize edildi!", { icon: "🏛️" });
        }
      } else {
        toast.error("Bakanlık bot senkronizasyonu başlatılamadı.");
      }
    } catch {
      toast.error("Bakanlık bağlantı servisine erişilemedi.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5" /> Devam Eden
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/80">
            <ShieldCheck className="w-3.5 h-3.5" /> İskanlı / Bitti
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80">
            <Clock className="w-3.5 h-3.5" /> Denetimde
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık & Eylemler */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Çevre, Şehircilik ve İklim Değişikliği Bakanlığı</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bakanlık e-YİBF Sistemi</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            4708 Sayılı Kanun Kapsamındaki Yapı Denetim Dosyaları ve YİBF Numaralı Yapı Kayıtları (Prisma)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGlobalSync}
            disabled={isSyncingAll}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? "animate-spin text-blue-400" : ""}`} />
            <span>{isSyncingAll ? "Senkronize Ediliyor..." : "e-YİBF Botunu Tetikle"}</span>
          </button>

          <Link
            href="/inspection/yibf-sync"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>e-YİBF Terminali</span>
          </Link>
        </div>
      </div>

      {/* KPI İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Toplam Kayıtlı Dosya</div>
          <div className="text-2xl font-bold text-white mt-1">{initialList.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>● Veritabanında aktif</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Aktif Yapılar</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {initialList.filter((x) => x.status === "ACTIVE").length}
          </div>
          <div className="text-[11px] text-blue-400 mt-1">Saha denetimleri sürüyor</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Tamamlanan Yapılar</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {initialList.filter((x) => x.status === "COMPLETED").length}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">İskan vizesi verildi</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">RPA Bot Durumu</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">Aktif & Hazır</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 2FA Servisi Devrede
          </div>
        </div>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="YİBF No, Proje Adı veya Konum ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="ALL">Tüm Durumlar ({initialList.length})</option>
            <option value="ACTIVE">Devam Edenler</option>
            <option value="COMPLETED">Tamamlananlar</option>
          </select>
        </div>
      </div>

      {/* YİBF Tablosu */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">YİBF No / Yapı Adı</th>
                <th className="py-3 px-4">Konum & Alan</th>
                <th className="py-3 px-4">İlerleme Seviyesi</th>
                <th className="py-3 px-4">Bakanlık Durumu</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredList.map((record) => {
                const loc = record.location || [record.city, record.district].filter(Boolean).join(" / ") || "—";
                const progressVal = Math.min(100, Math.max(0, Math.round(record.progress || 0)));

                return (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span className="font-mono text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/60">
                          {record.yibfNo ? `YİBF: ${record.yibfNo}` : "YİBF No Bekleniyor"}
                        </span>
                      </div>
                      <div className="text-slate-300 font-medium mt-1 truncate max-w-xs">
                        {record.title || record.name}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{loc}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {record.totalArea ? `${record.totalArea.toLocaleString("tr-TR")} m²` : "Alan girilmemiş"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                        <span>%{progressVal}</span>
                        <span className="text-slate-400">
                          Seviye: {Math.min(5, Math.floor(progressVal / 20) + 1)}
                        </span>
                      </div>
                      <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${progressVal}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(record.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/projects/${record.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-blue-200 border border-blue-700/50 text-xs font-semibold transition"
                      >
                        <span>Dosyayı Aç</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Kriterlere uygun YİBF kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        sessionId={activeRpaSessionId}
        onSuccess={() => {
          toast.success("e-YİBF Oturumu Doğrulandı!", { icon: "🎉" });
          setTwoFactorModalOpen(false);
        }}
      />
    </div>
  );
}
