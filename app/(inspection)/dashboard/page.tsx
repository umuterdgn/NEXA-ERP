/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import React from "react";
import { Building, ClipboardCheck, AlertTriangle, FileText, TrendingUp, Users, CheckCircle, Clock, Zap, Lightbulb } from "lucide-react";

export default function InspectionDashboard() {
  // Statik KPI verileri (gerçek API entegrasyonu yapılacak)
  const kpiData = {
    activeBuildings: 24,
    todayInspections: 12,
    criticalAlerts: 3,
    pendingDocuments: 8,
    totalInspections: 156,
    completedInspections: 142,
    pendingInspections: 14,
    failedInspections: 8,
  };

  const recentInspections = [
    { id: 1, building: "A Blok - YİBF 2024-001", category: "Demir", status: "PASS", inspector: "Ahmet Yılmaz", time: "09:30" },
    { id: 2, building: "B Blok - YİBF 2024-002", category: "Beton", status: "PENDING", inspector: "Mehmet Demir", time: "10:15" },
    { id: 3, building: "C Blok - YİBF 2024-003", category: "Duvar", status: "FAIL", inspector: "Ali Kaya", time: "11:00" },
    { id: 4, building: "D Blok - YİBF 2024-004", category: "Tesisat", status: "PASS", inspector: "Ayşe Çelik", time: "11:45" },
    { id: 5, building: "E Blok - YİBF 2024-005", category: "Demir", status: "PENDING", inspector: "Fatma Öz", time: "12:30" },
  ];

  const criticalAlerts = [
    { id: 1, type: "Eksik Evrak", message: "YİBF 2024-003 - Statik proje evrakı eksik", severity: "HIGH" },
    { id: 2, type: "Gecikme", message: "YİBF 2024-007 - Beton döküm kontrolü 2 gün gecikmiş", severity: "MEDIUM" },
    { id: 3, type: "Uyarı", message: "YİBF 2024-009 - Demir donatı kalitesinde şüphe", severity: "HIGH" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASS": return "text-green-400 bg-green-900/30 border-green-700";
      case "FAIL": return "text-red-400 bg-red-900/30 border-red-700";
      case "PENDING": return "text-yellow-400 bg-yellow-900/30 border-yellow-700";
      default: return "text-slate-400 bg-slate-900/30 border-slate-700";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH": return "border-red-500 bg-red-900/20";
      case "MEDIUM": return "border-yellow-500 bg-yellow-900/20";
      case "LOW": return "border-blue-500 bg-blue-900/20";
      default: return "border-slate-500 bg-slate-900/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Yapı Denetim Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Yapı İzleme Belgesi ve Denetim Yönetim Sistemi</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Son güncelleme</p>
              <p className="text-white font-medium">{new Date().toLocaleTimeString("tr-TR")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Aktif Yapılar */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full">+2 bu hafta</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{kpiData.activeBuildings}</h3>
            <p className="text-slate-400 text-sm">Aktif Yapılar (YİBF)</p>
          </div>

          {/* Bugün Planlanan Kontroller */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full">Bugün</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{kpiData.todayInspections}</h3>
            <p className="text-slate-400 text-sm">Planlanan Kontroller</p>
          </div>

          {/* Kritik Uyarılar */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-red-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded-full">Acil</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{kpiData.criticalAlerts}</h3>
            <p className="text-slate-400 text-sm">Kritik Uyarılar / Gecikmeler</p>
          </div>

          {/* Eksik Evrak */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-400" />
              </div>
              <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded-full">Bekliyor</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{kpiData.pendingDocuments}</h3>
            <p className="text-slate-400 text-sm">Eksik Evrak / Bekleyen Hakediş</p>
          </div>

          {/* Dijitalleşme Skoru */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/50 p-6 hover:border-purple-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded-full">Skor</span>
            </div>
            <div className="flex items-center justify-center mb-3">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#1e293b"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="url(#gradient)"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${68 * 2.26} 226`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">68</span>
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm text-center mb-2">Dijitalleşme Skorunuz</p>
            <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-900/30 rounded-lg p-2">
              <Lightbulb className="w-3 h-3 flex-shrink-0" />
              <span>💡 Finans modülünü aktive ederek skorunuzu 74'e çıkarabilirsiniz.</span>
            </div>
          </div>
        </div>

        {/* İstatistikler ve Son Aktiviteler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* İstatistikler */}
          <div className="lg:col-span-1 bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Denetim İstatistikleri
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Toplam Denetim</span>
                <span className="text-white font-medium">{kpiData.totalInspections}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Tamamlanan</span>
                <span className="text-green-400 font-medium">{kpiData.completedInspections}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Bekleyen</span>
                <span className="text-yellow-400 font-medium">{kpiData.pendingInspections}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Başarısız</span>
                <span className="text-red-400 font-medium">{kpiData.failedInspections}</span>
              </div>
              
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Başarı Oranı</span>
                  <span className="text-white font-medium">
                    {((kpiData.completedInspections / kpiData.totalInspections) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(kpiData.completedInspections / kpiData.totalInspections) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Son Denetimler */}
          <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Son Denetimler
            </h2>
            <div className="space-y-3">
              {recentInspections.map((inspection) => (
                <div 
                  key={inspection.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{inspection.building}</p>
                      <p className="text-slate-400 text-sm">{inspection.category} • {inspection.inspector}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm">{inspection.time}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(inspection.status)}`}>
                      {inspection.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kritik Uyarılar */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Kritik Uyarılar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {criticalAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    alert.severity === "HIGH" ? "text-red-400" : "text-yellow-400"
                  }`} />
                  <div>
                    <p className="text-white font-medium mb-1">{alert.type}</p>
                    <p className="text-slate-300 text-sm">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-lg transition-all flex items-center gap-3">
            <Building className="w-5 h-5" />
            <span className="font-medium">Yeni YİBF Ekle</span>
          </button>
          <button className="bg-green-600 hover:bg-green-500 text-white p-4 rounded-lg transition-all flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5" />
            <span className="font-medium">Denetim Başlat</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-lg transition-all flex items-center gap-3">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Raporlar</span>
          </button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-lg transition-all flex items-center gap-3">
            <Users className="w-5 h-5" />
            <span className="font-medium">Denetim Personeli</span>
          </button>
        </div>
      </div>
    </div>
  );
}
