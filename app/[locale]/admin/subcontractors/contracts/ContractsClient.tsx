/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FileText, Building2, Calendar, DollarSign, Plus, Edit, Trash2, Search, Filter, Key, ShieldCheck, Lock, User, Mail, X } from "lucide-react"
import { grantSubcontractorAccessAction } from "@/app/actions/subcontractor-auth"
import { toast } from "react-hot-toast"

interface ContractsClientProps {
  initialContracts: any[]
  subcontractors: { id: string; name: string }[]
  projects: { id: string; name: string }[]
}

export default function ContractsClient({ initialContracts, subcontractors, projects }: ContractsClientProps) {
  const router = useRouter()
  const [contracts, setContracts] = useState(initialContracts)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [selectedSubForGrant, setSelectedSubForGrant] = useState<{ id: string; name: string } | null>(null)
  const [grantFormData, setGrantFormData] = useState({
    name: "",
    email: "",
    password: "",
    subcontractorId: ""
  })
  const [isGranting, setIsGranting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    subcontractorId: "",
    projectId: "",
    totalAmount: 0,
    startDate: "",
    endDate: "",
    status: "ACTIVE"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const statusColors = {
    ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
    COMPLETED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    TERMINATED: "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const statusLabels = {
    ACTIVE: "Aktif",
    COMPLETED: "Tamamlandı",
    TERMINATED: "İptal"
  }

  const filteredContracts = contracts.filter(contract =>
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.subcontractor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = async () => {
    if (!formData.title || !formData.subcontractorId || !formData.projectId || !formData.totalAmount) {
      alert("Lütfen tüm zorunlu alanları doldurun")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/subcontractor-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString()
        })
      })

      if (response.ok) {
        const newContract = await response.json()
        setContracts([newContract, ...contracts])
        setShowCreateModal(false)
        resetForm()
        router.refresh()
      }
    } catch (error) {
      console.error("Create error:", error)
      alert("Sözleşme oluşturma hatası")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu sözleşmeyi silmek istediğinize emin misiniz?")) return

    try {
      const response = await fetch(`/api/admin/subcontractor-contracts/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setContracts(contracts.filter(c => c.id !== id))
        router.refresh()
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Silme hatası")
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      subcontractorId: "",
      projectId: "",
      totalAmount: 0,
      startDate: "",
      endDate: "",
      status: "ACTIVE"
    })
  }

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!grantFormData.subcontractorId || !grantFormData.email || !grantFormData.password) {
      toast.error("Lütfen tüm alanları doldurunuz.")
      return
    }

    setIsGranting(true)
    try {
      const res = await grantSubcontractorAccessAction({
        subcontractorId: grantFormData.subcontractorId,
        name: grantFormData.name,
        email: grantFormData.email,
        password: grantFormData.password,
      })

      if (res.success) {
        toast.success(res.message || "Giriş yetkisi verildi!", { icon: "🔑" })
        setShowGrantModal(false)
        setGrantFormData({ name: "", email: "", password: "", subcontractorId: "" })
        router.refresh()
      } else {
        toast.error(res.error || "Giriş yetkisi verilemedi.")
      }
    } catch (err: any) {
      toast.error(err?.message || "İşlem sırasında bir hata oluştu.")
    } finally {
      setIsGranting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Taşeron Sözleşmeleri & Yetkilendirme</h1>
          <p className="text-slate-400 mt-1">Taşeron sözleşmelerini yönetin, alt yüklenicilere sisteme giriş yetkisi tanımlayın</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const defaultSub = subcontractors[0] || null
              setSelectedSubForGrant(defaultSub)
              setGrantFormData({
                name: defaultSub?.name || "",
                email: "",
                password: "",
                subcontractorId: defaultSub?.id || ""
              })
              setShowGrantModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg transition-all shadow-lg shadow-orange-600/20 text-sm font-semibold cursor-pointer border border-orange-500/30"
          >
            <Key className="w-4 h-4 text-orange-200" />
            <span>Giriş Yetkisi Ver</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sözleşme</span>
          </button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-slate-400 text-sm">Toplam Sözleşme</div>
              <div className="text-2xl font-bold text-white mt-1">{contracts.length}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-slate-400 text-sm">Aktif Sözleşme</div>
              <div className="text-2xl font-bold text-green-400 mt-1">
                {contracts.filter(c => c.status === "ACTIVE").length}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-slate-400 text-sm">Toplam Tutar</div>
              <div className="text-2xl font-bold text-purple-400 mt-1">
                ₺{contracts.reduce((sum, c) => sum + c.totalAmount, 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-slate-400 text-sm">Tamamlanan</div>
              <div className="text-2xl font-bold text-yellow-400 mt-1">
                {contracts.filter(c => c.status === "COMPLETED").length}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Sözleşme, taşeron veya proje ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Contracts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
      >
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Sözleşme Başlığı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Taşeron
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Proje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Toplam Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Başlangıç Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Bitiş Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    {searchTerm ? "Aramaya uygun sonuç bulunamadı" : "Henüz sözleşme kaydı bulunmuyor"}
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract, index) => (
                  <motion.tr
                    key={contract.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{contract.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">{contract.subcontractor?.name ?? 'Bilinmiyor'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">{contract.project?.name ?? 'Bilinmiyor'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        ₺{contract.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-400">
                        {new Date(contract.startDate).toLocaleDateString("tr-TR")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-400">
                        {new Date(contract.endDate).toLocaleDateString("tr-TR")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[contract.status as keyof typeof statusColors]}`}>
                        {statusLabels[contract.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            const sub = subcontractors.find(s => s.id === contract.subcontractorId) || {
                              id: contract.subcontractorId,
                              name: contract.subcontractor?.name || "Taşeron"
                            }
                            setSelectedSubForGrant(sub)
                            setGrantFormData({
                              name: contract.subcontractor?.name || "",
                              email: "",
                              password: "",
                              subcontractorId: sub.id
                            })
                            setShowGrantModal(true)
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-semibold transition-all hover:scale-105 cursor-pointer shadow-sm"
                          title="Taşeron Yetkilisine Sisteme Giriş İzni Tanımla"
                        >
                          <Key className="w-3.5 h-3.5 text-orange-400" />
                          <span>Giriş Yetkisi Ver</span>
                        </button>
                        <button
                          onClick={() => router.push(`/admin/subcontractors/contracts/${contract.id}`)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Sözleşme Detayı"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contract.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Create Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Yeni Sözleşme Oluştur</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Sözleşme Başlığı</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Örn: Ana yapı inşaatı sözleşmesi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Taşeron</label>
                  <select
                    value={formData.subcontractorId}
                    onChange={(e) => setFormData({ ...formData, subcontractorId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Seçin</option>
                    {subcontractors.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Proje</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Seçin</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Toplam Tutar (₺)</label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Durum</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="COMPLETED">Tamamlandı</option>
                  <option value="TERMINATED">İptal</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Giriş Yetkisi Ver Modal (Taşeron Hesabı Oluşturma) */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-950/60 to-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Taşerona Giriş Yetkisi Ver</h3>
                  <p className="text-xs text-orange-400">Taşeron Portalı Kullanıcı Hesabı</p>
                </div>
              </div>
              <button
                onClick={() => setShowGrantModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleGrantSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Taşeron Firma *
                </label>
                <select
                  value={grantFormData.subcontractorId}
                  onChange={(e) => {
                    const selected = subcontractors.find(s => s.id === e.target.value)
                    setGrantFormData({
                      ...grantFormData,
                      subcontractorId: e.target.value,
                      name: selected ? selected.name : grantFormData.name
                    })
                  }}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  required
                >
                  <option value="">Taşeron Seçiniz...</option>
                  {subcontractors.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Yetkili Kişi / Firma Adı
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={grantFormData.name}
                    onChange={(e) => setGrantFormData({ ...grantFormData, name: e.target.value })}
                    placeholder="Örn: Yılmaz İnşaat Yetkilisi"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Giriş E-postası *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={grantFormData.email}
                    onChange={(e) => setGrantFormData({ ...grantFormData, email: e.target.value })}
                    placeholder="taseron@firma.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Giriş Şifresi *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={grantFormData.password}
                    onChange={(e) => setGrantFormData({ ...grantFormData, password: e.target.value })}
                    placeholder="En az 6 karakter"
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Role Indicator */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-400">Atanacak Rol & Portal:</span>
                <span className="font-semibold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  SUBCONTRACTOR (/subcontractor)
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  disabled={isGranting}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isGranting}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isGranting ? "Oluşturuluyor..." : "Yetkiyi Tanımla"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
