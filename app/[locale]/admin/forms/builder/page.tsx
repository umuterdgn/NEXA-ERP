"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Admin Dynamic Form Builder (/admin/forms/builder)
 */

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
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
  AlertCircle
} from "lucide-react"
import toast from "react-hot-toast"

export type FieldType = "checkbox" | "text" | "textarea" | "photo" | "number" | "select"

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // for select
}

const FIELD_TYPE_CONFIG: Record<FieldType, { label: string; icon: any; color: string; desc: string }> = {
  checkbox: { 
    label: "Onay Kutusu (Evet / Hayır)", 
    icon: CheckSquare, 
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", 
    desc: "Uygun / Uygun Değil kontrol maddesi" 
  },
  text: { 
    label: "Kısa Metin", 
    icon: Type, 
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20", 
    desc: "Kısa cevap veya kod/numara girişi" 
  },
  textarea: { 
    label: "Uzun Açıklama / Not", 
    icon: AlignLeft, 
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20", 
    desc: "Detaylı tutanak, tespit veya görüş" 
  },
  photo: { 
    label: "Fotoğraf / Kanıt Yükleme", 
    icon: Camera, 
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20", 
    desc: "Saha kamerasından görsel kanıt çekimi" 
  },
  number: { 
    label: "Sayısal Değer / Ölçüm", 
    icon: Hash, 
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20", 
    desc: "Metraj, basınç, sıcaklık veya adet" 
  },
  select: { 
    label: "Açılır Liste (Seçenekler)", 
    icon: ListFilter, 
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", 
    desc: "Önceden tanımlı seçenekler arasından seçim" 
  }
}

const PRESET_TEMPLATES = [
  {
    title: "Yangın Tesisatı ve Kaçış Yolu Denetimi",
    category: "Yangın Güvenliği",
    description: "Şantiyedeki yangın dolapları, sprinkler hatları ve acil kaçış yollarının periyodik uygunluk kontrolü.",
    fields: [
      { id: "f1", type: "checkbox", label: "Yangın kaçış holü ve merdivenleri açık ve engelsiz mi?", required: true },
      { id: "f2", type: "checkbox", label: "Sprinkler borularında basınç testi ve sızdırmazlık kontrolü yapıldı mı?", required: true },
      { id: "f3", type: "number", label: "Hattaki test manometre basınç değeri (Bar):", placeholder: "Örn: 8.5", required: true },
      { id: "f4", type: "photo", label: "Ana yangın kollektörü veya yangın dolabı görsel kanıtı:", required: true },
      { id: "f5", type: "select", label: "Genel Tesisat Uygunluk Notu:", options: ["Kusursuz / Onaylandı", "Giderilebilir Eksikler Mevcut", "Kritik Hata / Reddedildi"], required: true },
      { id: "f6", type: "textarea", label: "Denetçi Şantiye Notları ve Eksiklik Tutanakları:", placeholder: "Varsa giderilmesi gereken aksaklıkları yazın...", required: false }
    ] as FormField[]
  },
  {
    title: "Demir Donatı ve Kalıp Teslim Formu",
    category: "Kalıp & Donatı",
    description: "Beton dökümü öncesi kolon, kiriş ve perde demir donatı ve kalıp terazisi onay formu.",
    fields: [
      { id: "f1", type: "text", label: "Denetlenen Blok, Kat ve Aks Bilgisi:", placeholder: "Örn: B Blok 4. Kat Kolonları (A3-B7 aksı)", required: true },
      { id: "f2", type: "checkbox", label: "Paspayları şartnameye uygun yerleştirildi mi?", required: true },
      { id: "f3", type: "checkbox", label: "Kolon etriye aralıkları ve kanca kıvrımları projeye uygun mu?", required: true },
      { id: "f4", type: "number", label: "Ölçülen filiz boyu (cm):", placeholder: "Örn: 45", required: true },
      { id: "f5", type: "photo", label: "Donatı bağlama ve kalıp temizliği fotoğrafı:", required: true },
      { id: "f6", type: "select", label: "Beton Döküm Onayı:", options: ["Döküme Uygundur", "Eksikler Tamamlanınca Dökülebilir", "Döküm İptal / Düzeltme Gerekli"], required: true }
    ] as FormField[]
  },
  {
    title: "İSG Günlük Şantiye Risk Denetimi",
    category: "İSG & Saha",
    description: "Saha personeli kişisel koruyucu donanım (KKD) ve iskele güvenlik standartları kontrolü.",
    fields: [
      { id: "f1", type: "checkbox", label: "Tüm çalışanlar baret, yelek ve iş ayakkabısı kullanıyor mu?", required: true },
      { id: "f2", type: "checkbox", label: "Dış cephe iskelelerinde çift korkuluk ve topuk levhası mevcut mu?", required: true },
      { id: "f3", type: "checkbox", label: "Yüksekte çalışanların emniyet kemerleri yaşam hattına bağlı mı?", required: true },
      { id: "f4", type: "photo", label: "Saha genel güvenlik görünümü fotoğrafı:", required: true },
      { id: "f5", type: "textarea", label: "İkaz Edilen Taşeronlar veya Ramak Kala Olayları:", placeholder: "Varsa ihlalleri yazınız...", required: false }
    ] as FormField[]
  }
]

function FormBuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("id")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Yangın Güvenliği")
  const [customCategory, setCustomCategory] = useState("")
  const [fields, setFields] = useState<FormField[]>([
    {
      id: "f_1",
      type: "checkbox",
      label: "Topraklama ve elektrik panosu koruma rölesi devrede mi?",
      required: true
    },
    {
      id: "f_2",
      type: "photo",
      label: "Pano ve tesisat görsel kanıtı:",
      required: true
    },
    {
      id: "f_3",
      type: "textarea",
      label: "Denetçi Görüşü ve Notlar:",
      required: false,
      placeholder: "Açıklama giriniz..."
    }
  ])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Load existing form for edit
  useEffect(() => {
    if (editId) {
      setLoading(true)
      fetch(`/api/admin/forms?id=${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data.form) {
            setTitle(data.form.title)
            setDescription(data.form.description || "")
            setCategory(data.form.category || "GENEL")
            if (Array.isArray(data.form.fields)) {
              setFields(data.form.fields)
            }
          }
        })
        .catch(err => {
          console.error(err)
          toast.error("Form bilgileri yüklenemedi.")
        })
        .finally(() => setLoading(false))
    }
  }, [editId])

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      label: type === "checkbox" ? "Soru / Kontrol Maddesi" : "Alan Adı / Etiket",
      placeholder: type === "text" || type === "textarea" ? "İpucu veya açıklama..." : undefined,
      required: true,
      options: type === "select" ? ["Uygun", "Şartlı Uygun", "Uygun Değil"] : undefined
    }
    setFields(prev => [...prev, newField])
  }

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const handleRemoveField = (id: string) => {
    if (fields.length <= 1) {
      toast.error("Formda en az 1 alan bulunmalıdır.")
      return
    }
    setFields(prev => prev.filter(f => f.id !== id))
  }

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= fields.length) return
    const updated = [...fields]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setFields(updated)
  }

  const handleLoadPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    if (confirm(`"${preset.title}" hazır şablonu yüklensin mi? Mevcut alanlar güncellenecektir.`)) {
      setTitle(preset.title)
      setCategory(preset.category)
      setDescription(preset.description)
      setFields(preset.fields)
      toast.success("Hazır şablon yüklendi!")
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Lütfen bir form başlığı belirleyin.")
      return
    }
    if (fields.length === 0) {
      toast.error("Lütfen en az bir denetim alanı ekleyin.")
      return
    }

    // Validate that all fields have labels
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) {
        toast.error(`${i + 1}. alanın etiketini/sorusunu yazınız.`)
        return
      }
    }

    setSaving(true)
    const effectiveCategory = category === "ÖZEL" ? (customCategory.trim() || "DİĞER") : category

    try {
      const url = "/api/admin/forms"
      const method = editId ? "PUT" : "POST"
      const payload = {
        ...(editId ? { id: editId } : {}),
        title: title.trim(),
        description: description.trim() || null,
        category: effectiveCategory,
        fields
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Form kaydedilemedi.")
      }

      toast.success(editId ? "Form şablonu güncellendi!" : "Yeni form şablonu oluşturuldu!")
      router.push("/admin/forms")
    } catch (err: any) {
      toast.error(err.message || "Kaydetme sırasında bir hata oluştu.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Form bilgileri yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/forms"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-cyan-400" />
                {editId ? "Form Şablonunu Düzenle" : "Dinamik Denetim Formu Oluşturucu"}
              </h1>
              <p className="text-xs text-slate-400">
                Yapı denetimciler ve saha personeli için özelleştirilmiş denetim formları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors flex items-center gap-2 ${
                showPreview
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Mobil Önizleme</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{editId ? "Değişiklikleri Kaydet" : "Formu Kaydet"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Builder Column */}
          <div className={`${showPreview ? "lg:col-span-7" : "lg:col-span-12"} space-y-6 transition-all`}>
            
            {/* Form Metadata Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Form Genel Bilgileri
                </h2>

                {/* Preset dropdown */}
                <div className="relative group">
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Hazır Şablon Yükle
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-20">
                    <p className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase">Örnek Şablonlar</p>
                    {PRESET_TEMPLATES.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleLoadPreset(preset)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 hover:text-white transition-colors block"
                      >
                        <p className="font-semibold text-cyan-400">{preset.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{preset.category} • {preset.fields.length} Madde</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Form Başlığı <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Yangın Tesisatı ve Kaçış Güvenliği Denetimi"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="Yangın Güvenliği">Yangın Güvenliği</option>
                    <option value="Kalıp & Donatı">Kalıp & Donatı</option>
                    <option value="İSG & Saha">İSG & Saha</option>
                    <option value="Mekanik & Tesisat">Mekanik & Tesisat</option>
                    <option value="Elektrik">Elektrik</option>
                    <option value="Beton & Zemin">Beton & Zemin</option>
                    <option value="GENEL">Genel Denetim</option>
                    <option value="ÖZEL">Özel Kategori Yaz...</option>
                  </select>
                </div>
              </div>

              {category === "ÖZEL" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Özel Kategori Adı</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Örn: Asansör Ruhsat Öncesi Kontrol"
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Form Açıklaması / Talimat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Denetçiye yönelik bilgilendirici açıklama veya yasal mevzuat referansı..."
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Field Type Addition Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                + Forma Yeni Denetim Alanı Ekle
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {(Object.keys(FIELD_TYPE_CONFIG) as FieldType[]).map((type) => {
                  const cfg = FIELD_TYPE_CONFIG[type]
                  const Icon = cfg.icon
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleAddField(type)}
                      className={`p-3 rounded-xl border ${cfg.color} hover:scale-[1.03] active:scale-95 transition-all text-left flex flex-col justify-between group`}
                    >
                      <Icon className="w-5 h-5 mb-2 group-hover:rotate-6 transition-transform" />
                      <div>
                        <span className="text-xs font-bold block">{cfg.label.split("(")[0]}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">{cfg.desc}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Field Items List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Denetim Maddeleri & Sorular</span>
                  <span className="px-2 py-0.5 text-xs bg-slate-800 text-cyan-400 border border-slate-700 rounded-full">
                    {fields.length} Madde
                  </span>
                </h3>
                <span className="text-xs text-slate-500">Sıralamak için yukarı/aşağı butonlarını kullanın</span>
              </div>

              {fields.map((field, idx) => {
                const cfg = FIELD_TYPE_CONFIG[field.type]
                const Icon = cfg.icon
                return (
                  <div
                    key={field.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 hover:border-slate-700 transition-colors"
                  >
                    {/* Field Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-bold text-slate-400 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 rounded-lg transition-colors"
                          title="Yukarı Taşı"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, "down")}
                          disabled={idx === fields.length - 1}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 rounded-lg transition-colors"
                          title="Aşağı Taşı"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                          title="Alanı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Field Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      <div className="sm:col-span-8 space-y-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Soru / Madde Metni <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                          placeholder="Örn: Acil çıkış kapıları panik barlı mı?"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-3 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300 select-none">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                            className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-950 border-slate-800"
                          />
                          <span>Zorunlu Alan</span>
                        </label>
                      </div>
                    </div>

                    {/* Extra config for select options */}
                    {field.type === "select" && (
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Seçenekler (Virgülle ayırarak yazın)
                        </label>
                        <input
                          type="text"
                          value={(field.options || []).join(", ")}
                          onChange={(e) => handleUpdateField(field.id, {
                            options: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                          })}
                          placeholder="Örn: Uygun, Kusurlu, İptal"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}

                    {/* Placeholder for text / textarea / number */}
                    {(field.type === "text" || field.type === "textarea" || field.type === "number") && (
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-semibold text-slate-400">
                          İpucu / Placeholder (Opsiyonel)
                        </label>
                        <input
                          type="text"
                          value={field.placeholder || ""}
                          onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                          placeholder="Örn: Varsa kusuru belirtiniz..."
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live Mobile Preview Sidebar */}
          {showPreview && (
            <div className="lg:col-span-5 sticky top-24 self-start">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl">
                <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Saha Canlı Önizlemesi
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Mobil Görünüm
                  </span>
                </div>

                {/* Simulated Phone Screen */}
                <div className="mt-3 bg-slate-950 border border-slate-850 rounded-2xl p-4 max-h-[70vh] overflow-y-auto space-y-4 shadow-inner">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      {category === "ÖZEL" ? customCategory : category}
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      {title || "Form Başlığı"}
                    </h4>
                    {description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>

                  {/* Render simulated fields */}
                  <div className="space-y-4">
                    {fields.map((f, i) => (
                      <div key={f.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-200">
                            {i + 1}. {f.label}
                            {f.required && <span className="text-rose-400 ml-1">*</span>}
                          </span>
                        </div>

                        {f.type === "checkbox" && (
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              className="flex-1 py-2 px-3 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              Uygun
                            </button>
                            <button
                              type="button"
                              className="flex-1 py-2 px-3 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:border-rose-500 hover:text-rose-400 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              Uygun Değil
                            </button>
                          </div>
                        )}

                        {f.type === "text" && (
                          <input
                            type="text"
                            disabled
                            placeholder={f.placeholder || "Metin girin..."}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400"
                          />
                        )}

                        {f.type === "number" && (
                          <input
                            type="number"
                            disabled
                            placeholder={f.placeholder || "Ölçüm değeri..."}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400"
                          />
                        )}

                        {f.type === "textarea" && (
                          <textarea
                            disabled
                            rows={2}
                            placeholder={f.placeholder || "Açıklama girin..."}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 resize-none"
                          />
                        )}

                        {f.type === "photo" && (
                          <div className="border-2 border-dashed border-slate-700 rounded-xl p-3 text-center bg-slate-950/60 flex flex-col items-center justify-center gap-1 text-slate-400">
                            <Camera className="w-5 h-5 text-rose-400" />
                            <span className="text-[11px] font-medium">Fotoğraf Çek / Kanıt Yükle</span>
                          </div>
                        )}

                        {f.type === "select" && (
                          <select
                            disabled
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400"
                          >
                            {(f.options || ["Seçiniz"]).map((opt, oIdx) => (
                              <option key={oIdx}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-cyan-600/50 text-white font-bold text-xs uppercase tracking-wider"
                    >
                      Denetimi Tamamla (Önizleme)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FormBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    }>
      <FormBuilderContent />
    </Suspense>
  )
}
