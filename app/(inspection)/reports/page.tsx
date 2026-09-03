/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState, useRef } from "react";
import { usePDF } from "react-to-pdf";
import { Calendar, Download, FileText, Bot, CheckCircle, AlertTriangle, TrendingUp, Building } from "lucide-react";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const { targetRef, toPDF } = usePDF({ filename: "yapi-denetim-raporu.pdf" });

  // Mock statistics
  const stats = {
    totalInspections: 143,
    openedDeficiencies: 38,
    openDeficiencies: 7,
    closedDeficiencies: 31,
    topProblematicProjects: [
      { yibfNo: "14582", address: "Kadıköy/İstanbul", issueCount: 12, mainIssue: "Donatı eksiklikleri" },
      { yibfNo: "14589", address: "Beşiktaş/İstanbul", issueCount: 8, mainIssue: "Beton çatlamaları" },
      { yibfNo: "14595", address: "Şişli/İstanbul", issueCount: 6, mainIssue: "Duvar kalınlığı" },
    ],
    categoryBreakdown: [
      { category: "Donatı", count: 15 },
      { category: "Beton", count: 12 },
      { category: "Duvar", count: 8 },
      { category: "Tesisat", count: 3 },
    ],
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingSummary(true);
    
    try {
      const response = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
      } else {
        // Fallback mock summary
        setAiSummary("Ağustos ayında toplam 143 saha kontrolü gerçekleştirilmiştir. Açılan 38 uygunsuzluğun %81'i başarıyla kapatılmış olup, özellikle YİBF 14582 projesindeki donatı eksiklikleri dikkat çekmektedir. Genel saha performansı olumludur.");
      }
    } catch (error) {
      console.error("AI summary error:", error);
      // Fallback mock summary
      setAiSummary("Ağustos ayında toplam 143 saha kontrolü gerçekleştirilmiştir. Açılan 38 uygunsuzluğun %81'i başarıyla kapatılmış olup, özellikle YİBF 14582 projesindeki donatı eksiklikleri dikkat çekmektedir. Genel saha performansı olumludur.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDownloadPDF = () => {
    toPDF();
  };

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getLastMonthDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  };

  React.useEffect(() => {
    setStartDate(getLastMonthDate());
    setEndDate(getTodayDate());
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Yönetim Raporları</h1>
              <p className="text-slate-400 text-sm mt-1">
                Yapı Denetim Sistemi - PDF Raporlama
              </p>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>PDF Olarak İndir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <button
            onClick={handleGenerateAISummary}
            disabled={isGeneratingSummary}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bot className="w-4 h-4" />
            <span>{isGeneratingSummary ? "Oluşturuluyor..." : "Yapay Zekaya Özet Yazdır"}</span>
          </button>
        </div>
      </div>

      {/* Report Content (A4 size) */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div
          ref={targetRef}
          id="report-content"
          className="bg-white text-slate-900 rounded-lg shadow-2xl p-8 max-w-4xl mx-auto"
          style={{ minHeight: "1123px" }} // A4 height in pixels at 96 DPI
        >
          {/* Report Header */}
          <div className="border-b-2 border-slate-300 pb-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Yapı Denetim Yönetim Raporu</h1>
                <p className="text-slate-600 mt-1">Mahir Bakay Mühendislik Yapı Denetim OS</p>
              </div>
              <div className="text-right">
                <p className="text-slate-600 text-sm">
                  Rapor Tarihi: {new Date().toLocaleDateString("tr-TR")}
                </p>
                <p className="text-slate-600 text-sm">
                  Dönem: {new Date(startDate).toLocaleDateString("tr-TR")} - {new Date(endDate).toLocaleDateString("tr-TR")}
                </p>
              </div>
            </div>
          </div>

          {/* AI Executive Summary */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-purple-900">🤖 AI Yönetici Özeti</h2>
            </div>
            {aiSummary ? (
              <p className="text-slate-700 text-sm leading-relaxed">{aiSummary}</p>
            ) : (
              <p className="text-slate-400 text-sm italic">
                Özet oluşturmak için "Yapay Zekaya Özet Yazdır" butonuna tıklayın...
              </p>
            )}
          </div>

          {/* Key Statistics */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Temel İstatistikler
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.totalInspections}</p>
                <p className="text-slate-600 text-sm mt-1">Gerçekleşen Kontrol</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-orange-600">{stats.openedDeficiencies}</p>
                <p className="text-slate-600 text-sm mt-1">Açılan Eksiklik</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {Math.round((stats.closedDeficiencies / stats.openedDeficiencies) * 100)}%
                </p>
                <p className="text-slate-600 text-sm mt-1">Kapatılma Oranı</p>
              </div>
            </div>
          </div>

          {/* Deficiency Status */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Eksiklik Durumu
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-600">{stats.openDeficiencies}</p>
                    <p className="text-slate-600 text-sm">Açık Eksiklik</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.closedDeficiencies}</p>
                    <p className="text-slate-600 text-sm">Kapatılan Eksiklik</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Problematic Projects */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              En Çok Sorun Yaşanan YİBF'ler (Top 3)
            </h2>
            <div className="space-y-3">
              {stats.topProblematicProjects.map((project, index) => (
                <div key={project.yibfNo} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-sm font-bold">
                          #{index + 1}
                        </span>
                        <h3 className="font-bold text-slate-900">YİBF {project.yibfNo}</h3>
                      </div>
                      <p className="text-slate-600 text-sm mt-1">{project.address}</p>
                      <p className="text-slate-500 text-xs mt-1">Ana Sorun: {project.mainIssue}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">{project.issueCount}</p>
                      <p className="text-slate-600 text-xs">Eksiklik</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Kategori Bazlı Dağılım
            </h2>
            <div className="space-y-3">
              {stats.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-700">{cat.category}</div>
                  <div className="flex-1 bg-slate-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all"
                      style={{ width: `${(cat.count / stats.openedDeficiencies) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-slate-900">{cat.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Footer */}
          <div className="border-t-2 border-slate-300 pt-6 mt-8">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div>
                <p>Mahir Bakay Mühendislik Yapı Denetim OS</p>
                <p className="mt-1">Bu rapor otomatik olarak oluşturulmuştur.</p>
              </div>
              <div className="text-right">
                <p>Rapor No: R-{Date.now()}</p>
                <p className="mt-1">Sayfa 1/1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
