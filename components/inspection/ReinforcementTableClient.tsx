/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Demir & Kalıp Kontrol Tablosu İstemci Bileşeni (CRUD + Modal Entegrasyonu)
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Construction,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Plus,
  Eye,
  Building,
  UserCheck,
  Calendar,
  Ruler,
  Layers,
  FileCheck
} from "lucide-react";
import { toast } from "react-hot-toast";
import NewVisaModal from "@/components/inspection/NewVisaModal";
import VisaDetailModal from "@/components/inspection/VisaDetailModal";

interface VisaRecord {
  id: string;
  visaNo: string;
  projectId: string;
  inspectorId: string;
  elementName: string;
  reinforcementDetails: string;
  coverSpace: number;
  formworkStatus: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string | Date;
  project?: {
    id: string;
    name: string | null;
    title: string;
    yibfNo: string | null;
    location?: string | null;
  } | null;
  inspector?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function ReinforcementTableClient({
  initialVisas,
}: {
  initialVisas: VisaRecord[];
}) {
  const [visas, setVisas] = useState<VisaRecord[]>(initialVisas);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState<VisaRecord | null>(null);

  // Filtreleme
  const filtered = visas.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      v.visaNo.toLowerCase().includes(term) ||
      v.elementName.toLowerCase().includes(term) ||
      (v.project?.title && v.project.title.toLowerCase().includes(term)) ||
      (v.project?.name && v.project.name.toLowerCase().includes(term)) ||
      (v.project?.yibfNo && v.project.yibfNo.toLowerCase().includes(term)) ||
      (v.inspector?.name && v.inspector.name.toLowerCase().includes(term));
    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI Hesaplamaları
  const totalCount = visas.length;
  const approvedCount = visas.filter((v) => v.status === "APPROVED").length;
  const pendingCount = visas.filter((v) => v.status === "PENDING").length;
  const rejectedCount = visas.filter((v) => v.status === "REJECTED").length;

  const handleVisaCreated = (newVisa: any) => {
    setVisas((prev) => [newVisa, ...prev]);
  };

  const handleStatusUpdated = (updatedVisa: any) => {
    setVisas((prev) =>
      prev.map((v) => (v.id === updatedVisa.id ? { ...v, ...updatedVisa } : v))
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5" /> Döküm Onaylandı
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/80">
            <AlertTriangle className="w-3.5 h-3.5" /> Reddedildi (Kusurlu)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80">
            <Clock className="w-3.5 h-3.5" /> Muayene Bekliyor
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık & Yeni Vize Muayenesi Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Construction className="w-4 h-4" />
            <span>Statik Proje Uygunluk & Döküm İzinleri</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Demir & Kalıp Kontrol (Vize)</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Beton dökümü öncesinde donatı çapı, aralığı, paspayı ve kalıp rijitliği vize tutanakları (Prisma Bağlantılı)
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md hover:shadow-blue-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Vize Muayenesi</span>
        </button>
      </div>

      {/* KPI İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Toplam Vize Tutanağı</div>
          <div className="text-2xl font-bold text-white mt-1">{totalCount} Adet</div>
          <div className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Veritabanı Kayıtlı
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Onaylanan (Döküm İzni Verilen)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{approvedCount} Vize</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Beton mikseri çağrıldı</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Muayene / Karar Bekleyen</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount} Vize</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Saha denetçisi aksiyonu bekliyor</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-slate-400 text-xs font-medium">Reddedilen (Kusurlu İmalat)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{rejectedCount} Adet</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Revizyon ve düzeltme istendi</div>
        </div>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Vize No, Proje Adı, Yapı Elemanı veya Denetçi ara..."
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
            <option value="ALL">Tüm Durumlar ({visas.length})</option>
            <option value="APPROVED">Onaylananlar (Döküm İzni)</option>
            <option value="PENDING">Muayene Bekleyenler</option>
            <option value="REJECTED">Reddedilenler (Kusurlu)</option>
          </select>
        </div>
      </div>

      {/* Vize Listesi Tablosu */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Vize No / Eleman</th>
                <th className="py-3 px-4">Proje / YİBF</th>
                <th className="py-3 px-4">Donatı Çapları & Detay</th>
                <th className="py-3 px-4">Paspayı & Kalıp</th>
                <th className="py-3 px-4">Denetçi & Tarih</th>
                <th className="py-3 px-4">Vize Kararı</th>
                <th className="py-3 px-4 text-right">Eylem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="font-mono text-blue-400 text-xs">{item.visaNo}</div>
                    <div className="text-slate-200 font-medium mt-0.5">{item.elementName}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200 truncate max-w-xs">
                      {item.project?.title || item.project?.name || "Proje Bilgisi Yok"}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      YİBF: {item.project?.yibfNo || "—"}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-200 font-medium max-w-xs truncate">
                      {item.reinforcementDetails}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono text-emerald-400 font-semibold">{item.coverSpace} cm</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Kalıp: {item.formworkStatus}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-slate-200 font-medium">
                      {item.inspector?.name || "Saha Denetçisi"}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {getStatusBadge(item.status)}
                    {item.rejectionReason && (
                      <div className="text-[10px] text-rose-400 mt-1 truncate max-w-[150px]" title={item.rejectionReason}>
                        Kusur: {item.rejectionReason}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedVisa(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-blue-200 border border-blue-700/50 text-xs font-semibold transition cursor-pointer"
                        title="Tutanağı Aç & İncele"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Tutanağı Aç</span>
                      </button>

                      <Link
                        href={`/inspection/reinforcement/${item.id}`}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                        title="Ayrı Sayfada Aç"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Construction className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-medium">Kriterlere uygun vize tutanağı bulunamadı.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Yeni bir vize eklemek için "Yeni Vize Muayenesi" butonunu kullanabilirsiniz.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yeni Vize Muayenesi Modalı */}
      <NewVisaModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={handleVisaCreated}
      />

      {/* Vize Detay ve Onay/Red Modalı */}
      <VisaDetailModal
        visa={selectedVisa}
        isOpen={!!selectedVisa}
        onClose={() => setSelectedVisa(null)}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}
