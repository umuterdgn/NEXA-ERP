/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Inspection Dynamic Form Builder (/inspection/form-builder)
 * Yapı Denetim OS - 4708 Sayılı Kanun Uyumlu Dinamik Form Oluşturucu Terminali
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Type,
  AlignLeft,
  Camera,
  Hash,
  ListFilter,
  Save,
  Eye,
  Smartphone,
  Sparkles,
  ChevronLeft,
  Loader2,
  Layers,
  HelpCircle,
  FileCheck2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Code2,
  Download,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";

export type FieldType = "checkbox" | "text" | "textarea" | "photo" | "number" | "select";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

const FIELD_TYPE_CONFIG: Record<FieldType, { label: string; icon: any; color: string; desc: string }> = {
  checkbox: {
    label: "Onay Kutusu (Uygun / Değil)",
    icon: CheckSquare,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    desc: "Vize şartı veya mevzuat kontrol maddesi",
  },
  text: {
    label: "Kısa Metin",
    icon: Type,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    desc: "Poz no, aks kodu veya görevli mühendis adı",
  },
  textarea: {
    label: "Detaylı Tutanak Notu",
    icon: AlignLeft,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    desc: "Şantiye kusur tespiti, gerekçe veya resmi şerh",
  },
  photo: {
    label: "Fotoğraflı Delil / Kanıt",
    icon: Camera,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    desc: "Sahadan zorunlu GPS/zaman damgalı fotoğraf",
  },
  number: {
    label: "Sayısal Ölçüm / Dayanım",
    icon: Hash,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    desc: "Slump (çökme), basınç (MPa), paspayı (cm) veya adet",
  },
  select: {
    label: "Açılır Liste (Seçenekler)",
    icon: ListFilter,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    desc: "Önceden tanımlı vize kararı veya malzeme sınıfı",
  },
};

const INSPECTION_PRESET_TEMPLATES = [
  {
    title: "4708 Demir Donatı ve Kalıp Vizesi Teslim Tutanağı",
    category: "DEMIR_KALIP",
    description: "Beton dökümü öncesinde statik projeye uygun demir donatı çapı, etriye aralığı, paspayı ve kalıp rijitliği kontrol formu.",
    fields: [
      { id: "f1", type: "checkbox", label: "Statik projede belirtilen ana donatı çapları (Φ) ve adetleri tam mı?", required: true },
      { id: "f2", type: "checkbox", label: "Kolon-kiriş birleşim bölgelerinde sıklaştırma etriyeleri projeye uygun mu?", required: true },
      { id: "f3", type: "number", label: "Ölçülen ortalama paspayı mesafesi (cm):", placeholder: "Örn: 3.5", required: true },
      { id: "f4", type: "photo", label: "Donatı bağlama ve kolon pilye birleşim noktası kanıt fotoğrafı:", required: true },
      { id: "f5", type: "select", label: "Kalıp Mukavemeti ve Şakül Kontrol Kararı:", options: ["Kusursuz / Vize Verildi", "Eksikler Giderilince Vize Verilecek", "Kritik Hata / Beton Dökülemez"], required: true },
      { id: "f6", type: "textarea", label: "Yapı Denetçisi Özel Notları ve Şantiye Şefi Beyanı:", placeholder: "Mevzuata dair tespitleri kaydediniz...", required: false },
    ] as FormField[],
  },
  {
    title: "Beton Döküm ve Taze Beton Numune Tutanağı",
    category: "BETON_DOKUM",
    description: "Hazır beton santral irsaliyesi, slump deneyi, transmikser varış saati ve 15x15 karot küp numune alma protokolü.",
    fields: [
      { id: "b1", type: "text", label: "Hazır Beton Santrali Adı ve İrsaliye No:", placeholder: "Örn: Oyak Beton - İrsaliye #84920", required: true },
      { id: "b2", type: "select", label: "Dökülen Beton Dayanım Sınıfı:", options: ["C25/30", "C30/37", "C35/45", "C40/50"], required: true },
      { id: "b3", type: "number", label: "Taze Beton Slump (Çökme) Ölçüm Değeri (cm):", placeholder: "Örn: 16", required: true },
      { id: "b4", type: "number", label: "Alınan Küp Numune Adedi (7 ve 28 Günlük):", placeholder: "Örn: 6", required: true },
      { id: "b5", type: "photo", label: "Slump hunisi ölçümü ve transmikser şantiye görseli:", required: true },
      { id: "b6", type: "checkbox", label: "Betona şantiyede harici su ilavesi yapılmadığı teyit edildi mi?", required: true },
    ] as FormField[],
  },
  {
    title: "Şantiye İSG ve Çevre Güvenliği Denetim Raporu",
    category: "ISG_CEVRE",
    description: "Saha personeli kişisel koruyucu donanım (KKD), kenar koruma korkulukları ve açık boşluk güvenlik denetimi.",
    fields: [
      { id: "s1", type: "checkbox", label: "Sahadaki tüm personelin baret, yelek ve iş ayakkabısı kullanımı tam mı?", required: true },
      { id: "s2", type: "checkbox", label: "Döşeme kenarları ve asansör boşluklarında standart koruma korkulukları mevcut mu?", required: true },
      { id: "s3", type: "photo", label: "Şantiye genel güvenlik ve çevre koruma fotoğrafı:", required: true },
      { id: "s4", type: "select", label: "İSG Risk Seviyesi:", options: ["Düşük Risk (Güvenli)", "Orta Risk (Uyarı Verildi)", "Yüksek Risk (İş Durdurma Önerilir)"], required: true },
      { id: "s5", type: "textarea", label: "İSG Uzmanı ve Denetçi Tespit Tutanakları:", placeholder: "Varsa ihlalleri yazınız...", required: false },
    ] as FormField[],
  },
];

function FormBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("id");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("DEMIR_KALIP");
  const [customCategory, setCustomCategory] = useState("");
  const [fields, setFields] = useState<FormField[]>([
    {
      id: "f_1",
      type: "checkbox",
      label: "Statik proje ve donatı aks yerleşimi kontrol edildi mi?",
      required: true,
    },
    {
      id: "f_2",
      type: "photo",
      label: "Donatı bağlama ve kolon-kiriş birleşim kanıt fotoğrafı:",
      required: true,
    },
    {
      id: "f_3",
      type: "textarea",
      label: "Denetçi Görüşü ve Resmi Tutanak Şerhi:",
      required: false,
      placeholder: "Mevzuat şerhini giriniz...",
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetch(`/api/admin/forms?id=${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.form) {
            setTitle(data.form.title);
            setDescription(data.form.description || "");
            setCategory(data.form.category || "DEMIR_KALIP");
            if (Array.isArray(data.form.fields)) {
              setFields(data.form.fields);
            }
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error("Form şablonu yüklenemedi.");
        })
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      label: type === "checkbox" ? "Denetim Maddesi / Vize Kriteri" : "Parametre / Soru Etiketi",
      placeholder: type === "text" || type === "textarea" ? "İpucu veya mevzuat açıklaması..." : undefined,
      required: true,
      options: type === "select" ? ["Uygun (Vize Verildi)", "Kusurlu (DÖF Açıldı)", "Kapsam Dışı"] : undefined,
    };
    setFields((prev) => [...prev, newField]);
    toast.success(`${FIELD_TYPE_CONFIG[type].label} eklendi.`);
  };

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleRemoveField = (id: string) => {
    if (fields.length <= 1) {
      toast.error("Formda en az 1 denetim maddesi bulunmalıdır.");
      return;
    }
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setFields(updated);
  };

  const handleLoadPreset = (preset: typeof INSPECTION_PRESET_TEMPLATES[0]) => {
    if (confirm(`"${preset.title}" Bakanlık şablonu yüklensin mi? Mevcut alanlar güncellenecektir.`)) {
      setTitle(preset.title);
      setCategory(preset.category);
      setDescription(preset.description);
      setFields(preset.fields);
      toast.success("Bakanlık hazır denetim şablonu yüklendi!");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Lütfen bir form şablonu başlığı belirleyin.");
      return;
    }
    if (fields.length === 0) {
      toast.error("Lütfen en az bir denetim kriteri ekleyin.");
      return;
    }

    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        toast.error(`${i + 1}. denetim alanının etiketini/sorusunu yazınız.`);
        return;
      }
    }

    setSaving(true);
    const effectiveCategory = category === "OZEL" ? (customCategory.trim() || "DIGER") : category;

    try {
      const url = "/api/admin/forms";
      const method = editId ? "PUT" : "POST";
      const payload = {
        ...(editId ? { id: editId } : {}),
        title: title.trim(),
        description: description.trim() || null,
        category: effectiveCategory,
        fields,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Form şablonu kaydedilemedi.");
      }

      toast.success(editId ? "Form şablonu güncellendi!" : "Yeni Yapı Denetim form şablonu sisteme kaydedildi!");
      router.push("/inspection/forms");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Kaydetme sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm font-medium">Şablon yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/inspection/forms"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                YAPI DENETİM OS
              </span>
              <span className="text-slate-500 text-xs">/</span>
              <span className="text-slate-400 text-xs font-mono">DINAMIK ŞABLON MOTORU</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
              <Building2 className="w-6 h-6 text-blue-500" />
              {editId ? "Denetim Form Şablonunu Düzenle" : "Dinamik Form Oluşturucu"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>JSON Şema</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
              showPreview
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>{showPreview ? "Önizlemeyi Gizle" : "Mobil Saha Önizleme"}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{editId ? "Güncelle" : "Şablonu Yayınla"}</span>
          </button>
        </div>
      </div>

      {/* Preset Templates Bar */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>4708 Sayılı Mevzuat ve Standart Denetim Şablonları</span>
          </div>
          <span className="text-[11px] text-slate-400">Tek tıkla hazır form yükle</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {INSPECTION_PRESET_TEMPLATES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="text-left p-3 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 hover:border-blue-500/40 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-blue-400 mb-1">
                <span className="line-clamp-1">{preset.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {preset.fields.length} Madde
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Builder + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Settings & Fields (8 or 12 cols) */}
        <div className={`${showPreview ? "lg:col-span-7" : "lg:col-span-12"} space-y-6 transition-all`}>
          {/* Metadata Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-white font-semibold text-sm border-b border-slate-800/80 pb-3">
              <FileCheck2 className="w-4 h-4 text-blue-400" />
              <span>Form Genel Tanımları</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1.5">
                  Form Başlığı <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: 3. Kat Kolon Donatı ve Beton Öncesi Kontrol Formu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Denetim Kategorisi</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs cursor-pointer"
                >
                  <option value="DEMIR_KALIP">Demir Donatı & Kalıp Vizesi</option>
                  <option value="BETON_DOKUM">Beton Döküm & Karot Numune</option>
                  <option value="KABA_YAPI">Kaba Yapı & Taşıyıcı Sistem</option>
                  <option value="TESISAT_YANGIN">Mekanik, Elektrik & Yangın</option>
                  <option value="ISG_CEVRE">İş Güvenliği & Şantiye Düzeni</option>
                  <option value="OZEL">Özel Kategori (Manuel)</option>
                </select>
              </div>

              {category === "OZEL" && (
                <div className="sm:col-span-3">
                  <label className="block text-slate-300 font-medium mb-1.5">Özel Kategori Adı</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Özel kategori adı yazın..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              )}

              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-medium mb-1.5">Açıklama & Mevzuat Kapsamı</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Denetçinin sahada dikkat etmesi gereken mevzuat maddesi, standart veya genel yönerge..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Add Field Toolbar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
              <span>Forma Yeni Denetim Alanı Ekle</span>
              <span className="text-[11px] text-slate-500 font-normal">Tıklayarak forma dahil edin</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {(Object.keys(FIELD_TYPE_CONFIG) as FieldType[]).map((type) => {
                const config = FIELD_TYPE_CONFIG[type];
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddField(type)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-white transition group cursor-pointer"
                  >
                    <div className={`p-2 rounded-md ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-medium text-center line-clamp-1">{config.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fields List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold text-white">Denetim Maddeleri & Girdi Alanları ({fields.length})</span>
              <span>Sıralamayı oklarla değiştirebilirsiniz</span>
            </div>

            {fields.map((field, index) => {
              const config = FIELD_TYPE_CONFIG[field.type];
              const Icon = config.icon;
              return (
                <div
                  key={field.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 hover:border-slate-700/80 transition"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${config.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{config.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveField(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Yukarı Taşı"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveField(index, "down")}
                        disabled={index === fields.length - 1}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Aşağı Taşı"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer ml-1"
                        title="Alanı Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    <div className="sm:col-span-8">
                      <label className="block text-slate-400 font-medium mb-1">
                        Soru / Madde Etiketi <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        placeholder="Örn: Kolon etriye aralığı projeye uygun mu?"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-4 flex items-end">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 w-full cursor-pointer hover:border-slate-700 transition">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700 cursor-pointer"
                        />
                        <span className="text-slate-300 text-xs font-medium">Sahada Zorunlu Alan</span>
                      </label>
                    </div>

                    {(field.type === "text" || field.type === "textarea" || field.type === "number") && (
                      <div className="sm:col-span-12">
                        <label className="block text-slate-400 font-medium mb-1">İpucu / Placeholder Metni</label>
                        <input
                          type="text"
                          value={field.placeholder || ""}
                          onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                          placeholder="Örn: Şantiyede ölçülen değeri giriniz..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {field.type === "select" && (
                      <div className="sm:col-span-12 space-y-2">
                        <label className="block text-slate-400 font-medium">Seçenekler (Virgülle ayırarak yazın)</label>
                        <input
                          type="text"
                          value={(field.options || []).join(", ")}
                          onChange={(e) =>
                            handleUpdateField(field.id, {
                              options: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Uygun, Kusurlu, Kapsam Dışı"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Mobile Preview */}
        {showPreview && (
          <div className="lg:col-span-5 sticky top-6">
            <div className="rounded-2xl border-2 border-slate-800 bg-slate-950 p-4 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Saha Mobil Denetçi Görünümü</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  CANLI ÖNİZLEME
                </span>
              </div>

              {/* Simulated Phone Screen */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-4 max-h-[620px] overflow-y-auto">
                <div className="border-b border-slate-800 pb-2">
                  <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">{category}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{title || "Başlıksız Denetim Formu"}</div>
                  {description && <div className="text-[11px] text-slate-400 mt-1">{description}</div>}
                </div>

                <div className="space-y-3">
                  {fields.map((f, i) => (
                    <div key={f.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-200">
                          {i + 1}. {f.label}
                        </span>
                        {f.required && <span className="text-[10px] text-rose-400 font-semibold">*Zorunlu</span>}
                      </div>

                      {f.type === "checkbox" && (
                        <div className="flex items-center gap-2 pt-1">
                          <input type="checkbox" className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700" />
                          <span className="text-[11px] text-slate-400">Uygun / Projeye Uyumlu</span>
                        </div>
                      )}

                      {f.type === "text" && (
                        <input
                          type="text"
                          disabled
                          placeholder={f.placeholder || "Cevap..."}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-400"
                        />
                      )}

                      {f.type === "number" && (
                        <input
                          type="number"
                          disabled
                          placeholder={f.placeholder || "0.00"}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-400 font-mono"
                        />
                      )}

                      {f.type === "photo" && (
                        <div className="p-3 rounded border border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center gap-1 text-slate-500">
                          <Camera className="w-5 h-5 text-slate-400" />
                          <span className="text-[10px]">Sahadan Fotoğraf Çek / Yükle</span>
                        </div>
                      )}

                      {f.type === "textarea" && (
                        <textarea
                          disabled
                          rows={2}
                          placeholder={f.placeholder || "Tutanak notu..."}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-400"
                        />
                      )}

                      {f.type === "select" && (
                        <select disabled className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-400">
                          {(f.options || ["Seçenek 1", "Seçenek 2"]).map((opt, oIdx) => (
                            <option key={oIdx}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="w-full py-2 rounded-lg bg-blue-600/50 text-white text-xs font-semibold text-center cursor-not-allowed">
                    Tutanağı e-İmzala ve Kaydet
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* JSON Schema Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>Form JSON Şeması & Akreditasyon Uyumu</span>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="rounded-lg bg-slate-900 p-3 border border-slate-800 max-h-96 overflow-y-auto">
              <pre className="text-xs font-mono text-cyan-300 leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    title,
                    category,
                    description,
                    version: "2026.1",
                    standard: "4708_YAPI_DENETIM_TURKAK",
                    fields,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify({ title, category, description, fields }, null, 2)
                  );
                  toast.success("JSON panoya kopyalandı!");
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Kopyala</span>
              </button>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center text-slate-400 text-xs font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          Form motoru hazırlanıyor...
        </div>
      }
    >
      <FormBuilderContent />
    </Suspense>
  );
}
