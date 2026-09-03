"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { useSession } from "next-auth/react"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function FinancePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [transactions, setTransactions] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [personnel, setPersonnel] = useState<any[]>([])
  const [progressPayments, setProgressPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProgressPaymentModalOpen, setIsProgressPaymentModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Role-based access control
  useEffect(() => {
    if (status === "loading") return
    
    const userRole = session?.user?.role
    const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN"
    
    if (!isAdmin) {
      router.push("/admin/dashboard")
      toast.error("Bu sayfaya erişim yetkiniz yok")
    }
  }, [status, session, router])

  useEffect(() => {
    const userRole = session?.user?.role
    const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN"
    
    if (!isAdmin) return
    
    fetchTransactions()
    fetchProjects()
    fetchCompanies()
    fetchPersonnel()
    fetchProgressPayments()
  }, [])
  
  const [formData, setFormData] = useState({
    type: "GELIR",
    amount: "",
    description: "",
    category: "DIGER",
    projectId: "",
    companyId: "",
    personnelId: ""
  })

  const [progressPaymentForm, setProgressPaymentForm] = useState({
    projectId: "",
    subcontractor: "",
    workType: "",
    unit: "",
    quantity: "",
    unitPrice: "",
    description: ""
  })

  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: ""
  })

  const [categoryFilter, setCategoryFilter] = useState("TUMU")

  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0
  })

  useEffect(() => {
    if (transactions.length > 0) {
      const filteredTransactions = getFilteredTransactions()
      
      const income = filteredTransactions
        .filter(t => t.type === "GELIR")
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expense = filteredTransactions
        .filter(t => t.type === "GIDER")
        .reduce((sum, t) => sum + t.amount, 0)
      
      setStats({
        totalIncome: income,
        totalExpense: expense,
        netBalance: income - expense
      })
    }
  }, [transactions, dateFilter, categoryFilter])

  const getFilteredTransactions = () => {
    if (!transactions || transactions.length === 0) return []
    
    return transactions.filter(t => {
      // Date filtering
      const transactionDate = new Date(t.date)
      const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null
      const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null
      
      if (startDate && transactionDate < startDate) return false
      if (endDate && transactionDate > endDate) return false
      
      // Category filtering
      if (categoryFilter !== "TUMU" && t.category !== categoryFilter) return false
      
      return true
    })
  }

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/admin/finance")
      console.log("FİNANS VERİ ÇEKME - Response Status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("FİNANS VERİ ÇEKME - Gelen Veri Yapısı:", data)
        console.log("FİNANS VERİ ÇEKME - Veri Tipi:", typeof data)
        console.log("FİNANS VERİ ÇEKME - Array mi?", Array.isArray(data))
        setTransactions(Array.isArray(data) ? data : [])
      } else {
        console.error("FİNANS VERİ ÇEKME HATASI - Response not OK:", response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error("FİNANS VERİ ÇEKME HATASI - Error Data:", errorData)
      }
    } catch (error) {
      console.error("FİNANS VERİ ÇEKME HATASI DETAYI:", error)
      toast.error("İşlemler yüklenirken hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      if (response.ok) {
        const data = await response.json()
        console.log("FİNANS VERİ ÇEKME - Gelen Veri (Projects):", data)
        // API returns { projects: [...] } structure
        const projectsData = data.projects || data
        console.log("FİNANS VERİ ÇEKME - Projects Data:", projectsData)
        setProjects(Array.isArray(projectsData) ? projectsData : [])
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/crm")
      if (response.ok) {
        const data = await response.json()
        console.log("FİNANS VERİ ÇEKME - Gelen Veri (Companies):", data)
        setCompanies(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("FİNANS VERİ ÇEKME HATASI DETAYI (Companies):", error)
    }
  }

  const fetchPersonnel = async () => {
    try {
      const response = await fetch("/api/admin/personnel")
      if (response.ok) {
        const data = await response.json()
        console.log("FİNANS VERİ ÇEKME - Gelen Veri (Personnel):", data)
        setPersonnel(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("FİNANS VERİ ÇEKME HATASI DETAYI (Personnel):", error)
    }
  }

  const fetchProgressPayments = async () => {
    try {
      const response = await fetch("/api/admin/progress-payments")
      if (response.ok) {
        const data = await response.json()
        console.log("FİNANS VERİ ÇEKME - Gelen Veri (ProgressPayments):", data)
        setProgressPayments(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("FİNANS VERİ ÇEKME HATASI DETAYI (ProgressPayments):", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.type || !formData.amount || !formData.description || !formData.category) {
      toast.error("Gerekli alanları doldurun")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/finance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("İşlem başarıyla eklendi")
        fetchTransactions()
        closeModal()
      } else {
        toast.error("İşlem eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("İşlem eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openModal = () => {
    setFormData({
      type: "GELIR",
      amount: "",
      description: "",
      category: "DIGER",
      projectId: "",
      companyId: "",
      personnelId: ""
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({
      type: "GELIR",
      amount: "",
      description: "",
      category: "DIGER",
      projectId: "",
      companyId: "",
      personnelId: ""
    })
  }

  const openProgressPaymentModal = () => {
    setProgressPaymentForm({
      projectId: "",
      subcontractor: "",
      workType: "",
      unit: "",
      quantity: "",
      unitPrice: "",
      description: ""
    })
    setIsProgressPaymentModalOpen(true)
  }

  const closeProgressPaymentModal = () => {
    setIsProgressPaymentModalOpen(false)
    setProgressPaymentForm({
      projectId: "",
      subcontractor: "",
      workType: "",
      unit: "",
      quantity: "",
      unitPrice: "",
      description: ""
    })
  }

  const handleProgressPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!progressPaymentForm.projectId || !progressPaymentForm.subcontractor || !progressPaymentForm.workType || 
        !progressPaymentForm.unit || !progressPaymentForm.quantity || !progressPaymentForm.unitPrice) {
      toast.error("Gerekli alanları doldurun")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/progress-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...progressPaymentForm,
          quantity: parseFloat(progressPaymentForm.quantity),
          unitPrice: parseFloat(progressPaymentForm.unitPrice)
        })
      })

      if (response.ok) {
        toast.success("Hakediş başarıyla oluşturuldu")
        fetchProgressPayments()
        closeProgressPaymentModal()
      } else {
        toast.error("Hakediş oluşturulurken hata oluştu")
      }
    } catch (error) {
      toast.error("Hakediş oluşturulurken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProgressPaymentStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/progress-payments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success("Hakediş durumu güncellendi")
        fetchProgressPayments()
        fetchTransactions() // Refresh transactions in case a new transaction was created
      } else {
        toast.error("Durum güncellenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Durum güncellenirken hata oluştu")
    }
  }

  const handleDeleteProgressPayment = async (id: string) => {
    if (!window.confirm("Bu hakedişi silmek istediğinize emin misiniz?")) return;
    
    try {
      const response = await fetch(`/api/admin/progress-payments/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Hakediş silindi")
        fetchProgressPayments()
      } else {
        toast.error("Hakediş silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hakediş silinirken hata oluştu")
    }
  }

  const exportToExcel = () => {
    const filteredTransactions = getFilteredTransactions()
    const worksheetData = filteredTransactions.map(t => ({
      "Tarih": new Date(t.date).toLocaleDateString("tr-TR"),
      "Açıklama": t.description,
      "Kategori": t.category,
      "Tutar": t.amount,
      "Tip": t.type === "GELIR" ? "Gelir" : "Gider",
      "Proje": t.project?.name || "-",
      "Firma": t.company?.name || "-",
      "Personel": t.personnel?.name || "-"
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finans İşlemleri")
    XLSX.writeFile(workbook, "finans-raporu.xlsx")
    toast.success("Excel dosyası indirildi")
  }

  const exportToPDF = () => {
    const filteredTransactions = getFilteredTransactions()
    const doc = new jsPDF()
    
    autoTable(doc, {
      head: [["Tarih", "Açıklama", "Kategori", "Tutar", "Tip", "Proje", "Firma", "Personel"]],
      body: filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString("tr-TR"),
        t.description,
        t.category,
        `${t.amount.toLocaleString("tr-TR")} ₺`,
        t.type === "GELIR" ? "Gelir" : "Gider",
        t.project?.name || "-",
        t.company?.name || "-",
        t.personnel?.name || "-"
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 40 }, 2: { cellWidth: 20 }, 3: { cellWidth: 25 }, 4: { cellWidth: 15 }, 5: { cellWidth: 25 }, 6: { cellWidth: 25 }, 7: { cellWidth: 25 } }
    })

    doc.save("finans-raporu.pdf")
    toast.success("PDF dosyası indirildi")
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "MAAS": return "Maaş"
      case "SGK": return "SGK"
      case "HAKEDIS": return "Hakediş"
      case "MALZEME": return "Malzeme"
      case "DEMIR": return "Demir"
      case "BETON": return "Beton"
      case "NAKIYE": return "Nakliye"
      case "YEMEK": return "Yemek"
      case "TASERON": return "Taşeron"
      case "PRIM": return "Prim"
      case "AVANS": return "Avans"
      case "ELDEN": return "Elden"
      case "DIGER": return "Diğer"
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "MAAS": return "bg-blue-900/50 text-blue-400"
      case "SGK": return "bg-purple-900/50 text-purple-400"
      case "HAKEDIS": return "bg-green-900/50 text-green-400"
      case "MALZEME": return "bg-orange-900/50 text-orange-400"
      case "DEMIR": return "bg-red-900/50 text-red-400"
      case "BETON": return "bg-gray-900/50 text-gray-400"
      case "NAKIYE": return "bg-yellow-900/50 text-yellow-400"
      case "YEMEK": return "bg-pink-900/50 text-pink-400"
      case "TASERON": return "bg-teal-900/50 text-teal-400"
      case "PRIM": return "bg-indigo-900/50 text-indigo-400"
      case "AVANS": return "bg-amber-900/50 text-amber-400"
      case "ELDEN": return "bg-cyan-900/50 text-cyan-400"
      case "DIGER": return "bg-slate-900/50 text-slate-400"
      default: return "bg-slate-900/50 text-slate-400"
    }
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Finans Yönetimi
        </h1>
        <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
          {/* Date Filter */}
          <div className="flex gap-2 items-center bg-slate-900 rounded-lg p-2 border border-slate-800">
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
            />
            <button
              onClick={() => setDateFilter({ startDate: "", endDate: "" })}
              className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              Temizle
            </button>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 items-center bg-slate-900 rounded-lg p-2 border border-slate-800">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
            >
              <option value="TUMU">Tümü</option>
              <option value="MAAS">Maaş</option>
              <option value="SGK">SGK</option>
              <option value="HAKEDIS">Hakediş</option>
              <option value="MALZEME">Malzeme</option>
              <option value="DEMIR">Demir</option>
              <option value="BETON">Beton</option>
              <option value="NAKIYE">Nakliye</option>
              <option value="YEMEK">Yemek</option>
              <option value="TASERON">Taşeron</option>
              <option value="PRIM">Prim</option>
              <option value="AVANS">Avans</option>
              <option value="ELDEN">Elden</option>
              <option value="DIGER">Diğer</option>
            </select>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            >
              🟩 Excel İndir
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
            >
              🟥 PDF İndir
            </button>
            <button
              onClick={openProgressPaymentModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
            >
              🏗️ Yeni Hakediş
            </button>
            <button
              onClick={openModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Yeni İşlem Ekle
            </button>
          </div>
        </div>
      </div>

      {/* YDS Finance Metrics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-slate-400 mb-2">Toplam Hakediş</h3>
          <p className="text-3xl font-bold text-blue-400">
            ₺{stats.totalIncome.toLocaleString("tr-TR")}
          </p>
          <p className="text-xs text-slate-500 mt-1">Onaylanan hakedişler</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/30">
          <h3 className="text-lg font-semibold text-slate-400 mb-2">Tahsil Edilen</h3>
          <p className="text-3xl font-bold text-green-400">
            ₺{(stats.totalIncome * 0.72).toLocaleString("tr-TR")}
          </p>
          <p className="text-xs text-slate-500 mt-1">%72 tahsilat oranı</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-900/20 to-amber-900/20 rounded-xl p-6 border border-orange-500/30">
          <h3 className="text-lg font-semibold text-slate-400 mb-2">Bekleyen/Geciken</h3>
          <p className="text-3xl font-bold text-orange-400">
            ₺{(stats.totalIncome * 0.28).toLocaleString("tr-TR")}
          </p>
          <p className="text-xs text-slate-500 mt-1">%28 bekleyen tahsilat</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-900/20 to-violet-900/20 rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-lg font-semibold text-slate-400 mb-2">Tahmini Net</h3>
          <p className="text-3xl font-bold text-purple-400">
            ₺{(stats.totalIncome - stats.totalExpense).toLocaleString("tr-TR")}
          </p>
          <p className="text-xs text-slate-500 mt-1">Gelir - Gider</p>
        </div>
      </div>

      {/* AI Collection Risk Alert */}
      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-6 border border-red-500/30 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
              Tahsilat Risk AI
              <span className="px-2 py-0.5 bg-red-500/30 text-red-300 rounded text-xs">Yüksek Risk</span>
            </h3>
            <p className="text-slate-300 leading-relaxed">
              YİBF #1245 için ödeme gecikme riski yüksek (Son 6 ay trendi). Müteahhit firmayla iletişime geçilmesi önerilir.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-400">Toplam Ciro</h3>
            <span className="text-xs text-slate-500">Bu Ay</span>
          </div>
          <p className="text-3xl font-bold text-green-400">
            {stats.totalIncome.toLocaleString("tr-TR")} ₺
          </p>
          <p className="text-sm text-slate-500 mt-1">Hakedişler dahil</p>
        </div>
        
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-400">Tahsil Edilen</h3>
            <span className="text-xs text-slate-500">Kasa</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">
            {stats.netBalance.toLocaleString("tr-TR")} ₺
          </p>
          <p className="text-sm text-slate-500 mt-1">Mevcut bakiye</p>
        </div>
        
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-400">Bekleyen Hakedişler</h3>
            <span className="text-xs text-slate-500">Onay bekliyor</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">
            {progressPayments.filter(p => p.status === "BEKLIYOR").length}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {progressPayments.filter(p => p.status === "BEKLIYOR").reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString("tr-TR")} ₺
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-400">Geciken Ödemeler</h3>
            <span className="text-xs text-red-400">Risk</span>
          </div>
          <p className="text-3xl font-bold text-red-400">
            {transactions.filter(t => t.type === "GIDER" && new Date(t.date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
          </p>
          <p className="text-sm text-slate-500 mt-1">Son 30 gün</p>
        </div>
      </div>

      {/* Financial Chart */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Aylık Gelir-Gider Grafiği</h3>
          <span className="text-sm text-slate-400">Son 6 ay</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { month: 'Ocak', gelir: 150000, gider: 120000 },
            { month: 'Şubat', gelir: 180000, gider: 140000 },
            { month: 'Mart', gelir: 200000, gider: 150000 },
            { month: 'Nisan', gelir: 220000, gider: 160000 },
            { month: 'Mayıs', gelir: 190000, gider: 145000 },
            { month: 'Haziran', gelir: 250000, gider: 180000 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar dataKey="gelir" fill="#22c55e" name="Gelir" />
            <Bar dataKey="gider" fill="#ef4444" name="Gider" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Payments Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Taşeron Hakedişleri */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">🏗️ Taşeron Hakedişleri</h3>
            <span className="text-sm text-slate-400">Toplam: {progressPayments.length} hakediş</span>
          </div>
          <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full min-w-max">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Taşeron</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Tutar</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {progressPayments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      Hakediş kaydı bulunamadı
                    </td>
                  </tr>
                ) : (
                  (Array.isArray(progressPayments) ? progressPayments.slice(0, 5) : []).map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3 text-sm text-white">{payment.subcontractor}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{payment.totalAmount?.toLocaleString("tr-TR")} ₺</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.status === "BEKLIYOR" ? "bg-yellow-900/50 text-yellow-400" :
                          payment.status === "ONAYLANDI" ? "bg-green-900/50 text-green-400" :
                          "bg-red-900/50 text-red-400"
                        }`}>
                          {payment.status === "BEKLIYOR" ? "Bekliyor" :
                           payment.status === "ONAYLANDI" ? "Onaylandı" : "Reddedildi"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Son Hakediş Hareketleri */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">📊 Son Hakediş Hareketleri</h3>
            <span className="text-sm text-slate-400">Son 5 işlem</span>
          </div>
          <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full min-w-max">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Proje</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Tutar</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      İşlem kaydı bulunamadı
                    </td>
                  </tr>
                ) : (
                  (Array.isArray(transactions) ? transactions.slice(0, 5) : []).map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3 text-sm text-white">{transaction.description || 'Genel'}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${transaction.type === "GELIR" ? "text-green-400" : "text-red-400"}`}>
                        {transaction.type === "GELIR" ? "+" : "-"}{transaction.amount?.toLocaleString("tr-TR")} ₺
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(transaction.date).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Tarih</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Açıklama</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Kategori</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Tutar</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Tip</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Proje</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Firma</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Personel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : getFilteredTransactions().length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  İşlem kaydı bulunamadı
                </td>
              </tr>
            ) : (
              (Array.isArray(getFilteredTransactions()) ? getFilteredTransactions() : []).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {new Date(transaction.date).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-4 text-sm text-white">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                      {getCategoryLabel(transaction.category)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-white font-medium">
                    {transaction.amount.toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.type === "GELIR" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                    }`}>
                      {transaction.type === "GELIR" ? "Gelir" : "Gider"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {transaction.project?.name || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {transaction.company?.name || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {transaction.personnel?.name || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">Yeni İşlem Ekle</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tip *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="GELIR">Gelir</option>
                  <option value="GIDER">Gider</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tutar *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Tutar..."
                  required
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Açıklama *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Açıklama..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Kategori *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="MAAS">Maaş</option>
                  <option value="SGK">SGK</option>
                  <option value="HAKEDIS">Hakediş</option>
                  <option value="MALZEME">Malzeme</option>
                  <option value="DEMIR">Demir</option>
                  <option value="BETON">Beton</option>
                  <option value="NAKIYE">Nakliye</option>
                  <option value="YEMEK">Yemek</option>
                  <option value="TASERON">Taşeron</option>
                  <option value="PRIM">Prim</option>
                  <option value="AVANS">Avans</option>
                  <option value="ELDEN">Elden</option>
                  <option value="DIGER">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  İlgili Proje
                </label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Proje Seçin</option>
                  {(Array.isArray(projects) ? projects : []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  İlgili Firma
                </label>
                <select
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Firma Seçin</option>
                  {(Array.isArray(companies) ? companies : []).map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  İlgili Personel
                </label>
                <select
                  name="personnelId"
                  value={formData.personnelId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Personel Seçin</option>
                  {(Array.isArray(personnel) ? personnel : []).map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Payment Modal */}
      {isProgressPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">🏗️ Yeni Hakediş (Metraj) Föyü</h3>
            
            <form onSubmit={handleProgressPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Proje *
                </label>
                <select
                  value={progressPaymentForm.projectId}
                  onChange={(e) => setProgressPaymentForm({ ...progressPaymentForm, projectId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">Proje Seçin</option>
                  {(Array.isArray(projects) ? projects : []).map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Taşeron Adı *
                </label>
                <input
                  type="text"
                  value={progressPaymentForm.subcontractor}
                  onChange={(e) => setProgressPaymentForm({ ...progressPaymentForm, subcontractor: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Taşeron firma adı..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Yapılan İş Tipi *
                </label>
                <select
                  value={progressPaymentForm.workType}
                  onChange={(e) => setProgressPaymentForm({ ...progressPaymentForm, workType: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">İş Tipi Seçin</option>
                  <option value="Kalıp">Kalıp</option>
                  <option value="Demir">Demir</option>
                  <option value="Duvar">Duvar</option>
                  <option value="Sıva">Sıva</option>
                  <option value="Seramik">Seramik</option>
                  <option value="Boya">Boya</option>
                  <option value="Hafriyat">Hafriyat</option>
                  <option value="Beton">Beton</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Birim *
                </label>
                <select
                  value={progressPaymentForm.unit}
                  onChange={(e) => setProgressPaymentForm({ ...progressPaymentForm, unit: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                >
                  <option value="">Birim Seçin</option>
                  <option value="m2">m²</option>
                  <option value="m3">m³</option>
                  <option value="ton">ton</option>
                  <option value="kg">kg</option>
                  <option value="adet">adet</option>
                  <option value="mtül">mtül</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Miktar / Metraj *
                </label>
                <input
                  type="number"
                  value={progressPaymentForm.quantity}
                  onChange={(e) => setProgressPaymentForm({ ...progressPaymentForm, quantity: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Örn: 150"
                  required
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Birim Fiyat (TL) *
                </label>
                <input
                  type="number"
                  value={progressPaymentForm.unitPrice}
                  onChange={(e) => setProgressPaymentForm({ ...progressPaymentForm, unitPrice: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Örn: 25"
                  required
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Toplam Tutar
                </label>
                <input
                  type="text"
                  value={progressPaymentForm.quantity && progressPaymentForm.unitPrice 
                    ? (parseFloat(progressPaymentForm.quantity) * parseFloat(progressPaymentForm.unitPrice)).toLocaleString("tr-TR") + " ₺"
                    : "0 ₺"}
                  disabled
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={progressPaymentForm.description}
                  onChange={(e) => setProgressPaymentForm({ ...progressPaymentForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 resize-none"
                  placeholder="Örn: B Blok 3. Kat Kalıp İşçiliği"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeProgressPaymentModal}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Kaydediliyor..." : "Hakedişi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
