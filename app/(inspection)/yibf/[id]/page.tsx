/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState } from "react";
import { Building, MapPin, User, Ruler, CheckCircle, AlertTriangle, Clock, ArrowLeft, Plus, FileText, Camera, Hash, Calendar, FolderOpen, Bot } from "lucide-react";
import { useRouter } from "next/navigation";

export default function YibfDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"timeline" | "deficiencies" | "documents">("timeline");
  const [selectedDeficiency, setSelectedDeficiency] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data - gerçek API'den gelecek
  const yibfData = {
    id: "1",
    yibfNo: "2024-001",
    address: "Atatürk Mah. Cumhuriyet Cad. No:123 Kadıköy/İstanbul",
    ownerName: "Ahmet Yılmaz",
    contractorName: "Mahir Bakay Mühendislik",
    totalArea: 1250.5,
    floors: 8,
    status: "ACTIVE",
  };

  const timelineEvents = [
    { id: 1, eventType: "Ruhsat Alındı", description: "Yapı kullanma izni belgesi alındı", timestamp: "2024-05-12T10:00:00", icon: "file", color: "blue" },
    { id: 2, eventType: "Temel Kazısı Başladı", description: "Zemin etüt raporuna göre temel kazısı başlatıldı", timestamp: "2024-05-15T08:30:00", icon: "shovel", color: "yellow" },
    { id: 3, eventType: "Donatı Kontrolü", description: "Zemin kat donatı kontrolü yapıldı - ONAY", timestamp: "2024-05-18T14:00:00", icon: "check", color: "green" },
    { id: 4, eventType: "Beton Dökümü", description: "Zemin kat beton dökümü tamamlandı", timestamp: "2024-05-20T16:00:00", icon: "drop", color: "blue" },
    { id: 5, eventType: "Eksiklik Açıldı", description: "Kolon C12 donatı aralığı uygunsuzluğu tespit edildi", timestamp: "2024-05-22T11:00:00", icon: "alert", color: "red" },
    { id: 6, eventType: "Düzeltme Tamamlandı", description: "Kolon C12 eksikliği düzeltildi ve onaylandı", timestamp: "2024-05-25T09:00:00", icon: "check", color: "green" },
    { id: 7, eventType: "1. Kat Duvar Örüldü", description: "1. kat taşıyıcı duvar örümü tamamlandı", timestamp: "2024-06-01T15:00:00", icon: "wall", color: "purple" },
  ];

  const deficiencies = [
    {
      id: "1",
      floor: "Zemin Kat",
      element: "Kolon C12",
      category: "Donatı",
      priority: "CRITICAL",
      description: "Donatı aralığı 20cm olması gerekirken 25cm ölçüldü. TS500 standartlarına uymuyor.",
      photoUrl: "/placeholder-deficiency.jpg",
      status: "CLOSED",
      dueDate: "2024-05-25T18:00:00",
      closedAt: "2024-05-25T14:30:00",
      inspector: "Ahmet Yılmaz",
      createdAt: "2024-05-22T11:00:00",
      hash: "a1b2c3d4e5f6",
    },
    {
      id: "2",
      floor: "1. Kat",
      element: "Kiriş K5",
      category: "Beton",
      priority: "HIGH",
      description: "Beton yüzeyinde çatlak tespit edildi. Derinlik kontrolü gerekiyor.",
      photoUrl: "/placeholder-crack.jpg",
      status: "OPEN",
      dueDate: "2024-06-10T18:00:00",
      closedAt: null,
      inspector: "Mehmet Demir",
      createdAt: "2024-06-05T09:00:00",
      hash: "f6e5d4c3b2a1",
    },
    {
      id: "3",
      floor: "2. Kat",
      element: "Duvar D3",
      category: "Duvar",
      priority: "MEDIUM",
      description: "Duvar kalınlığı 20cm olması gerekirken 18cm ölçüldü.",
      photoUrl: "/placeholder-wall.jpg",
      status: "FIX_PENDING",
      dueDate: "2024-06-15T18:00:00",
      closedAt: null,
      inspector: "Ali Kaya",
      createdAt: "2024-06-08T14:00:00",
      hash: "9z8y7x6w5v4",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-red-900/30 text-red-400 border-red-700";
      case "FIX_PENDING": return "bg-orange-900/30 text-orange-400 border-orange-700";
      case "VERIFY_PENDING": return "bg-yellow-900/30 text-yellow-400 border-yellow-700";
      case "CLOSED": return "bg-green-900/30 text-green-400 border-green-700";
      default: return "bg-slate-900/30 text-slate-400 border-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN": return "Açık";
      case "FIX_PENDING": return "Düzeltme Bekliyor";
      case "VERIFY_PENDING": return "Doğrulama Bekliyor";
      case "CLOSED": return "Kapatıldı";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "text-red-400";
      case "HIGH": return "text-orange-400";
      case "MEDIUM": return "text-yellow-400";
      case "LOW": return "text-blue-400";
      default: return "text-slate-400";
    }
  };

  const getTimelineIcon = (icon: string) => {
    switch (icon) {
      case "file": return <FileText className="w-5 h-5" />;
      case "check": return <CheckCircle className="w-5 h-5" />;
      case "alert": return <AlertTriangle className="w-5 h-5" />;
      case "drop": return <div className="w-5 h-5 bg-blue-400 rounded-full" />;
      case "wall": return <div className="w-5 h-5 bg-purple-400 rounded" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getTimelineColor = (color: string) => {
    switch (color) {
      case "blue": return "bg-blue-500";
      case "green": return "bg-green-500";
      case "red": return "bg-red-500";
      case "yellow": return "bg-yellow-500";
      case "purple": return "bg-purple-500";
      default: return "bg-slate-500";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Geri Dön</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Building className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">YİBF {yibfData.yibfNo}</h1>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span>{yibfData.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-4 h-4" />
                    <span>Müteahhit: {yibfData.contractorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Ruler className="w-4 h-4" />
                    <span>{yibfData.totalArea} m² • {yibfData.floors} Kat</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                yibfData.status === "ACTIVE" ? "bg-green-900/30 text-green-400" : "bg-slate-800 text-slate-400"
              }`}>
                {yibfData.status === "ACTIVE" ? "Aktif" : yibfData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex mb-6 bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex-1 py-3 px-4 rounded-md transition-all flex items-center justify-center gap-2 ${
              activeTab === "timeline"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            Zaman Makinesi
          </button>
          <button
            onClick={() => setActiveTab("deficiencies")}
            className={`flex-1 py-3 px-4 rounded-md transition-all flex items-center justify-center gap-2 ${
              activeTab === "deficiencies"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Kanıt Zinciri / Eksiklikler
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex-1 py-3 px-4 rounded-md transition-all flex items-center justify-center gap-2 ${
              activeTab === "documents"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Evrak Durumu (AI Check)
          </button>
        </div>

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Yapı Olayları Zaman Çizelgesi</h2>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-700"></div>

              <div className="space-y-6">
                {timelineEvents.map((event, index) => (
                  <div key={event.id} className="relative flex items-start gap-6">
                    {/* Timeline Dot */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 ${getTimelineColor(event.color)} bg-opacity-20 border-2 ${getTimelineColor(event.color)}`}>
                      <div className={getTimelineColor(event.color)}>
                        {getTimelineIcon(event.icon)}
                      </div>
                    </div>

                    {/* Event Card */}
                    <div className="flex-1 bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-medium">{event.eventType}</h3>
                          <p className="text-slate-400 text-sm mt-1">{event.description}</p>
                        </div>
                        <span className="text-slate-500 text-sm">{formatDate(event.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deficiencies Tab */}
        {activeTab === "deficiencies" && (
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Eksiklik ve Uygunsuzluklar</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                Yeni Eksiklik Bildir
              </button>
            </div>

            {/* Deficiency List */}
            <div className="space-y-4">
              {deficiencies.map((deficiency) => (
                <div
                  key={deficiency.id}
                  onClick={() => {
                    setSelectedDeficiency(deficiency);
                    setIsModalOpen(true);
                  }}
                  className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                        <Camera className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-medium">{deficiency.floor} - {deficiency.element}</h3>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusColor(deficiency.status)}`}>
                            {getStatusLabel(deficiency.status)}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(deficiency.priority)}`}>
                            {deficiency.priority}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{deficiency.category}</p>
                        <p className="text-slate-300 text-sm line-clamp-2">{deficiency.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">{formatDate(deficiency.createdAt)}</p>
                      {deficiency.dueDate && (
                        <p className="text-slate-400 text-xs mt-1">Son Tarih: {new Date(deficiency.dueDate).toLocaleDateString("tr-TR")}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Evrak Durumu (AI Check)</h2>
                <p className="text-slate-400 text-sm mt-1">Yapay zeka ile yapı dosyası evrak analizi</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
                <FileText className="w-4 h-4" />
                AI Analizini Yeniden Çalıştır
              </button>
            </div>

            {/* AI Analysis Result */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI Evrak Analizi Sonucu</h3>
                  <p className="text-slate-400 text-sm">Son analiz: {new Date().toLocaleDateString("tr-TR")} - {new Date().toLocaleTimeString("tr-TR")}</p>
                </div>
              </div>

              {/* Document Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Yapı Ruhsatı</p>
                      <p className="text-slate-400 text-xs">Rev 1 - 15.05.2024</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-600/30 text-green-400 rounded-full text-xs font-medium">Mevcut</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Mimari Proje Rev 2</p>
                      <p className="text-slate-400 text-xs">Son revizyon - 20.05.2024</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-600/30 text-green-400 rounded-full text-xs font-medium">Mevcut</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-white font-medium">Zemin Etüdü Raporu</p>
                      <p className="text-slate-400 text-xs">Gereklilik: TBDY 2018 Bölüm 16.2</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-600/30 text-red-400 rounded-full text-xs font-medium">EKSİK - Kritik!</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-900/20 border border-orange-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-white font-medium">Beton Döküm Tutanakları</p>
                      <p className="text-slate-400 text-xs">Zemin kat - İmza bekliyor</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-orange-600/30 text-orange-400 rounded-full text-xs font-medium">İmza Bekliyor</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Statik Proje</p>
                      <p className="text-slate-400 text-xs">Onaylı - 18.05.2024</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-600/30 text-green-400 rounded-full text-xs font-medium">Mevcut</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-900/20 border border-orange-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-white font-medium">Elektrik Tesisat Projesi</p>
                      <p className="text-slate-400 text-xs">Revize edildi - YDK onayı bekliyor</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-orange-600/30 text-orange-400 rounded-full text-xs font-medium">Onay Bekliyor</span>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">4</p>
                    <p className="text-slate-400 text-xs mt-1">Mevcut</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">1</p>
                    <p className="text-slate-400 text-xs mt-1">Eksik</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-400">2</p>
                    <p className="text-slate-400 text-xs mt-1">Bekleyen</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deficiency Detail Modal */}
      {isModalOpen && selectedDeficiency && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Eksiklik Detayı</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Photo */}
              <div className="mb-6">
                <div className="w-full h-64 bg-slate-800 rounded-lg flex items-center justify-center">
                  <Camera className="w-12 h-12 text-slate-600" />
                  <span className="ml-3 text-slate-500">Fotoğraf Yükleniyor...</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-1">Konum</p>
                    <p className="text-white font-medium">{selectedDeficiency.floor} - {selectedDeficiency.element}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-1">Kategori</p>
                    <p className="text-white font-medium">{selectedDeficiency.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-1">Öncelik</p>
                    <p className={`font-medium ${getPriorityColor(selectedDeficiency.priority)}`}>
                      {selectedDeficiency.priority}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-1">Durum</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedDeficiency.status)}`}>
                      {getStatusLabel(selectedDeficiency.status)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Açıklama</p>
                  <p className="text-white">{selectedDeficiency.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-1 flex items-center gap-2">
                      <User className="w-3 h-3" />
                      Tespit Eden
                    </p>
                    <p className="text-white font-medium">{selectedDeficiency.inspector}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Tarih
                    </p>
                    <p className="text-white font-medium">{formatDate(selectedDeficiency.createdAt)}</p>
                  </div>
                </div>

                {/* Immutable Record Info */}
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-xs mb-2 flex items-center gap-2">
                    <Hash className="w-3 h-3" />
                    Değiştirilemez Kayıt Bilgisi
                  </p>
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs">Kayıt ID: {selectedDeficiency.id}</p>
                    <p className="text-slate-500 text-xs">Hash: {selectedDeficiency.hash}</p>
                    {selectedDeficiency.closedAt && (
                      <p className="text-green-400 text-xs">Kapanış Tarih: {formatDate(selectedDeficiency.closedAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
