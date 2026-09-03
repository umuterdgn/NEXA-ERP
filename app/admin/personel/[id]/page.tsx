"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { Nfc } from "lucide-react"
import { createPersonnelNfcPayload } from "@/lib/nfc-crypto"

export default function PersonelDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const [person, setPerson] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [assignedInventory, setAssignedInventory] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [assignedTasks, setAssignedTasks] = useState<any[]>([])
  const [assignedEquipment, setAssignedEquipment] = useState<any[]>([])
  const [inspectionRecords, setInspectionRecords] = useState<any[]>([])
  const [deficiencies, setDeficiencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [financialSummary, setFinancialSummary] = useState<any>({
    dailyWage: 0,
    totalDayMultiplier: 0,
    totalOvertimeHours: 0,
    totalBaseEarned: 0,
    totalOvertimeEarned: 0,
    totalBonuses: 0,
    totalPaid: 0,
    totalEarned: 0,
    currentBalance: 0
  })
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  const [isNfcWriting, setIsNfcWriting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    personnelNo: "",
    name: "",
    tcNo: "",
    nfcUid: "",
    age: "",
    birthDate: "",
    department: "",
    currentSite: "",
    phone: "",
    email: "",
    hireDate: "",
    salary: "",
    salaryPayDay: "",
    sgkPeriod: "",
    sgkPayDay: "",
    healthStatus: "",
    bonuses: "",
    takim: "",
    gunlukYevmiye: "",
    professionId: ""
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    type: "ELDEN",
    description: ""
  })
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    role: "STAFF"
  })
  const [certificateForm, setCertificateForm] = useState({
    name: "",
    expiryDate: "",
    documentUrl: "",
    type: "SERTIFIKA"
  })
  const router = useRouter()

  useEffect(() => {
    const resolveParams = async () => {
      const p = await params
      setResolvedParams(p)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      fetchPerson()
      fetchPayments()
      fetchAssignedInventory()
      fetchCertificates()
    }
  }, [resolvedParams])

  const calculatedValues = useMemo(() => {
    const summary = financialSummary || {}

    const totalDayMultiplier = Number(summary.totalDayMultiplier ?? attendanceRecords.reduce((sum: number, record: any) => {
      return sum + Number(record.dayMultiplier ?? 0)
    }, 0))

    const totalOvertimeHours = Number(summary.totalOvertimeHours ?? attendanceRecords.reduce((sum: number, record: any) => {
      return sum + Number(record.overtimeHours ?? 0)
    }, 0))

    const dailyWage = Number(summary.dailyWage ?? person?.gunlukYevmiye ?? 0)
    const totalBaseEarned = Number(summary.totalBaseEarned ?? (totalDayMultiplier * dailyWage))
    const totalOvertimeEarned = Number(summary.totalOvertimeEarned ?? (totalOvertimeHours * ((dailyWage / 9) * 1.5)))
    const toplamPrim = Number(summary.totalBonuses ?? payments.reduce((sum: number, p: any) => {
      if (p.type === 'PRIM') {
        return sum + Number(p.amount ?? 0)
      }
      return sum
    }, 0))
    const kesintilerToplami = Number(summary.totalPaid ?? payments.reduce((sum: number, p: any) => {
      if (p.type === 'MAAS' || p.type === 'AVANS' || p.type === 'ELDEN') {
        return sum + Number(p.amount ?? 0)
      }
      return sum
    }, 0))
    const toplamKazanilan = Number(summary.totalEarned ?? (totalBaseEarned + totalOvertimeEarned + toplamPrim))
    const netOdenecek = Number(summary.currentBalance ?? (toplamKazanilan - kesintilerToplami))
    const tamGunSayisi = attendanceRecords.filter((record: any) => Number(record.dayMultiplier ?? 0) === 1).length
    const yarimGunSayisi = attendanceRecords.filter((record: any) => Number(record.dayMultiplier ?? 0) === 0.5).length
    const toplamMesaiSaati = totalOvertimeHours
    const toplamMesai = totalOvertimeEarned
    const grossEntitlement = totalBaseEarned
    const paymentProgress = Math.min(100, Math.max(0, (kesintilerToplami / Math.max(toplamKazanilan, 1)) * 100))

    return {
      toplamKazanilan,
      kesintilerToplami,
      netOdenecek,
      tamGunSayisi,
      yarimGunSayisi,
      totalDayMultiplier,
      grossEntitlement,
      toplamPrim,
      toplamMesai,
      toplamMesaiSaati,
      paymentProgress,
      totalOvertimeHours,
      totalBaseEarned,
      totalOvertimeEarned,
      currentBalance: netOdenecek
    }
  }, [person, payments, attendanceRecords, financialSummary])

  const fetchPerson = async () => {
    try {
      const response = await fetch(`/api/admin/personnel/${resolvedParams?.id}`)
      if (response.ok) {
        const data = await response.json()
        setPerson(data)
        if (data.financialSummary) {
          setFinancialSummary(data.financialSummary)
        }
        if (data.payments) {
          setPayments(data.payments)
        }
        if (data.inventoryHistory) {
          setAssignedInventory(data.inventoryHistory)
        }
        if (data.attendanceRecords) {
          setAttendanceRecords(data.attendanceRecords)
        }
        if (data.assignedTasks) {
          setAssignedTasks(data.assignedTasks)
        }
        if (data.assignedEquipment) {
          setAssignedEquipment(data.assignedEquipment)
        }
        if (data.inspectionRecords) {
          setInspectionRecords(data.inspectionRecords)
        }
        if (data.deficiencies) {
          setDeficiencies(data.deficiencies)
        }
      } else {
        notFound()
      }
    } catch (error) {
      console.error("Failed to fetch person:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/admin/personnel/${resolvedParams?.id}/payments`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error)
    }
  }

  const fetchAssignedInventory = async () => {
    try {
      const response = await fetch(`/api/admin/personnel/${resolvedParams?.id}/inventory`)
      if (response.ok) {
        const data = await response.json()
        setAssignedInventory(data)
      }
    } catch (error) {
      console.error("Failed to fetch assigned inventory:", error)
    }
  }

  const fetchCertificates = async () => {
    try {
      const response = await fetch(`/api/admin/personnel/${resolvedParams?.id}/certificates`)
      if (response.ok) {
        const data = await response.json()
        setCertificates(data)
      }
    } catch (error) {
      console.error("Failed to fetch certificates:", error)
    }
  }

  const handlePayment = async (type: "MAAS" | "SGK" | "PRIM") => {
    if (!person) return

    try {
      // Önce PersonelPayment tablosuna kaydet
      const paymentResponse = await fetch("/api/admin/personnel-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personelId: person.id,
          type: type,
          amount: type === "MAAS" ? person.salary : type === "PRIM" ? person.bonuses : 0,
          description: type === "MAAS" ? "Maaş Ödemesi" : type === "SGK" ? "SGK Ödemesi" : "Prim Ödemesi",
          isPaid: true,
          paidDate: new Date()
        })
      })

      if (paymentResponse.ok) {
        toast.success("Ödeme başarıyla işlendi")
        fetchPayments()
      } else {
        toast.error("Ödeme işlenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Ödeme işlenirken hata oluştu")
    }
  }

  const handleManualPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!person || !paymentForm.amount) {
      toast.error("Tutar girin")
      return
    }

    try {
      const response = await fetch("/api/admin/personnel-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personelId: person.id,
          type: paymentForm.type,
          amount: parseFloat(paymentForm.amount),
          description: paymentForm.description || (paymentForm.type === "ELDEN" ? "Elden Nakit Ödemesi" : "Manuel Prim Ödemesi"),
          isPaid: true,
          paidDate: new Date()
        })
      })

      if (response.ok) {
        toast.success("Ödeme başarıyla işlendi")
        setIsPaymentModalOpen(false)
        setPaymentForm({ amount: "", type: "ELDEN", description: "" })
        fetchPayments()
      } else {
        toast.error("Ödeme işlenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Ödeme işlenirken hata oluştu")
    }
  }

  const openEditModal = () => {
    if (!person) return
    setEditFormData({
      personnelNo: person.personnelNo || "",
      name: person.name,
      tcNo: person.tcNo || "",
      nfcUid: person.nfcUid || "",
      age: person.age?.toString() || "",
      birthDate: person.birthDate ? new Date(person.birthDate).toISOString().split('T')[0] : "",
      department: person.department || "",
      currentSite: person.currentSite || "",
      phone: person.phone || "",
      email: person.email || "",
      hireDate: person.hireDate ? new Date(person.hireDate).toISOString().split('T')[0] : "",
      salary: person.salary?.toString() || "0",
      salaryPayDay: person.salaryPayDay?.toString() || "",
      sgkPeriod: person.sgkPeriod || "",
      sgkPayDay: person.sgkPayDay?.toString() || "",
      healthStatus: person.healthStatus || "",
      bonuses: person.bonuses?.toString() || "0",
      takim: person.takim || "",
      gunlukYevmiye: person.gunlukYevmiye?.toString() || "0",
      professionId: person.professionId || ""
    })
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditFormData({
      personnelNo: "",
      name: "",
      tcNo: "",
      nfcUid: "",
      age: "",
      birthDate: "",
      department: "",
      currentSite: "",
      phone: "",
      email: "",
      hireDate: "",
      salary: "",
      salaryPayDay: "",
      sgkPeriod: "",
      sgkPayDay: "",
      healthStatus: "",
      bonuses: "",
      takim: "",
      gunlukYevmiye: "",
      professionId: ""
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!person) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/personnel/${person.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...editFormData,
          age: parseInt(editFormData.age),
          birthDate: editFormData.birthDate ? new Date(editFormData.birthDate) : null,
          hireDate: editFormData.hireDate ? new Date(editFormData.hireDate) : null,
          salary: parseFloat(editFormData.salary),
          salaryPayDay: editFormData.salaryPayDay ? parseInt(editFormData.salaryPayDay) : null,
          sgkPeriod: editFormData.sgkPeriod || null,
          sgkPayDay: editFormData.sgkPayDay ? parseInt(editFormData.sgkPayDay) : null,
          healthStatus: editFormData.healthStatus || null,
          bonuses: parseFloat(editFormData.bonuses),
          gunlukYevmiye: parseFloat(editFormData.gunlukYevmiye),
          professionId: editFormData.professionId || null
        })
      })

      if (response.ok) {
        toast.success("Personel güncellendi")
        closeEditModal()
        router.refresh()
      } else {
        toast.error("Personel güncellenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Personel güncellenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLoginGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!person || !loginForm.username || !loginForm.password) {
      toast.error("Kullanıcı adı ve şifre gereklidir")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/personnel/${person.id}/grant-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...loginForm,
          email: `${loginForm.username}@mahir-bakay.local` // Generate dummy email for User model
        })
      })

      if (response.ok) {
        toast.success("Sisteme giriş izni verildi")
        setIsLoginModalOpen(false)
        setLoginForm({ username: "", password: "", role: "STAFF" })
        fetchPerson()
      } else {
        const error = await response.json()
        toast.error(error.error || "Giriş izni verilirken hata oluştu")
      }
    } catch (error) {
      toast.error("Giriş izni verilirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNfcWrite = async () => {
    if (!person || !('NDEFReader' in window)) {
      toast.error("Bu tarayıcı Web NFC'yi desteklemiyor. Lütfen Android Chrome kullanın.")
      return
    }

    setIsNfcWriting(true)
    try {
      const ndef = new (window as any).NDEFReader()
      const encryptedData = createPersonnelNfcPayload(person.id)
      
      await ndef.write({
        records: [{
          recordType: "mime",
          mediaType: "application/vnd.mahirbakay.erp",
          data: new TextEncoder().encode(encryptedData)
        }]
      })
      
      toast.success("NFC Kart başarıyla programlandı ve şifrelendi!")
      setIsNfcModalOpen(false)
    } catch (error) {
      console.error("NFC write error:", error)
      toast.error("NFC kart yazma hatası oluştu")
    } finally {
      setIsNfcWriting(false)
    }
  }

  const handleCertificateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!person || !certificateForm.name || !certificateForm.expiryDate) {
      toast.error("Sertifika adı ve bitiş tarihi zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personelId: person.id,
          name: certificateForm.name,
          expiryDate: new Date(certificateForm.expiryDate),
          documentUrl: certificateForm.documentUrl || null,
          type: certificateForm.type
        })
      })

      if (response.ok) {
        toast.success("Sertifika başarıyla eklendi")
        setIsCertificateModalOpen(false)
        setCertificateForm({ name: "", expiryDate: "", documentUrl: "", type: "SERTIFIKA" })
        fetchCertificates()
      } else {
        toast.error("Sertifika eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Sertifika eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCertificateEdit = (certificate: any) => {
    setSelectedCertificate(certificate)
    setCertificateForm({
      name: certificate.name,
      expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate).toISOString().split('T')[0] : "",
      documentUrl: certificate.documentUrl || "",
      type: certificate.type || "SERTIFIKA"
    })
    setIsCertificateModalOpen(true)
  }

  const handleCertificateUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCertificate || !certificateForm.name || !certificateForm.expiryDate) {
      toast.error("Sertifika adı ve bitiş tarihi zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/certificates/${selectedCertificate.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: certificateForm.name,
          expiryDate: new Date(certificateForm.expiryDate),
          documentUrl: certificateForm.documentUrl || null,
          type: certificateForm.type
        })
      })

      if (response.ok) {
        toast.success("Sertifika başarıyla güncellendi")
        setIsCertificateModalOpen(false)
        setSelectedCertificate(null)
        setCertificateForm({ name: "", expiryDate: "", documentUrl: "", type: "SERTIFIKA" })
        fetchCertificates()
      } else {
        toast.error("Sertifika güncellenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Sertifika güncellenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCertificateDelete = async (certificateId: string) => {
    if (!confirm("Bu sertifikayı silmek istediğinize emin misiniz?")) return

    try {
      const response = await fetch(`/api/admin/certificates/${certificateId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Sertifika silindi")
        fetchCertificates()
      } else {
        toast.error("Sertifika silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Sertifika silinirken hata oluştu")
    }
  }

  const getCertificateStatus = (expiryDate: string | Date) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { label: "Süresi Geçmiş", color: "bg-red-900/50 text-red-400", critical: true }
    } else if (diffDays <= 30) {
      return { label: "Kritik", color: "bg-orange-900/50 text-orange-400", critical: true }
    } else {
      return { label: "Geçerli", color: "bg-green-900/50 text-green-400", critical: false }
    }
  }

  if (loading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  if (!person) {
    notFound()
  }

  return (
    <div className="lg:mt-0 mt-16 w-full max-w-7xl mx-auto px-2 md:px-4 overflow-x-hidden">
      <div className="mb-6">
        <Link
          href="/admin/personel"
          className="text-slate-400 hover:text-slate-200 text-sm"
        >
          ← Personel Listesine Dön
        </Link>
      </div>

      <div className="bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-white mb-2 break-words">
              {person.name}
            </h1>
            <p className="text-slate-400 text-sm md:text-base">Personel No: {person.personnelNo}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:space-x-3">
            <button
              onClick={openEditModal}
              className="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm md:text-base"
            >
              Düzenle
            </button>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3 py-2 md:px-4 md:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              🔑 {person.userId ? "Giriş Bilgilerini Güncelle" : "Sisteme Giriş İzni Ver"}
            </button>
            <button
              onClick={() => setIsNfcModalOpen(true)}
              className="px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              <Nfc className="w-4 h-4" />
              NFC Karta Programla
            </button>
            <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
              person.status === "ACTIVE" 
                ? "bg-green-900/50 text-green-400" 
                : "bg-red-900/50 text-red-400"
            }`}>
              {person.status === "ACTIVE" ? "Aktif" : "Pasif"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Kişisel Bilgiler</h3>
            
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Yaş</label>
                <p className="text-white break-words">{person.age}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">TC Kimlik No</label>
                <p className="text-white break-words">{person.tcNo || "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Doğum Tarihi</label>
                <p className="text-white break-words">
                  {new Date(person.birthDate).toLocaleDateString("tr-TR")}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Cinsiyet</label>
                <p className="text-white break-words">{person.gender || "-"}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Telefon</label>
              <p className="text-white break-words">{person.phone || "-"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">E-posta</label>
              <p className="text-white break-words">{person.email || "-"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Adres</label>
              <p className="text-white break-words">{person.address || "-"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Sağlık Durumu</label>
              <p className="text-white break-words">{person.healthStatus || "-"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">İş Bilgileri</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Birim</label>
              <p className="text-white break-words">{person.department}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Görev/Ünvan</label>
              <p className="text-white break-words">{person.position || "-"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Mevcut Şantiye</label>
              <p className="text-white break-words">{person.currentSite}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">İşe Giriş Tarihi</label>
              <p className="text-white break-words">
                {new Date(person.hireDate).toLocaleDateString("tr-TR")}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">İşten Çıkış Tarihi</label>
              <p className="text-white break-words">
                {person.leavingDate 
                  ? new Date(person.leavingDate).toLocaleDateString("tr-TR")
                  : "-"
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">İş Türü</label>
              <p className="text-white break-words">{person.employmentType || "-"}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 mb-4">Finans ve Özlük Bilgileri</h3>
          
          {/* Hakediş Hesaplama */}
          <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700 mb-4">
            <h4 className="text-md font-semibold text-white mb-3">Hakediş Hesabı</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
              <div>
                <label className="block text-slate-400 mb-1">Tam Gün Sayısı</label>
                <p className="text-white font-medium break-words">
                  {calculatedValues.tamGunSayisi}
                </p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Yarım Gün Sayısı</label>
                <p className="text-white font-medium break-words">
                  {calculatedValues.yarimGunSayisi}
                </p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Günlük Yevmiye</label>
                <p className="text-white font-medium break-words">
                  {person.gunlukYevmiye?.toLocaleString("tr-TR") || 0} ₺
                </p>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Toplam Gün Çarpanı</label>
                <p className="text-white font-medium break-words">
                  {calculatedValues.totalDayMultiplier.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Güncel Bakiye Kartı */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-800 rounded-xl p-4 md:p-6 border border-blue-700 mb-6">
            <h4 className="text-lg md:text-xl font-bold text-white mb-4">GÜNCEL BAKİYE (ÖDENECEK)</h4>
            <div className="text-center">
              <p className="text-3xl md:text-5xl font-bold text-blue-400 mb-2 break-words">
                ₺{calculatedValues.netOdenecek.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-slate-400 text-sm">
                Toplam Kazanılan - Kesintiler
              </p>
            </div>
          </div>

          {/* Hesaplama Detayları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">Brüt Hakediş</label>
              <p className="text-xl md:text-2xl font-bold text-green-400 break-words">
                ₺{calculatedValues.grossEntitlement.toLocaleString("tr-TR")}
              </p>
              <p className="text-xs text-slate-500 mt-1">Gün Çarpanı × Yevmiye</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">Toplam Prim</label>
              <p className="text-xl md:text-2xl font-bold text-purple-400 break-words">
                ₺{calculatedValues.toplamPrim.toLocaleString("tr-TR")}
              </p>
              <p className="text-xs text-slate-500 mt-1">Prim Ödemeleri</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">Kesintiler Toplamı</label>
              <p className="text-xl md:text-2xl font-bold text-red-400 break-words">
                ₺{calculatedValues.kesintilerToplami.toLocaleString("tr-TR")}
              </p>
              <p className="text-xs text-slate-500 mt-1">Maaş + Avans + Elden</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">Toplam Kazanılan</label>
              <p className="text-xl md:text-2xl font-bold text-green-400 break-words">
                ₺{calculatedValues.toplamKazanilan.toLocaleString("tr-TR")}
              </p>
              <p className="text-xs text-slate-500 mt-1">Brüt + Prim + Mesai</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">Mesai Saati</label>
              <p className="text-xl md:text-2xl font-bold text-purple-400 break-words">
                {calculatedValues.toplamMesaiSaati.toFixed(1)} saat
              </p>
              <p className="text-xs text-slate-500 mt-1">Toplam Mesai</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">Mesai Kazancı</label>
              <p className="text-xl md:text-2xl font-bold text-purple-400 break-words">
                ₺{calculatedValues.toplamMesai.toLocaleString("tr-TR")}
              </p>
              <p className="text-xs text-slate-500 mt-1">1.5x Saatlik Ücret</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">Kesintiler Toplamı</label>
              <p className="text-xl md:text-2xl font-bold text-red-400 break-words">
                ₺{calculatedValues.kesintilerToplami.toLocaleString("tr-TR")}
              </p>
              <p className="text-xs text-slate-500 mt-1">Maaş + Avans + Elden</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">Net Ödenecek</label>
              <p className="text-xl md:text-2xl font-bold text-blue-400 break-words">
                ₺{calculatedValues.netOdenecek.toLocaleString("tr-TR")}
              </p>
              <p className="text-xs text-slate-500 mt-1">Kalan Bakiye</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-400">Ödeme Durumu</label>
                <span className="text-xs text-slate-300">{calculatedValues.paymentProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500 transition-all duration-300"
                  style={{ width: `${calculatedValues.paymentProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-300 break-words">
                Formül: (Gün çarpanı × yevmiye + prim + mesai) − kesintiler
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">Maaş</label>
              <p className="text-xl md:text-2xl font-bold text-white mb-2 break-words">
                {person.salary.toLocaleString("tr-TR")} ₺
              </p>
              {person.salaryPayDay && (
                <p className="text-xs text-slate-500 mb-2">Ödeme Günü: {person.salaryPayDay}</p>
              )}
              {(() => {
                const today = new Date().getDate()
                const payDay = person.salaryPayDay
                if (payDay && today > payDay) {
                  return <span className="inline-block px-2 py-0.5 bg-red-900/50 text-red-400 text-xs rounded-full mb-2">Ödeme Gecikti</span>
                } else if (payDay && today >= payDay - 3) {
                  return <span className="inline-block px-2 py-0.5 bg-orange-900/50 text-orange-400 text-xs rounded-full mb-2">Ödeme Yaklaştı</span>
                }
                return null
              })()}
              <button
                onClick={() => handlePayment("MAAS")}
                className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
              >
                Maaş Öde
              </button>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">SGK Durumu / Dönemi</label>
              <p className="text-xl md:text-2xl font-bold text-white mb-2 break-words">
                {person.sgkPeriod || "Belirtilmedi"}
              </p>
              {person.sgkPayDay && (
                <p className="text-xs text-slate-500 mb-2">Ödeme Günü: {person.sgkPayDay}</p>
              )}
              {(() => {
                const today = new Date().getDate()
                const payDay = person.sgkPayDay
                if (payDay && today > payDay) {
                  return <span className="inline-block px-2 py-0.5 bg-red-900/50 text-red-400 text-xs rounded-full mb-2">Ödeme Gecikti</span>
                } else if (payDay && today >= payDay - 3) {
                  return <span className="inline-block px-2 py-0.5 bg-orange-900/50 text-orange-400 text-xs rounded-full mb-2">Ödeme Yaklaştı</span>
                }
                return null
              })()}
              <button
                onClick={() => handlePayment("SGK")}
                className="w-full px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm"
              >
                SGK Öde
              </button>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-3 md:p-4 border border-slate-700">
              <label className="block text-sm font-medium text-slate-400 mb-1">Primler / Avans</label>
              <p className="text-xl md:text-2xl font-bold text-white mb-2 break-words">
                {person.bonuses.toLocaleString("tr-TR")} ₺
              </p>
              <button
                onClick={() => handlePayment("PRIM")}
                className="w-full px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors text-sm mb-2"
              >
                Prim Öde
              </button>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors text-sm"
              >
                Manuel Ödeme
              </button>
            </div>

            {/* AI Risk Analysis */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-3 md:p-4 border border-purple-500/30">
              <label className="block text-sm font-medium text-purple-300 mb-1 flex items-center gap-2">
                <span className="text-lg">✨</span>
                AI Risk Analizi
              </label>
              <div className="mt-2">
                <p className="text-green-400 text-sm font-medium mb-1">Durum: Güvenli</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  SGK evrakları tam. Haftalık çalışma süresi optimum.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Finansal İşlem Geçmişi */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 mb-4">Finansal İşlem Geçmişi</h3>
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Henüz finansal işlem yok
              </div>
            ) : (
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Tarih</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">İşlem Tipi</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Açıklama</th>
                    <th className="text-right py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        {new Date(payment.date).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="py-3 px-2 md:px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.type === "MAAS" ? "bg-blue-900/50 text-blue-400" :
                          payment.type === "SGK" ? "bg-purple-900/50 text-purple-400" :
                          payment.type === "PRIM" ? "bg-green-900/50 text-green-400" :
                          payment.type === "AVANS" ? "bg-red-900/50 text-red-400" :
                          "bg-amber-900/50 text-amber-400"
                        }`}>
                          {payment.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        {payment.description || "-"}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-right font-medium text-xs md:text-sm break-words">
                        <span className={
                          payment.type === "PRIM" ? "text-green-400" : "text-white"
                        }>
                          {payment.amount.toLocaleString("tr-TR")} ₺
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Yoklama Kayıtları */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 mb-4">Yoklama Kayıtları</h3>
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
            {!attendanceRecords || attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Henüz yoklama kaydı yok
              </div>
            ) : (
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Tarih</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Proje</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Giriş</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Çıkış</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Gün Çarpanı</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords?.map((record: any) => (
                    <tr key={record.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        {new Date(record.date).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        {record.project?.name || record.project?.title || "-"}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-green-400 text-xs md:text-sm break-words">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString("tr-TR") : "-"}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-red-400 text-xs md:text-sm break-words">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString("tr-TR") : "-"}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        {record.dayMultiplier || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Atanan Projeler ve Görevler */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 mb-4">Atanan Projeler ve Görevler</h3>
          
          {assignedTasks.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 text-center text-slate-400">
              Atanan proje/görev bulunmuyor
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Görev Adı</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Proje</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Durum</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Son Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedTasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{task.title}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{task.project?.name || "-"}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.status === 'DONE' ? 'bg-green-500/20 text-green-400' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                          task.status === 'IN_REVIEW' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {task.status === 'DONE' ? 'Tamamlandı' :
                           task.status === 'IN_PROGRESS' ? 'Devam Ediyor' :
                           task.status === 'IN_REVIEW' ? 'İncelemede' :
                           task.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("tr-TR") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Zimmetli Ekipmanlar */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 mb-4">Zimmetli Ekipmanlar</h3>
          
          {assignedInventory.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 text-center text-slate-400">
              Zimmetli ekipman bulunmuyor
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Malzeme Adı</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Miktar</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Birim</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Proje</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Zimmet Tarihi</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedInventory.map((item) => (
                    <tr key={item.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{item.inventory?.name || "-"}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{item.quantity}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{item.inventory?.unit || "-"}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{item.project?.name || "-"}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Atanan Ekipmanlar */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 mb-4">Atanan Ekipmanlar</h3>
          
          {assignedEquipment.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 text-center text-slate-400">
              Atanan ekipman bulunmuyor
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Ekipman Adı</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Tür</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Proje</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedEquipment.map((equipment) => (
                    <tr key={equipment.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{equipment.name}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{equipment.type}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{equipment.project?.name || "-"}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        <span className={`px-2 py-1 rounded text-xs ${
                          equipment.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                          equipment.status === 'MAINTENANCE' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {equipment.status === 'ACTIVE' ? 'Aktif' :
                           equipment.status === 'MAINTENANCE' ? 'Bakımda' :
                           equipment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Denetim Kayıtları */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 mb-4">Denetim Kayıtları</h3>
          
          {inspectionRecords.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 text-center text-slate-400">
              Denetim kaydı bulunmuyor
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Kategori</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Durum</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">YİBF Proje</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectionRecords.map((record) => (
                    <tr key={record.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{record.category}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        <span className={`px-2 py-1 rounded text-xs ${
                          record.status === 'PASS' ? 'bg-green-500/20 text-green-400' :
                          record.status === 'FAIL' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {record.status === 'PASS' ? 'Geçti' :
                           record.status === 'FAIL' ? 'Kaldı' :
                           'Beklemede'}
                        </span>
                      </td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{record.yibf?.yibfNo || "-"}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        {new Date(record.timestamp).toLocaleDateString("tr-TR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bulunan Eksiklikler */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 mb-4">Bulunan Eksiklikler</h3>
          
          {deficiencies.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 text-center text-slate-400">
              Eksiklik kaydı bulunmuyor
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Kategori</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Eleman</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Öncelik</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Durum</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Proje</th>
                  </tr>
                </thead>
                <tbody>
                  {deficiencies.map((deficiency) => (
                    <tr key={deficiency.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{deficiency.category}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{deficiency.element}</td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        <span className={`px-2 py-1 rounded text-xs ${
                          deficiency.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                          deficiency.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                          deficiency.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {deficiency.priority === 'CRITICAL' ? 'Kritik' :
                           deficiency.priority === 'HIGH' ? 'Yüksek' :
                           deficiency.priority === 'MEDIUM' ? 'Orta' :
                           deficiency.priority}
                        </span>
                      </td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                        <span className={`px-2 py-1 rounded text-xs ${
                          deficiency.status === 'CLOSED' ? 'bg-green-500/20 text-green-400' :
                          deficiency.status === 'OPEN' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {deficiency.status === 'CLOSED' ? 'Kapatıldı' :
                           deficiency.status === 'OPEN' ? 'Açık' :
                           deficiency.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">{deficiency.project?.name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sertifikalar ve Belgeler */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Sertifikalar ve Belgeler</h3>
            <button
              onClick={() => {
                setSelectedCertificate(null)
                setCertificateForm({ name: "", expiryDate: "", documentUrl: "", type: "SERTIFIKA" })
                setIsCertificateModalOpen(true)
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              + Yeni Ekle
            </button>
          </div>
          
          {certificates.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 text-center text-slate-400">
              Sertifika veya belge bulunmuyor
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Sertifika/Belge Adı</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Bitiş Tarihi</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Kalan Gün</th>
                    <th className="text-left py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">Durum</th>
                    <th className="text-center py-3 px-2 md:px-4 text-slate-400 font-medium text-xs md:text-sm">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert: any) => {
                    const status = getCertificateStatus(cert.expiryDate)
                    const today = new Date()
                    const expiry = new Date(cert.expiryDate)
                    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <tr key={cert.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                        <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words font-medium">
                          {cert.name}
                        </td>
                        <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                          {new Date(cert.expiryDate).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="py-3 px-2 md:px-4 text-white text-xs md:text-sm break-words">
                          {diffDays < 0 ? `${Math.abs(diffDays)} gün geçmiş` : `${diffDays} gün`}
                        </td>
                        <td className="py-3 px-2 md:px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-2 md:px-4">
                          <div className="flex items-center justify-center gap-2">
                            {cert.documentUrl && (
                              <a
                                href={cert.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-blue-900/50 hover:bg-blue-900 text-blue-400 rounded transition-colors"
                                title="Görüntüle/İndir"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </a>
                            )}
                            <button
                              onClick={() => handleCertificateEdit(cert)}
                              className="p-1.5 bg-amber-900/50 hover:bg-amber-900 text-amber-400 rounded transition-colors"
                              title="Düzenle"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleCertificateDelete(cert.id)}
                              className="p-1.5 bg-red-900/50 hover:bg-red-900 text-red-400 rounded transition-colors"
                              title="Sil"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <Link
              href="/admin/personel"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-center"
            >
              Kapat
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">Personel Düzenle</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Personel No</label>
                  <input
                    type="text"
                    name="personnelNo"
                    value={editFormData.personnelNo}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, personnelNo: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ad Soyad</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">TC No</label>
                  <input
                    type="text"
                    name="tcNo"
                    value={editFormData.tcNo}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, tcNo: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">NFC Kart UID</label>
                  <input
                    type="text"
                    name="nfcUid"
                    value={editFormData.nfcUid}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, nfcUid: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                    placeholder="NFC kart benzersiz kimliği (opsiyonel)"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Doğum Tarihi</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={editFormData.birthDate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Yaş</label>
                  <input
                    type="number"
                    name="age"
                    value={editFormData.age}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">İşe Giriş Tarihi</label>
                  <input
                    type="date"
                    name="hireDate"
                    value={editFormData.hireDate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Birim</label>
                  <input
                    type="text"
                    name="department"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mevcut Şantiye</label>
                  <input
                    type="text"
                    name="currentSite"
                    value={editFormData.currentSite}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, currentSite: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Telefon</label>
                  <input
                    type="text"
                    name="phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">E-posta</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Net Maaş</label>
                  <input
                    type="number"
                    name="salary"
                    value={editFormData.salary}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Maaş Ödeme Günü</label>
                  <input
                    type="number"
                    name="salaryPayDay"
                    value={editFormData.salaryPayDay}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, salaryPayDay: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">SGK Dönemi</label>
                  <input
                    type="text"
                    name="sgkPeriod"
                    value={editFormData.sgkPeriod}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, sgkPeriod: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">SGK Ödeme Günü</label>
                  <input
                    type="number"
                    name="sgkPayDay"
                    value={editFormData.sgkPayDay}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, sgkPayDay: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Primler / Avans</label>
                  <input
                    type="number"
                    name="bonuses"
                    value={editFormData.bonuses}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, bonuses: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Günlük Yevmiye</label>
                  <input
                    type="number"
                    name="gunlukYevmiye"
                    value={editFormData.gunlukYevmiye}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, gunlukYevmiye: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Takım</label>
                  <input
                    type="text"
                    name="takim"
                    value={editFormData.takim}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, takim: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sağlık Durumu</label>
                  <input
                    type="text"
                    name="healthStatus"
                    value={editFormData.healthStatus}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, healthStatus: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
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

      {/* Manual Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">Manuel Ödeme</h3>
            
            <form onSubmit={handleManualPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ödeme Türü</label>
                <select
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="ELDEN">Elden Nakit</option>
                  <option value="PRIM">Prim</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tutar (₺)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  step="0.01"
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Ödeme açıklaması"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Öde
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {isCertificateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">
              {selectedCertificate ? "Sertifika Düzenle" : "Yeni Sertifika Ekle"}
            </h3>
            
            <form onSubmit={selectedCertificate ? handleCertificateUpdate : handleCertificateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sertifika/Belge Adı *</label>
                <input
                  type="text"
                  value={certificateForm.name}
                  onChange={(e) => setCertificateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                  placeholder="Örn: İSG Sertifikası"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Bitiş Tarihi *</label>
                <input
                  type="date"
                  value={certificateForm.expiryDate}
                  onChange={(e) => setCertificateForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Belge URL (Opsiyonel)</label>
                <input
                  type="url"
                  value={certificateForm.documentUrl}
                  onChange={(e) => setCertificateForm(prev => ({ ...prev, documentUrl: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tür</label>
                <select
                  value={certificateForm.type}
                  onChange={(e) => setCertificateForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="SERTIFIKA">Sertifika</option>
                  <option value="BELGE">Belge</option>
                  <option value="LISANS">Lisans</option>
                  <option value="DİĞER">Diğer</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCertificateModalOpen(false)
                    setSelectedCertificate(null)
                    setCertificateForm({ name: "", expiryDate: "", documentUrl: "", type: "SERTIFIKA" })
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Kaydediliyor..." : selectedCertificate ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Grant Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              🔑 Sisteme Giriş İzni Ver
            </h3>
            
            <form onSubmit={handleLoginGrantSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                  placeholder="ornek: ahmet.yilmaz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Şifre</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rol</label>
                <select
                  value={loginForm.role}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="STAFF">Personel</option>
                  <option value="SITE_MANAGER">Şantiye Şefi</option>
                  <option value="ADMIN">Yönetici</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "İşleniyor..." : "İzin Ver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NFC Programming Modal */}
      {isNfcModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Nfc className="w-5 h-5" />
              NFC Karta Programla (Şifreli)
            </h3>
            
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-300 text-sm mb-2">
                  <strong>Personel:</strong> {person?.name}
                </p>
                <p className="text-slate-400 text-xs">
                  Personel ID şifrelenecek şekilde NFC kartına yazılacak.
                </p>
              </div>

              <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700">
                <p className="text-purple-300 text-sm">
                  ⚠️ Lütfen personelin NFC kartını telefonun arkasına dokundurun...
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNfcModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isNfcWriting}
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleNfcWrite}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-colors"
                  disabled={isNfcWriting}
                >
                  {isNfcWriting ? "Yazılıyor..." : "Karta Yaz"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
