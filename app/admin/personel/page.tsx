"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import ConfirmModal from "@/components/ConfirmModal"

type PersonnelRecord = {
  id: string
  personnelNo?: string
  name: string
  age?: number | string
  tcNo?: string
  department?: string
  currentSite?: string
}

type InspectorStat = {
  id: string
  name: string
  inspectionCount: number
  averageDuration: number
  deficiencyCount: number
}

type Profession = {
  id: string
  name: string
}

export default function AdminPersonelPage() {
  const router = useRouter()

  // Basit yetki kontrolü (İleride auth modülüne bağlanacak)
  const userPermissions: string[] = [] // Boş ise admin olarak kabul edilir
  const isAdmin = userPermissions.length === 0

  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null })

  const fetchPersonnel = async () => {
    try {
      const response = await fetch("/api/admin/personnel")
      if (response.ok) {
        const data = await response.json()
        setPersonnel(data)
      }
    } catch (error) {
      console.error("Failed to fetch personnel:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    const loadData = async () => {
      try {
        const personnelResponse = await fetch('/api/admin/personnel')

        if (!isActive) return

        if (personnelResponse.ok) {
          setPersonnel(await personnelResponse.json())
        }
      } catch (error) {
        if (!isActive) return
        console.error('Failed to fetch personnel:', error)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isActive = false
    }
  }, [])

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return

    try {
      const response = await fetch(`/api/admin/personnel/${deleteConfirm.id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success("Personel başarıyla silindi")
        fetchPersonnel()
      } else {
        toast.error("Personel silinirken hata oluştu")
      }
    } catch {
      toast.error("Hata oluştu")
    }
  }

  if (!isAdmin && !userPermissions.includes("PERSONNEL")) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Erişim Engellendi</h1>
          <p className="text-slate-400 mb-6">Bu sayfayı görme yetkiniz yok.</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">Personel Yönetimi</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap"
        >
          Yeni Personel Ekle
        </button>
      </div>

      {isAdding ? (
        <PersonelForm
          onSave={() => {
            fetchPersonnel()
            setIsAdding(false)
          }}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Personel No</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Ad Soyad</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Yaş</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">TC No</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Birim</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Mevcut Şantiye</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {personnel.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm text-white">{person.personnelNo}</td>
                    <td className="px-6 py-4 text-sm">
                      <Link 
                        href={`/admin/personel/${person.id}`}
                        className="text-blue-500 hover:text-blue-400"
                      >
                        {person.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{person.age}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{person.tcNo || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{person.department}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{person.currentSite}</td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/admin/personel/${person.id}`}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        Detay
                      </Link>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Personeli Sil"
        message="Bu personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </div>
  )
}

function PersonelForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
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
  const [professions, setProfessions] = useState<Profession[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isActive = true

    const loadProfessions = async () => {
      try {
        const response = await fetch('/api/admin/professions')
        if (!isActive) return

        if (response.ok) {
          setProfessions(await response.json())
        }
      } catch (error) {
        if (!isActive) return
        console.error('Failed to fetch professions:', error)
      }
    }

    void loadProfessions()

    return () => {
      isActive = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          birthDate: new Date(formData.birthDate),
          hireDate: formData.hireDate ? new Date(formData.hireDate) : new Date(),
          salary: formData.salary ? parseFloat(formData.salary) : 0,
          salaryPayDay: formData.salaryPayDay ? parseInt(formData.salaryPayDay) : null,
          sgkPeriod: formData.sgkPeriod || null,
          sgkPayDay: formData.sgkPayDay ? parseInt(formData.sgkPayDay) : null,
          healthStatus: formData.healthStatus || null,
          bonuses: formData.bonuses ? parseFloat(formData.bonuses) : 0,
          takim: formData.takim || null,
          gunlukYevmiye: formData.gunlukYevmiye ? parseFloat(formData.gunlukYevmiye) : 0,
          professionId: formData.professionId || null
        })
      })
      if (response.ok) {
        toast.success("Personel başarıyla eklendi")
        onSave()
      } else {
        toast.error("Personel eklenirken hata oluştu")
      }
    } catch {
      toast.error("Hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <h2 className="text-xl font-semibold text-white mb-6">Yeni Personel Ekle</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Personel No</label>
            <input
              type="text"
              value={formData.personnelNo}
              onChange={(e) => setFormData({ ...formData, personnelNo: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              placeholder="P001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ad Soyad</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Yaş</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Doğum Tarihi</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">TC Kimlik No</label>
            <input
              type="text"
              value={formData.tcNo}
              onChange={(e) => setFormData({ ...formData, tcNo: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              placeholder="11 haneli TC no"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">NFC Kart UID</label>
            <input
              type="text"
              value={formData.nfcUid}
              onChange={(e) => setFormData({ ...formData, nfcUid: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              placeholder="NFC kart benzersiz kimliği (opsiyonel)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Birim</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              required
            >
              <option value="">Birim Seçin</option>
              <option value="Yönetim">Yönetim</option>
              <option value="Saha Ekibi">Saha Ekibi</option>
              <option value="Mühendislik">Mühendislik</option>
              <option value="İSG & Kalite">İSG & Kalite</option>
              <option value="Muhasebe & Finans">Muhasebe & Finans</option>
              <option value="Taşeron">Taşeron</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mevcut Şantiye</label>
            <input
              type="text"
              value={formData.currentSite}
              onChange={(e) => setFormData({ ...formData, currentSite: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Telefon</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">E-posta</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Net Maaş</label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Prim/Avans</label>
            <input
              type="number"
              value={formData.bonuses}
              onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Birim / Meslek</label>
            <select
              value={formData.professionId}
              onChange={(e) => setFormData({ ...formData, professionId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            >
              <option value="">Meslek Seçin</option>
              {professions.map((prof) => (
                <option key={prof.id} value={prof.id}>{prof.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Takım (Eski)</label>
            <select
              value={formData.takim}
              onChange={(e) => setFormData({ ...formData, takim: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            >
              <option value="">Takım Seçin</option>
              <option value="Demirci">Demirci</option>
              <option value="Kalıpçı">Kalıpçı</option>
              <option value="Betoncu">Betoncu</option>
              <option value="İnşaat İşçisi">İnşaat İşçisi</option>
              <option value="Marangoz">Marangoz</option>
              <option value="Elektrikçi">Elektrikçi</option>
              <option value="Tesisatçı">Tesisatçı</option>
              <option value="Sıvacı">Sıvacı</option>
              <option value="Boyacı">Boyacı</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Günlük Yevmiye (TL)</label>
            <input
              type="number"
              value={formData.gunlukYevmiye}
              onChange={(e) => setFormData({ ...formData, gunlukYevmiye: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              step="0.01"
              placeholder="Günlük yevmiye tutarı"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">SGK Dönemi</label>
            <input
              type="text"
              value={formData.sgkPeriod}
              onChange={(e) => setFormData({ ...formData, sgkPeriod: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              placeholder="Ocak 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">İşe Giriş Tarihi</label>
            <input
              type="date"
              value={formData.hireDate}
              onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Maaş Ödeme Günü</label>
            <input
              type="number"
              value={formData.salaryPayDay}
              onChange={(e) => setFormData({ ...formData, salaryPayDay: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              placeholder="1-31 arası"
              min="1"
              max="31"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">SGK Ödeme Günü</label>
            <input
              type="number"
              value={formData.sgkPayDay}
              onChange={(e) => setFormData({ ...formData, sgkPayDay: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              placeholder="1-31 arası"
              min="1"
              max="31"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sağlık Durumu</label>
            <input
              type="text"
              value={formData.healthStatus}
              onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
              placeholder="Sağlıklı / Rapor durumu"
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}
