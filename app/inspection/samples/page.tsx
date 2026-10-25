/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Yapı Denetim - Karot & Numune QR Takip Zinciri
 */

"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  TestTube,
  QrCode,
  Search,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  Building2,
  MapPin,
  User,
  Calendar,
  RefreshCw,
  FileText,
  Scan,
  ShieldCheck,
  Sparkles,
  Filter,
  Check,
  Copy,
  Layers,
  FlaskConical,
  X,
  Bot
} from "lucide-react";
import { toast } from "react-hot-toast";
import TwoFactorModal from "@/components/rpa/TwoFactorModal";

interface CoreSampleItem {
  id: string;
  qrCode: string;
  projectId: string;
  takenById: string;
  location: string;
  status: "TAKEN" | "IN_LAB" | "TESTED" | string;
  takenAt: string;
  testedAt?: string | null;
  resultStrength?: number | null;
  isPassed?: boolean | null;
  reportFileUrl?: string | null;
  notes?: string | null;
  project?: {
    id: string;
    title?: string;
    name?: string;
    yibfNo?: string;
    city?: string;
    district?: string;
  };
  takenBy?: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

interface ProjectOption {
  id: string;
  title: string;
  yibfNo?: string;
  address?: string;
}

export default function CoreSamplesPage() {
  const router = useRouter();

  const [samples, setSamples] = useState<CoreSampleItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingYibf, setSyncingYibf] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [activeRpaSessionId, setActiveRpaSessionId] = useState("");

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Barcode / Scanner Search input (Adım 3)
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanningStatus, setScanningStatus] = useState(false);

  // Modal: New Sample Form
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [creatingSample, setCreatingSample] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "",
    location: "",
    concreteClass: "C30/37",
    notes: "",
  });

  // Modal: QR Print / View Sticker
  const [selectedSampleForQr, setSelectedSampleForQr] = useState<CoreSampleItem | null>(null);
  const [copiedQr, setCopiedQr] = useState(false);

  const qrPrintRef = useRef<HTMLDivElement>(null);

  // Load samples and projects
  const fetchSamples = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inspection/samples");
      if (res.ok) {
        const data = await res.json();
        setSamples(data);
      } else {
        toast.error("Numune listesi yüklenemedi");
      }
    } catch (err) {
      console.error("fetchSamples err:", err);
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.projects || [];
        setProjects(
          list.map((p: any) => ({
            id: p.id,
            title: p.title || p.name || `Proje #${p.id.slice(0, 6)}`,
            yibfNo: p.yibfNo || "14582",
            address: p.address || p.city || "İstanbul",
          }))
        );
        if (list.length > 0 && !formData.projectId) {
          setFormData((prev) => ({ ...prev, projectId: list[0].id }));
        }
      }
    } catch (err) {
      console.error("fetchProjects err:", err);
    }
  };

  useEffect(() => {
    fetchSamples();
    fetchProjects();
  }, []);

  // Filtered samples
  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.qrCode?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.project?.title?.toLowerCase().includes(q) ||
        s.project?.name?.toLowerCase().includes(q) ||
        s.project?.yibfNo?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [samples, statusFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = samples.length;
    const taken = samples.filter((s) => s.status === "TAKEN").length;
    const inLab = samples.filter((s) => s.status === "IN_LAB").length;
    const tested = samples.filter((s) => s.status === "TESTED").length;
    const passed = samples.filter((s) => s.status === "TESTED" && s.isPassed === true).length;
    const failed = samples.filter((s) => s.status === "TESTED" && s.isPassed === false).length;
    const passRate = tested > 0 ? Math.round((passed / tested) * 100) : 100;
    return { total, taken, inLab, tested, passed, failed, passRate };
  }, [samples]);

  // Handle "Barkod Okut / Durum Güncelle" (Adım 3)
  const handleBarcodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) {
      toast.error("Lütfen bir QR/Barkod kodu girin veya okutun");
      return;
    }

    setScanningStatus(true);
    try {
      // Find sample by QR or ID and update to IN_LAB
      const res = await fetch(`/api/inspection/samples/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_LAB" }),
      });

      if (res.ok) {
        const updated = await res.json();
        toast.success(`Numune "${updated.qrCode}" Laboratuvara Kabul Edildi (IN_LAB)!`, {
          icon: "🧪",
          duration: 4000,
        });
        setBarcodeInput("");
        fetchSamples();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || `"${code}" kodlu numune bulunamadı`);
      }
    } catch (err) {
      console.error("Barcode scan err:", err);
      toast.error("İşlem sırasında bağlantı hatası oluştu");
    } finally {
      setScanningStatus(false);
    }
  };

  // Quick Action to transition TAKEN -> IN_LAB
  const handleQuickAcceptToLab = async (idOrQr: string) => {
    try {
      const res = await fetch(`/api/inspection/samples/${encodeURIComponent(idOrQr)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_LAB" }),
      });
      if (res.ok) {
        toast.success("Numune laboratuvara kabul edildi (IN_LAB)");
        fetchSamples();
      } else {
        toast.error("Durum güncellenemedi");
      }
    } catch (err) {
      toast.error("İşlem başarısız");
    }
  };

  // Create new sample (Adım 3)
  const handleCreateSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      toast.error("Lütfen şantiye / proje seçin");
      return;
    }
    if (!formData.location.trim()) {
      toast.error("Lütfen numunenin alındığı yapı elemanını (konum) belirtin");
      return;
    }

    setCreatingSample(true);
    try {
      const res = await fetch("/api/inspection/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formData.projectId,
          location: formData.location.trim(),
          notes: `${formData.concreteClass ? `Beton Sınıfı: ${formData.concreteClass}. ` : ""}${formData.notes}`.trim(),
        }),
      });

      if (res.ok) {
        const newSample = await res.json();
        toast.success("Yeni numune oluşturuldu ve karekod atandı!", { icon: "✅" });
        setIsNewModalOpen(false);
        setFormData({
          projectId: projects[0]?.id || "",
          location: "",
          concreteClass: "C30/37",
          notes: "",
        });
        fetchSamples();
        // Immediately show QR modal for printing
        setSelectedSampleForQr(newSample);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Numune oluşturulamadı");
      }
    } catch (err) {
      console.error("Create sample err:", err);
      toast.error("Bağlantı hatası");
    } finally {
      setCreatingSample(false);
    }
  };

  // YİBF Senkronize Et butonu (E-Devlet RPA ve 2FA Entegrasyonu)
  const handleSyncYibf = async () => {
    setSyncingYibf(true);
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
          toast.success(data.message || "Bakanlık e-YİBF sistemiyle senkronize edildi!", {
            icon: "🏛️",
            duration: 4500,
          });
          fetchSamples();
          fetchProjects();
        }
      } else {
        toast.error("YİBF senkronizasyonu başlatılamadı");
      }
    } catch (err) {
      toast.error("Bakanlık botuna ulaşılamadı");
    } finally {
      setSyncingYibf(false);
    }
  };

  // Print Label Handler
  const handlePrintLabel = () => {
    if (!qrPrintRef.current) return;
    const printContents = qrPrintRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>NEXA ERP - Numune QR Etiketi</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                margin: 0;
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fff;
                color: #000;
              }
              .label-card {
                width: 320px;
                border: 2px solid #000;
                padding: 16px;
                border-radius: 8px;
                text-align: center;
              }
              .header {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
                border-bottom: 1px solid #ccc;
                padding-bottom: 6px;
                margin-bottom: 12px;
              }
              .qr-box {
                margin: 8px auto;
                display: flex;
                justify-content: center;
              }
              .code-text {
                font-size: 14px;
                font-weight: 800;
                letter-spacing: 1.5px;
                margin-top: 6px;
                font-family: monospace;
              }
              .meta {
                margin-top: 10px;
                font-size: 11px;
                text-align: left;
                line-height: 1.5;
                border-top: 1px dashed #aaa;
                padding-top: 8px;
              }
            </style>
          </head>
          <body>
            <div class="label-card">
              <div class="header">T.C. ÇEVRE VE ŞEHİRCİLİK BAKANLIĞI<br/>YAPI DENETİM KAROT NUMUNESİ</div>
              <div class="qr-box">
                ${qrPrintRef.current.querySelector("svg")?.outerHTML || ""}
              </div>
              <div class="code-text">${selectedSampleForQr?.qrCode || ""}</div>
              <div class="meta">
                <strong>Proje:</strong> ${selectedSampleForQr?.project?.title || selectedSampleForQr?.project?.name || "-"}<br/>
                <strong>YİBF No:</strong> ${selectedSampleForQr?.project?.yibfNo || "-"}<br/>
                <strong>Konum:</strong> ${selectedSampleForQr?.location || "-"}<br/>
                <strong>Tarih:</strong> ${new Date(selectedSampleForQr?.takenAt || Date.now()).toLocaleDateString("tr-TR")} ${new Date(selectedSampleForQr?.takenAt || Date.now()).toLocaleTimeString("tr-TR")}<br/>
                <strong>Denetçi:</strong> ${selectedSampleForQr?.takenBy?.name || "Yetkili Denetçi"}
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  const copyQrCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedQr(true);
    toast.success("Barkod panoya kopyalandı");
    setTimeout(() => setCopiedQr(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
      {/* Top Header / Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Yapı Denetim Operasyonları</span>
                <span className="text-slate-600">•</span>
                <span>Laboratuvar & Saha Takip</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
                <FlaskConical className="w-7 h-7 text-cyan-400" />
                <span>Karot & Numune QR Takip Zinciri</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Sahadan laboratuvara numune etiketleme, fiziksel karekod basımı ve akıllı OCR test kırım sonuçları
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              {/* YİBF Senkronize Et butonu (Adım 2) */}
              <button
                onClick={handleSyncYibf}
                disabled={syncingYibf}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title="Çevre ve Şehircilik Bakanlığı e-YİBF sistemini simüle eder ve günceller"
              >
                <Bot className={`w-4 h-4 text-amber-400 ${syncingYibf ? "animate-spin" : ""}`} />
                <span>{syncingYibf ? "Bakanlık Senkronize Ediliyor..." : "YİBF Senkronize Et"}</span>
              </button>

              {/* Rota ve Harita linkleri */}
              <Link
                href="/dispatch"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all hover:text-white"
              >
                <span>Saha Rota Haritası</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Yeni Numune Ekle Butonu (Adım 3) */}
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-cyan-500/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Numune Al</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Toplam Numune</span>
              <TestTube className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.total}</div>
            <div className="text-[11px] text-slate-500 mt-1">Sistemdeki tüm kayıtlar</div>
          </div>

          <div className="bg-slate-900/70 border border-amber-900/30 rounded-2xl p-4 sm:p-5 hover:border-amber-700/50 transition-all">
            <div className="flex items-center justify-between text-amber-400 text-xs font-medium mb-2">
              <span>Sahada Alındı</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{stats.taken}</div>
            <div className="text-[11px] text-amber-500/80 mt-1">Laboratuvara sevkiyat bekliyor</div>
          </div>

          <div className="bg-slate-900/70 border border-blue-900/30 rounded-2xl p-4 sm:p-5 hover:border-blue-700/50 transition-all">
            <div className="flex items-center justify-between text-blue-400 text-xs font-medium mb-2">
              <span>Laboratuvarda</span>
              <FlaskConical className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">{stats.inLab}</div>
            <div className="text-[11px] text-blue-500/80 mt-1">Kür havuzunda / test aşamasında</div>
          </div>

          <div className="bg-slate-900/70 border border-emerald-900/30 rounded-2xl p-4 sm:p-5 hover:border-emerald-700/50 transition-all">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-2">
              <span>Kırım Yapıldı</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{stats.tested}</div>
            <div className="text-[11px] text-emerald-500/80 mt-1">{stats.passed} Uygun • {stats.failed} Red</div>
          </div>

          <div className="bg-slate-900/70 border border-cyan-900/30 rounded-2xl p-4 sm:p-5 col-span-2 sm:col-span-1 hover:border-cyan-700/50 transition-all">
            <div className="flex items-center justify-between text-cyan-400 text-xs font-medium mb-2">
              <span>Dayanım Başarısı</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300">%{stats.passRate}</div>
            <div className="text-[11px] text-cyan-500/80 mt-1">Şartnameye uygun numuneler</div>
          </div>
        </div>

        {/* Adım 3: Laboratuvar Kabul & Hızlı Barkod Okuma Arama Çubuğu */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Scan className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Laboratuvar Kabul & Barkod Okutma İstasyonu</span>
                  <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    ADIM 3: IN_LAB
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Sahadan gelen numunenin üzerindeki karekodu barkod okuyucu veya klavye ile okutarak doğrudan laboratuvara kabul edin.
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-400 font-mono">Format: SMP-14582-XXX-XXXX</span>
            </div>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <QrCode className="w-5 h-5 text-blue-400" />
              </div>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Numune QR barkodunu okutun veya yazın (Örn: SMP-14582-K3-9421)..."
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-blue-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm tracking-wide shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={scanningStatus}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {scanningStatus ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>İşleniyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Laboratuvara Kabul Et (IN_LAB)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Main Content: Filter Bar & Table of Samples */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          {/* Controls Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-xs font-medium">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "ALL"
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Tümü ({samples.length})
              </button>
              <button
                onClick={() => setStatusFilter("TAKEN")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "TAKEN"
                    ? "bg-amber-600 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-amber-300"
                }`}
              >
                Sahada Alındı ({stats.taken})
              </button>
              <button
                onClick={() => setStatusFilter("IN_LAB")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "IN_LAB"
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-blue-300"
                }`}
              >
                Laboratuvarda ({stats.inLab})
              </button>
              <button
                onClick={() => setStatusFilter("TESTED")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "TESTED"
                    ? "bg-emerald-600 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-emerald-300"
                }`}
              >
                Kırım Yapıldı ({stats.tested})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="QR Kod, Yapı Elemanı veya Şantiye ara..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Table / List */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mb-3" />
              <p className="text-sm">Numune veritabanı yükleniyor...</p>
            </div>
          ) : filteredSamples.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <FlaskConical className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">Numune Bulunamadı</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Arama kriterlerinize uyan karot kaydı bulunamadı veya henüz sahada numune oluşturulmadı.
              </p>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>İlk Numuneyi Ekle</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3.5 px-4 font-semibold">QR Barkod / Kimlik</th>
                    <th className="py-3.5 px-4 font-semibold">Şantiye & YİBF</th>
                    <th className="py-3.5 px-4 font-semibold">Numune Konumu (Eleman)</th>
                    <th className="py-3.5 px-4 font-semibold">Durum</th>
                    <th className="py-3.5 px-4 font-semibold">Kırım Dayanımı (MPa)</th>
                    <th className="py-3.5 px-4 font-semibold">Tarih & Denetçi</th>
                    <th className="py-3.5 px-4 font-semibold text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredSamples.map((sample) => {
                    const isTaken = sample.status === "TAKEN";
                    const isInLab = sample.status === "IN_LAB";
                    const isTested = sample.status === "TESTED";

                    return (
                      <tr
                        key={sample.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* QR & Barcode */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setSelectedSampleForQr(sample)}
                              className="p-1.5 bg-white rounded-lg shadow-sm hover:scale-105 transition-transform flex-shrink-0"
                              title="Karekod Etiketini Büyüt & Yazdır"
                            >
                              <QRCodeSVG value={sample.qrCode} size={36} level="M" />
                            </button>
                            <div>
                              <div className="font-mono text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1.5">
                                <span>{sample.qrCode}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">Fiziksel Etiketli</span>
                            </div>
                          </div>
                        </td>

                        {/* Project & YİBF */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white text-xs sm:text-sm">
                            {sample.project?.title || sample.project?.name || "İnşaat Projesi"}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              YİBF #{sample.project?.yibfNo || "14582"}
                            </span>
                            {sample.project?.city && (
                              <span className="text-[11px] text-slate-500">
                                {sample.project?.city}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                            <Layers className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <span>{sample.location}</span>
                          </div>
                          {sample.notes && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                              {sample.notes}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isTaken && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>Sahada Alındı</span>
                            </span>
                          )}
                          {isInLab && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                              <span>Laboratuvarda</span>
                            </span>
                          )}
                          {isTested && (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                sample.isPassed
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/10 text-red-400 border border-red-500/30"
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{sample.isPassed ? "Test Edildi (PASS)" : "Test Edildi (FAIL)"}</span>
                            </span>
                          )}
                        </td>

                        {/* Result Strength */}
                        <td className="py-3.5 px-4">
                          {sample.resultStrength !== null && sample.resultStrength !== undefined ? (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="font-extrabold text-sm text-white">
                                  {sample.resultStrength}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">MPa</span>
                              </div>
                              <span
                                className={`text-[10px] font-bold tracking-wider ${
                                  sample.isPassed ? "text-emerald-400" : "text-red-400"
                                }`}
                              >
                                {sample.isPassed ? "✓ ONAYLANDI" : "✕ YETERSİZ"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Henüz Kırılmadı</span>
                          )}
                        </td>

                        {/* Taken At & Inspector */}
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          <div>{new Date(sample.takenAt).toLocaleDateString("tr-TR")}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {sample.takenBy?.name || "Denetçi"}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isTaken && (
                              <button
                                onClick={() => handleQuickAcceptToLab(sample.id)}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all"
                                title="Laboratuvara Kabul Et"
                              >
                                Laboratuvara Al
                              </button>
                            )}

                            {/* Detay & OCR Sayfasına Git (Adım 4) */}
                            <Link
                              href={`/inspection/samples/${sample.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-all hover:border-cyan-500/50"
                              title="Laboratuvar Raporu & AI OCR Detayı"
                            >
                              <span>Rapor / OCR</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => setSelectedSampleForQr(sample)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                              title="Karekod Etiketi"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: YENİ NUMUNE EKLEME FORMU (Adım 3) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sahada Yeni Numune Alımı</h3>
                <p className="text-xs text-slate-400">
                  Benzersiz QR barkod otomatik oluşturulup etiket basımı için hazırlanacaktır.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSample} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Şantiye / Yapı (YİBF Projesi) *
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="" disabled>
                    Şantiye seçiniz...
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (YİBF #{p.yibfNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Numunenin Alındığı Yapı Elemanı / Konum *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Örn: A Blok, 3. Kat Kolon C4 veya Temel Radye Aks 2-B"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tasarım Beton Sınıfı
                  </label>
                  <select
                    value={formData.concreteClass}
                    onChange={(e) => setFormData({ ...formData, concreteClass: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="C20/25">C20/25 (20 MPa)</option>
                    <option value="C25/30">C25/30 (25 MPa)</option>
                    <option value="C30/37">C30/37 (30 MPa - Standart)</option>
                    <option value="C35/45">C35/45 (35 MPa)</option>
                    <option value="C40/50">C40/50 (40 MPa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    İlk Durum
                  </label>
                  <div className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>TAKEN (Sahada Alındı)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Denetçi Notları & İrsaliye Bilgisi
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Slump değeri (örn: 16cm), mikser irsaliye no, hava sıcaklığı vb."
                  rows={3}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creatingSample}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                >
                  {creatingSample ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Kaydet & Karekod Üret</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KAREKOD ETİKET YAZDIRMA & GÖSTERİM (Adım 3) */}
      {selectedSampleForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedSampleForQr(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full">
                Fiziksel Numune Karekod Etiketi
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Etiket Yazıcısı Çıktısı</h3>
              <p className="text-xs text-slate-400 mt-1">
                Bu karekod etiketini yazdırıp taze beton / karot numunesinin üzerine yapıştırın.
              </p>
            </div>

            {/* Print Card Container */}
            <div
              ref={qrPrintRef}
              className="bg-white text-slate-950 p-6 rounded-2xl shadow-inner border-2 border-slate-300 text-center space-y-3"
            >
              <div className="border-b border-slate-300 pb-2">
                <div className="text-[10px] font-extrabold tracking-wider uppercase text-slate-600">
                  T.C. ÇEVRE VE ŞEHİRCİLİK BAKANLIĞI
                </div>
                <div className="text-xs font-bold text-slate-900">
                  YAPI DENETİM KAROT NUMUNE ETİKETİ
                </div>
              </div>

              {/* QR Code SVG */}
              <div className="flex justify-center p-2 bg-slate-50 rounded-xl border border-slate-200">
                <QRCodeSVG
                  value={selectedSampleForQr.qrCode}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Barcode String */}
              <div className="font-mono text-base font-extrabold tracking-wider text-slate-900 bg-slate-100 py-1.5 rounded-lg border border-slate-300">
                {selectedSampleForQr.qrCode}
              </div>

              {/* Metadata */}
              <div className="text-left text-[11px] leading-relaxed text-slate-700 border-t border-dashed border-slate-300 pt-2.5 space-y-1">
                <div>
                  <strong className="text-slate-900">Proje:</strong>{" "}
                  {selectedSampleForQr.project?.title || selectedSampleForQr.project?.name || "Şantiye"}
                </div>
                <div>
                  <strong className="text-slate-900">YİBF No:</strong>{" "}
                  {selectedSampleForQr.project?.yibfNo || "14582"}
                </div>
                <div>
                  <strong className="text-slate-900">Konum / Eleman:</strong>{" "}
                  {selectedSampleForQr.location}
                </div>
                <div>
                  <strong className="text-slate-900">Alındığı Tarih:</strong>{" "}
                  {new Date(selectedSampleForQr.takenAt).toLocaleDateString("tr-TR")}{" "}
                  {new Date(selectedSampleForQr.takenAt).toLocaleTimeString("tr-TR")}
                </div>
                <div>
                  <strong className="text-slate-900">Denetçi:</strong>{" "}
                  {selectedSampleForQr.takenBy?.name || "Yetkili Denetçi"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePrintLabel}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Etiketi Yazdır</span>
                </button>
                <button
                  onClick={() => copyQrCode(selectedSampleForQr.qrCode)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs sm:text-sm border border-slate-700 transition-all active:scale-95"
                >
                  {copiedQr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>Kodu Kopyala</span>
                </button>
              </div>

              <Link
                href={`/inspection/samples/${selectedSampleForQr.id}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs sm:text-sm font-semibold transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Test Raporu Yükleme & OCR Sayfasına Git</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* E-Devlet 2FA Onay Modali (Adım 4) */}
      <TwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        sessionId={activeRpaSessionId}
        onSuccess={() => {
          toast.success("Veriler Başarıyla Çekildi!", { icon: "✅" });
          fetchSamples();
          fetchProjects();
        }}
      />
    </div>
  );
}
