/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React from "react";
import { Clock, TrendingUp, Users, AlertCircle, CheckCircle, ArrowUp, ArrowDown, BarChart3, Target } from "lucide-react";

export default function AnalyticsPage() {
  const timeAnalysis = {
    lostTime: 42,
    savedTime: 31,
    manualEntryHours: 42,
    automatedHours: 11,
  };

  const personnelData = [
    {
      id: "1",
      name: "Ahmet Yılmaz",
      avgInspectionTime: 34,
      deficienciesFound: 28,
      completedInspections: 156,
      efficiency: 87,
    },
    {
      id: "2",
      name: "Mehmet Demir",
      avgInspectionTime: 29,
      deficienciesFound: 12,
      completedInspections: 189,
      efficiency: 92,
    },
    {
      id: "3",
      name: "Ayşe Kaya",
      avgInspectionTime: 38,
      deficienciesFound: 35,
      completedInspections: 142,
      efficiency: 85,
    },
    {
      id: "4",
      name: "Ali Özkan",
      avgInspectionTime: 31,
      deficienciesFound: 19,
      completedInspections: 167,
      efficiency: 90,
    },
    {
      id: "5",
      name: "Fatma Şahin",
      avgInspectionTime: 27,
      deficienciesFound: 8,
      completedInspections: 201,
      efficiency: 94,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Personel Performans Analitiği</h1>
              <p className="text-slate-400 text-sm mt-1">Zaman kaybı ve verimlilik raporları</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Time Loss Analysis */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-orange-400" />
            Zaman Kaybı Analizi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-red-900/20 rounded-lg border border-red-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <span className="text-slate-400 text-sm">Kaybedilen Zaman</span>
              </div>
              <p className="text-3xl font-bold text-red-400">{timeAnalysis.lostTime} saat</p>
              <p className="text-slate-400 text-xs mt-2">Manuel evrak girişi</p>
            </div>

            <div className="bg-green-900/20 rounded-lg border border-green-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span className="text-slate-400 text-sm">Tasarruf Edilen Zaman</span>
              </div>
              <p className="text-3xl font-bold text-green-400">{timeAnalysis.savedTime} saat</p>
              <p className="text-slate-400 text-xs mt-2">Otomasyon ile</p>
            </div>

            <div className="bg-blue-900/20 rounded-lg border border-blue-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <span className="text-slate-400 text-sm">Verimlilik Artışı</span>
              </div>
              <p className="text-3xl font-bold text-blue-400">%74</p>
              <p className="text-slate-400 text-xs mt-2">Geçen aya göre</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-sm">
              <span className="text-orange-400 font-medium">Analiz:</span> Bu ay manuel evrak girişinde{" "}
              <span className="text-red-400 font-bold">{timeAnalysis.lostTime} saat</span> kaybedildi. Otomasyon ile{" "}
              <span className="text-green-400 font-bold">{timeAnalysis.savedTime} saat</span> tasarruf edildi.
              Dijitalleşme ile toplam{" "}
              <span className="text-blue-400 font-bold">{timeAnalysis.lostTime - timeAnalysis.automatedHours} saat</span>{" "}
              kazanım sağlandı.
            </p>
          </div>
        </div>

        {/* Personnel Performance Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Personel Performans Tablosu
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Target className="w-4 h-4" />
              <span>Toplam {personnelData.length} denetçi</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Denetçi</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Ort. Kontrol Süresi</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Bulunan Eksiklik</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Tamamlanan Denetim</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">Verimlilik</th>
                </tr>
              </thead>
              <tbody>
                {personnelData.map((person) => (
                  <tr key={person.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {person.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <span className="text-white font-medium">{person.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-white">{person.avgInspectionTime} dk</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        <span className="text-white">{person.deficienciesFound}</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-white">{person.completedInspections}</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              person.efficiency >= 90
                                ? "bg-green-500"
                                : person.efficiency >= 80
                                ? "bg-blue-500"
                                : "bg-orange-500"
                            }`}
                            style={{ width: `${person.efficiency}%` }}
                          />
                        </div>
                        <span className="text-white font-medium">{person.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ArrowUp className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">En Verimli Denetçi</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 font-bold">FS</span>
              </div>
              <div>
                <p className="text-white font-medium">Fatma Şahin</p>
                <p className="text-slate-400 text-sm">%94 verimlilik • 201 denetim</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-white">En Çok Eksiklik Bulan</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-600/20 rounded-full flex items-center justify-center">
                <span className="text-orange-400 font-bold">AK</span>
              </div>
              <div>
                <p className="text-white font-medium">Ayşe Kaya</p>
                <p className="text-slate-400 text-sm">35 eksiklik • 142 denetim</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
