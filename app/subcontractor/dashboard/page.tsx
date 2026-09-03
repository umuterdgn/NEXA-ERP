/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState } from "react";
import { Building, Calendar, Clock, AlertTriangle, CheckCircle, Download, FileText, ArrowRight, Shield, TrendingUp, Star } from "lucide-react";

export default function ContractorDashboardPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const projectData = {
    name: "Merkez Plaza",
    yibfNo: "14582",
    progress: 82,
    lastInspection: { date: "26 Ağustos", type: "Temel Donatı" },
    nextInspection: { date: "28 Ağustos", type: "1. Kat Beton" },
    openDeficiencies: 2,
    closedDeficiencies: 18,
  };

  const deficiencies = [
    {
      id: "1",
      floor: "Zemin Kat",
      element: "Kolon C12",
      category: "Donatı",
      description: "Donatı aralığı 20cm olması gerekirken 25cm ölçüldü. TS500 standartlarına uymuyor.",
      priority: "CRITICAL",
      createdAt: "24 Ağustos 2024",
      photoUrl: "/placeholder-deficiency.jpg",
    },
    {
      id: "2",
      floor: "1. Kat",
      element: "Kiriş K5",
      category: "Beton",
      description: "Beton yüzeyinde çatlak tespit edildi. Derinlik kontrolü gerekiyor.",
      priority: "HIGH",
      createdAt: "25 Ağustos 2024",
      photoUrl: "/placeholder-crack.jpg",
    },
  ];

  const documents = [
    { id: "1", name: "Zemin Etüdü Raporu", type: "PDF", date: "15 Mayıs 2024", size: "2.4 MB" },
    { id: "2", name: "Onaylı Statik Proje", type: "PDF", date: "18 Mayıs 2024", size: "5.1 MB" },
    { id: "3", name: "Hakediş Raporu - Ağustos", type: "PDF", date: "20 Ağustos 2024", size: "1.8 MB" },
    { id: "4", name: "Yapı Ruhsatı", type: "PDF", date: "15 Mayıs 2024", size: "0.8 MB" },
  ];

  const handleRequestInspection = (deficiencyId: string) => {
    alert("Kontrol talebiniz yapı denetim firmasına iletildi. En kısa sürede incelenecektir.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">🏢 Proje İlerleme Durumu</h1>
              <p className="text-slate-400 text-sm">Merkez Plaza (YİBF {projectData.yibfNo})</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Section */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Genel İlerleme
            </h2>
            <span className="text-3xl font-bold text-green-400">%{projectData.progress}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-green-500 h-4 rounded-full transition-all duration-1000"
              style={{ width: `${projectData.progress}%` }}
            />
          </div>
          <p className="text-slate-400 text-sm mt-2">Proje tamamlandı</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Son Kontrol</span>
            </div>
            <p className="text-lg font-bold text-white">{projectData.lastInspection.date}</p>
            <p className="text-slate-400 text-xs mt-1">{projectData.lastInspection.type}</p>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-slate-400 text-sm">Yaklaşan Kontrol</span>
            </div>
            <p className="text-lg font-bold text-white">{projectData.nextInspection.date}</p>
            <p className="text-slate-400 text-xs mt-1">{projectData.nextInspection.type}</p>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-slate-400 text-sm">Açık Eksiklik</span>
            </div>
            <p className="text-lg font-bold text-red-400">{projectData.openDeficiencies} Adet</p>
            <p className="text-slate-400 text-xs mt-1">Düzeltmeniz Bekleniyor</p>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-slate-400 text-sm">Tamamlanan Eksiklik</span>
            </div>
            <p className="text-lg font-bold text-green-400">{projectData.closedDeficiencies} Adet</p>
            <p className="text-slate-400 text-xs mt-1">Başarıyla Giderildi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deficiencies Table */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Giderilmesi Beklenen Eksiklikler
                </h2>
                <span className="px-3 py-1 bg-red-600/30 text-red-400 rounded-full text-sm font-medium">
                  {deficiencies.length} Açık
                </span>
              </div>

              <div className="space-y-4">
                {deficiencies.map((deficiency) => (
                  <div
                    key={deficiency.id}
                    className="bg-slate-800/50 rounded-lg border border-slate-700 p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-white">
                              {deficiency.floor} - {deficiency.element}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                deficiency.priority === "CRITICAL"
                                  ? "bg-red-600/30 text-red-400"
                                  : "bg-orange-600/30 text-orange-400"
                              }`}
                            >
                              {deficiency.priority}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs">{deficiency.category}</p>
                        </div>
                      </div>
                      <span className="text-slate-500 text-xs">{deficiency.createdAt}</span>
                    </div>

                    <p className="text-slate-300 text-sm mb-4">{deficiency.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Shield className="w-4 h-4" />
                        <span>Salt Okunur - Yapı Denetim Firması Onayı Gereklidir</span>
                      </div>
                      <button
                        onClick={() => handleRequestInspection(deficiency.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Düzeltildi, Kontrol Talep Et
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {deficiencies.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-slate-400">Açık eksiklik bulunmuyor</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-blue-400" />
                📁 Resmi Belgelerim
              </h2>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm truncate">{doc.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <span>{doc.type}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.date}</span>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <Download className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Tüm belgeler yapı denetim firması tarafından onaylanmıştır</span>
                </div>
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  Tüm Belgeleri İndir
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Service Rating Section */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mt-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 text-yellow-400" />
                Hizmet Değerlendirmesi
              </h2>

              <div className="space-y-4">
                <p className="text-slate-300 text-sm">Kontrol ekibinden memnun musunuz?</p>

                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <div className="text-center">
                    <p className="text-green-400 text-sm font-medium">
                      {rating === 5 && "Mükemmel! Teşekkür ederiz."}
                      {rating === 4 && "Çok iyi! Gelişmeye devam ediyoruz."}
                      {rating === 3 && "İyi, geri bildiriminiz için teşekkürler."}
                      {rating === 2 && "Gelişmemiz gereken alanlar var."}
                      {rating === 1 && "Üzüntü duyduk, durumu inceleyeceğiz."}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (rating > 0) {
                      alert(`Değerlendirmeniz (${rating} yıldız) kaydedildi. Teşekkür ederiz!`);
                      setRating(0);
                    }
                  }}
                  disabled={rating === 0}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    rating > 0
                      ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Değerlendirmeyi Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
