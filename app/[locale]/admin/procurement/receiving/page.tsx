"use client";

/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Malzeme Kabul & Tesellüm (Material Receiving & OCR Hub)
 * - İrsaliye No, Gelen Malzeme Tipi, Gelen Miktar
 * - İrsaliye Fotoğrafı Yükleme (OCR Zemin)
 * - Reddedilen / Hasarlı Ürün Miktarı ve Kanıt Fotoğrafı Ekleme Alanı
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Truck,
  Plus,
  X,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Package,
  Layers,
  Search,
  Camera,
  ScanText,
  FileCheck,
} from "lucide-react";
import toast from "react-hot-toast";

interface ReceivingItem {
  id: string;
  waybillNo: string;
  materialType: string;
  quantity: number;
  unit: string;
  supplier: string;
  receiver: string;
  date: string;
  status: "KABUL_EDILDI" | "SARTLI_KABUL" | "REDDEDILDI";
  rejectedQty?: number;
  damageReason?: string;
  hasWaybillPhoto: boolean;
  hasProofPhoto: boolean;
}

const MATERIAL_TYPES = [
  "B420C Nervürlü Donatı Demiri (Ø12-Ø28)",
  "C35 Hazır Beton",
  "Gazbeton Yapı Bloğu (15x25x60)",
  "13.5'luk Yatay Delikli Tuğla",
  "Çimento (CEM I 42.5 R)",
  "Su Yalıtım Membranı (4mm)",
  "Alçıpan Standart Plaka (12.5mm)",
  "Kaba Sıva Kumu (Yıkanmış)",
];

export default function MaterialReceivingPage() {
  const [items, setItems] = useState<ReceivingItem[]>([
    {
      id: "rcv-1",
      waybillNo: "IRS-2026-99410",
      materialType: "B420C Nervürlü Donatı Demiri (Ø12-Ø28)",
      quantity: 42.5,
      unit: "Ton",
      supplier: "İskenderun Demir Çelik A.Ş.",
      receiver: "Murat Çelik (Şantiye Şefi)",
      date: "04.11.2026 14:20",
      status: "KABUL_EDILDI",
      hasWaybillPhoto: true,
      hasProofPhoto: false,
    },
    {
      id: "rcv-2",
      waybillNo: "IRS-2026-99411",
      materialType: "13.5'luk Yatay Delikli Tuğla",
      quantity: 12000,
      unit: "Adet",
      supplier: "Işıklar Tuğla Sanayi",
      receiver: "Caner Özkan (Depo Amiri)",
      date: "04.11.2026 11:45",
      status: "SARTLI_KABUL",
      rejectedQty: 650,
      damageReason: "Palet nakliyesinde 3 palette kırık ve çatlak malzeme tespit edildi.",
      hasWaybillPhoto: true,
      hasProofPhoto: true,
    },
    {
      id: "rcv-3",
      waybillNo: "IRS-2026-99412",
      materialType: "C35 Hazır Beton",
      quantity: 72,
      unit: "m³",
      supplier: "Nexa Hazır Beton Tesisleri",
      receiver: "Ahmet Yılmaz (Saha Mühendisi)",
      date: "04.11.2026 09:10",
      status: "KABUL_EDILDI",
      hasWaybillPhoto: true,
      hasProofPhoto: false,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [waybillNo, setWaybillNo] = useState("");
  const [materialType, setMaterialType] = useState(MATERIAL_TYPES[0]);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("Ton");
  const [supplierName, setSupplierName] = useState("");
  const [receiverName, setReceiverName] = useState("Murat Çelik (Şantiye Şefi)");
  const [waybillPhotoName, setWaybillPhotoName] = useState<string | null>(null);

  // Hasarlı / Red Bölümü
  const [hasDamage, setHasDamage] = useState(false);
  const [rejectedQty, setRejectedQty] = useState("");
  const [damageReason, setDamageReason] = useState("");
  const [proofPhotoName, setProofPhotoName] = useState<string | null>(null);

  const waybillFileRef = useRef<HTMLInputElement>(null);
  const proofFileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!waybillNo.trim() || !quantity) {
      toast.error("Lütfen İrsaliye No ve Gelen Miktar alanlarını doldurunuz.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/material-receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waybillNo: waybillNo.trim(),
          materialType,
          receivedQuantity: parseFloat(quantity),
          unit,
          supplierName: supplierName.trim() || "Tedarikçi",
          receiverName,
          waybillPhoto: waybillPhotoName,
          rejectedQuantity: hasDamage ? parseFloat(rejectedQty) || 0 : 0,
          damageReason: hasDamage ? damageReason : undefined,
          damageProofPhoto: hasDamage ? proofPhotoName : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || "İrsaliye tesellüm kaydı başarıyla oluşturuldu!");

      const newItem: ReceivingItem = {
        id: "rcv-" + Date.now(),
        waybillNo: waybillNo.trim(),
        materialType,
        quantity: parseFloat(quantity),
        unit,
        supplier: supplierName.trim() || "Tedarikçi",
        receiver: receiverName,
        date: new Date().toLocaleDateString("tr-TR") + " (Yeni)",
        status: hasDamage && parseFloat(rejectedQty) > 0 ? "SARTLI_KABUL" : "KABUL_EDILDI",
        rejectedQty: hasDamage ? parseFloat(rejectedQty) : undefined,
        damageReason: hasDamage ? damageReason : undefined,
        hasWaybillPhoto: Boolean(waybillPhotoName),
        hasProofPhoto: Boolean(proofPhotoName),
      };

      setItems((prev) => [newItem, ...prev]);
      setIsModalOpen(false);
      setWaybillNo("");
      setQuantity("");
      setHasDamage(false);
      setRejectedQty("");
      setDamageReason("");
      setWaybillPhotoName(null);
      setProofPhotoName(null);
    } catch (err: any) {
      toast.error(err.message || "Kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(
    (i) =>
      i.waybillNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.materialType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 w-full p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <Truck className="w-4 h-4" />
            <span>Şantiye Lojistik & Depo Kabul</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Malzeme Kabul & Tesellüm
          </h1>
          <p className="text-sm text-slate-400">
            Şantiyeye gelen sevkiyatların irsaliye kaydı, hasarlı ürün tespiti ve dijital fotoğraf arşivi
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni İrsaliye & Tesellüm Girişi</span>
        </button>
      </div>

      {/* İstatistik Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Bugün Gelen İrsaliye</span>
          <div className="text-xl font-bold text-white font-mono">{items.length} Adet</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Kabul Oranı</span>
          <div className="text-xl font-bold text-emerald-400 font-mono">%98.4</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Hasarlı / Şartlı Kabul</span>
          <div className="text-xl font-bold text-amber-400 font-mono">1 Sevkiyat</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">OCR Hazırlık Durumu</span>
          <div className="text-xl font-bold text-cyan-400 font-mono">Aktif (Optik)</div>
        </div>
      </div>

      {/* Arama Barı */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İrsaliye no, malzeme adı veya tedarikçi ara..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* İrsaliyeler Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4 hover:border-slate-700 transition shadow-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                  {item.waybillNo}
                </span>
                <h3 className="text-sm font-bold text-white mt-2 leading-tight">
                  {item.materialType}
                </h3>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  item.status === "KABUL_EDILDI"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {item.status === "KABUL_EDILDI" ? "Eksiksiz Kabul" : "Şartlı Kabul"}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Gelen Miktar</span>
                <div className="text-base font-bold text-white font-mono">
                  {item.quantity} {item.unit}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.hasWaybillPhoto && (
                  <span className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-[10px] flex items-center gap-1">
                    <ScanText className="w-3 h-3" /> İrsaliye
                  </span>
                )}
                {item.hasProofPhoto && (
                  <span className="p-1.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-[10px] flex items-center gap-1">
                    <Camera className="w-3 h-3" /> Hasar Kanıtı
                  </span>
                )}
              </div>
            </div>

            {/* Hasar / Red Notu Varsa */}
            {item.rejectedQty ? (
              <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-800/40 text-xs space-y-1">
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Reddedilen: {item.rejectedQty} {item.unit}
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">{item.damageReason}</p>
              </div>
            ) : null}

            <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Tedarikçi: {item.supplier}</span>
              <span>{item.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* YENİ İRSALİYE & TESELLÜM GİRİŞ MODALI                                */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Yeni Malzeme Kabul & Tesellüm</h3>
                  <p className="text-xs text-slate-400">İrsaliye bilgileri, OCR fotoğrafı ve hasar kontrolü</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* İrsaliye No & Malzeme Tipi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    İrsaliye Numarası <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={waybillNo}
                    onChange={(e) => setWaybillNo(e.target.value)}
                    placeholder="Örn: IRS-2026-99415"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Gelen Malzeme Tipi</label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {MATERIAL_TYPES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Miktar & Birim & Tedarikçi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Gelen Miktar <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="42.5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Birim</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ton">Ton</option>
                    <option value="m³">m³ (Metreküp)</option>
                    <option value="Adet">Adet</option>
                    <option value="Palet">Palet</option>
                    <option value="Torba">Torba</option>
                    <option value="Metre">Metre</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Tedarikçi Firma</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Örn: İskenderun Demir Çelik"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* İrsaliye Fotoğrafı (OCR Zemin) */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ScanText className="w-4 h-4 text-cyan-400" />
                    İrsaliye Belge Fotoğrafı (OCR Hazırlık)
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">Otomatik Metin Tanıma</span>
                </label>

                <input
                  ref={waybillFileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setWaybillPhotoName(e.target.files[0].name);
                      toast.success("İrsaliye fotoğrafı yüklendi (OCR analizine hazır).");
                    }
                  }}
                />

                <div
                  onClick={() => waybillFileRef.current?.click()}
                  className="p-3 rounded-lg border border-dashed border-slate-700 hover:border-slate-600 bg-slate-900/60 text-center cursor-pointer"
                >
                  {waybillPhotoName ? (
                    <div className="text-xs text-emerald-400 font-medium">
                      ✓ {waybillPhotoName} yüklendi
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4 text-slate-500" />
                      <span>İrsaliye kağıdını fotoğraflayın veya PDF seçin</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hasarlı / Reddedilen Ürün Toggle */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Hasarlı veya Reddedilen Ürün Var mı?
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Hasarlı gelen palet veya spesifikasyona uymayan malzemeleri raporlayın
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasDamage}
                    onChange={(e) => setHasDamage(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                </div>

                {hasDamage && (
                  <div className="space-y-3 pt-3 border-t border-slate-800 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-red-300">
                          Reddedilen Miktar ({unit})
                        </label>
                        <input
                          type="number"
                          value={rejectedQty}
                          onChange={(e) => setRejectedQty(e.target.value)}
                          placeholder="Örn: 2"
                          className="w-full bg-slate-900 border border-red-800/60 rounded-xl px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300">
                          Hasar Kanıt Fotoğrafı
                        </label>
                        <input
                          ref={proofFileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setProofPhotoName(e.target.files[0].name);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => proofFileRef.current?.click()}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{proofPhotoName ? `✓ ${proofPhotoName}` : "Fotoğraf Çek / Ekle"}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">
                        Red / Hasar Sebebi & Açıklama
                      </label>
                      <input
                        type="text"
                        value={damageReason}
                        onChange={(e) => setDamageReason(e.target.value)}
                        placeholder="Örn: Palet kırık, tuğlalarda ezilme ve donatı korozyonu..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Tesellüm Kaydını Tamamla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
