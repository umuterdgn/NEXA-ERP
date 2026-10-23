"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Kullanıcı Yönetimi & Ofis Personeli Yetkilendirme Paneli (/admin/users)
 */

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  Users,
  UserPlus,
  ShieldAlert,
  Search,
  Filter,
  Trash2,
  Lock,
  Mail,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  X,
  Shield,
  Briefcase,
  DollarSign,
  ShoppingCart,
} from "lucide-react"
import { createUser, getUsers, deleteUser } from "@/app/actions/users"
import ConfirmModal from "@/components/ConfirmModal"

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  companyId: string | null
  company?: {
    id: string
    name: string
  } | null
  createdAt: string
}

const ROLE_CONFIG: Record<
  string,
  { label: string; badge: string; category: "OFIS" | "YONETIM" | "SAHA" }
> = {
  SUPER_ADMIN: {
    label: "Süper Yönetici",
    badge: "bg-purple-950/80 border-purple-800 text-purple-300",
    category: "YONETIM",
  },
  ADMIN: {
    label: "Firma Yöneticisi (Admin)",
    badge: "bg-indigo-950/80 border-indigo-800 text-indigo-300",
    category: "YONETIM",
  },
  PROJECT_MANAGER: {
    label: "Proje Müdürü / Koordinatör",
    badge: "bg-blue-950/80 border-blue-800 text-blue-300",
    category: "YONETIM",
  },
  ACCOUNTANT: {
    label: "Muhasebe Personeli",
    badge: "bg-emerald-950/80 border-emerald-800 text-emerald-300",
    category: "OFIS",
  },
  HR_STAFF: {
    label: "İK Personeli",
    badge: "bg-amber-950/80 border-amber-800 text-amber-300",
    category: "OFIS",
  },
  PURCHASING_STAFF: {
    label: "Satınalma Personeli",
    badge: "bg-sky-950/80 border-sky-800 text-sky-300",
    category: "OFIS",
  },
  MUHASEBE: {
    label: "Muhasebe Müdürü",
    badge: "bg-teal-950/80 border-teal-800 text-teal-300",
    category: "OFIS",
  },
  FINANCE_MANAGER: {
    label: "Finans Müdürü",
    badge: "bg-emerald-950/80 border-emerald-800 text-emerald-300",
    category: "OFIS",
  },
  HR_MANAGER: {
    label: "İnsan Kaynakları Müdürü",
    badge: "bg-orange-950/80 border-orange-800 text-orange-300",
    category: "OFIS",
  },
  PROCUREMENT_MANAGER: {
    label: "Satınalma Müdürü",
    badge: "bg-blue-950/80 border-blue-800 text-blue-300",
    category: "OFIS",
  },
  SITE_MANAGER: {
    label: "Şantiye Şefi",
    badge: "bg-cyan-950/80 border-cyan-800 text-cyan-300",
    category: "SAHA",
  },
  ENGINEER: {
    label: "Saha Mühendisi",
    badge: "bg-cyan-950/80 border-cyan-800 text-cyan-300",
    category: "SAHA",
  },
  STAFF: {
    label: "Genel Personel",
    badge: "bg-slate-800 border-slate-700 text-slate-300",
    category: "SAHA",
  },
  WORKER: {
    label: "Saha Çalışanı",
    badge: "bg-slate-800 border-slate-700 text-slate-400",
    category: "SAHA",
  },
  SUBCONTRACTOR: {
    label: "Taşeron",
    badge: "bg-zinc-800 border-zinc-700 text-zinc-300",
    category: "SAHA",
  },
  INSPECTION_ADMIN: {
    label: "Yapı Denetim Patronu",
    badge: "bg-rose-950/80 border-rose-800 text-rose-300",
    category: "SAHA",
  },
  INSPECTOR: {
    label: "Saha Denetçisi",
    badge: "bg-rose-950/80 border-rose-800 text-rose-300",
    category: "SAHA",
  },
  ISG_EXPERT: {
    label: "İSG Uzmanı",
    badge: "bg-red-950/80 border-red-800 text-red-300",
    category: "SAHA",
  },
  AUDITOR: {
    label: "Denetçi",
    badge: "bg-violet-950/80 border-violet-800 text-violet-300",
    category: "SAHA",
  },
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null; name: string }>({
    isOpen: false,
    id: null,
    name: "",
  })

  // Role verification (Sadece ADMIN ve SUPER_ADMIN görebilsin)
  const currentUserRole = session?.user?.role as string
  const isAuthorized = currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN"

  const fetchUsersList = async () => {
    try {
      setLoading(true)
      const res = await getUsers()
      if (res.success && res.users) {
        setUsers(res.users as any)
      } else {
        toast.error(res.error || "Kullanıcılar yüklenemedi")
      }
    } catch (err) {
      console.error(err)
      toast.error("Kullanıcı listesi alınamadı")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      if (isAuthorized) {
        fetchUsersList()
      }
    }
  }, [status, isAuthorized])

  // Delete User Confirmation
  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      const res = await deleteUser(deleteConfirm.id)
      if (res.success) {
        toast.success(res.message || "Kullanıcı başarıyla silindi")
        setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id))
      } else {
        toast.error(res.error || "Silme işlemi başarısız")
      }
    } catch (err) {
      toast.error("Hata oluştu")
    } finally {
      setDeleteConfirm({ isOpen: false, id: null, name: "" })
    }
  }

  // Access Denied Screen if unauthorized
  if (status !== "loading" && !isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-red-800 rounded-2xl text-center space-y-4">
        <div className="p-3 bg-red-950/80 rounded-full w-fit mx-auto text-red-500 border border-red-700">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white">Erişim Reddedildi</h2>
        <p className="text-xs text-slate-400">
          Kullanıcı Yönetimi paneli yalnızca <strong>ADMIN</strong> ve <strong>SUPER_ADMIN</strong> yetkisine sahip yöneticiler tarafından görüntülenebilir.
        </p>
        <button
          onClick={() => router.push("/admin")}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
        >
          Panele Geri Dön
        </button>
      </div>
    )
  }

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    return matchesRole && matchesSearch
  })

  // Quick Metrics
  const totalCount = users.length
  const adminCount = users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length
  const officeCount = users.filter(
    (u) =>
      u.role === "ACCOUNTANT" ||
      u.role === "HR_STAFF" ||
      u.role === "PURCHASING_STAFF" ||
      u.role === "MUHASEBE" ||
      u.role === "FINANCE_MANAGER" ||
      u.role === "HR_MANAGER" ||
      u.role === "PROCUREMENT_MANAGER"
  ).length
  const fieldCount = users.filter(
    (u) =>
      u.role === "SITE_MANAGER" ||
      u.role === "ENGINEER" ||
      u.role === "WORKER" ||
      u.role === "STAFF" ||
      u.role === "SUBCONTRACTOR" ||
      u.role === "INSPECTOR"
  ).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Users className="w-4 h-4" />
            <span>Merkez Ofis & Saha Yetki Yönetimi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Kullanıcı Yönetim Paneli
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Merkez ofis çalışanlarını (Muhasebe, İK, Satınalma) ve şantiye personellerini sisteme tanımlayın, kurumsal yetkilerini yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsersList}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-white transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yeni Kullanıcı Ekle</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Toplam Kullanıcı</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Aktif Sistem Hesabı</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
          <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center justify-between">
            <span>Yönetici (Admin)</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2 font-mono">
            {adminCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Tam Yetkili Karargah</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Merkez Ofis Personeli</span>
            <Briefcase className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {officeCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Muhasebe, İK & Satınalma</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm">
          <div className="text-xs text-cyan-600 dark:text-cyan-400 flex items-center justify-between">
            <span>Şantiye & Saha Ekibi</span>
            <Building2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-2 font-mono">
            {fieldCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Şefler, Mühendisler & Denetim</div>
        </div>
      </div>

      {/* DataGrid Search & Role Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="İsim, e-posta veya role göre ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Roller ({users.length})</option>
            <option value="ACCOUNTANT">Muhasebe Personeli (ACCOUNTANT)</option>
            <option value="HR_STAFF">İK Personeli (HR_STAFF)</option>
            <option value="PURCHASING_STAFF">Satınalma Personeli (PURCHASING_STAFF)</option>
            <option value="ADMIN">Firma Yöneticisi (ADMIN)</option>
            <option value="SUPER_ADMIN">Süper Yönetici (SUPER_ADMIN)</option>
            <option value="SITE_MANAGER">Şantiye Şefi (SITE_MANAGER)</option>
            <option value="ENGINEER">Saha Mühendisi (ENGINEER)</option>
            <option value="WORKER">Saha Çalışanı (WORKER)</option>
            <option value="SUBCONTRACTOR">Taşeron (SUBCONTRACTOR)</option>
            <option value="INSPECTOR">Saha Denetçisi (INSPECTOR)</option>
          </select>
        </div>
      </div>

      {/* Users DataGrid Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Kullanıcı (Ad Soyad)</th>
                <th className="py-3 px-4">E-posta Adresi</th>
                <th className="py-3 px-4">Sistem Rolü</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Kayıt Tarihi</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                    <span>Kullanıcı listesi yükleniyor...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Arama kriterine uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleCfg = ROLE_CONFIG[user.role] || {
                    label: user.role,
                    badge: "bg-slate-800 border-slate-700 text-slate-300",
                    category: "SAHA",
                  }

                  const isSelf = user.id === session?.user?.id

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                            {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800">
                                  BEN
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {user.company?.name || "Nexa ERP"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {user.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${roleCfg.badge}`}>
                          {roleCfg.label}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {roleCfg.category === "OFIS"
                            ? "🏢 Merkez Ofis"
                            : roleCfg.category === "YONETIM"
                            ? "👑 Yönetim Masası"
                            : "🏗️ Şantiye & Saha"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {!isSelf && (
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                id: user.id,
                                name: user.name,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Yeni Kullanıcı Ekle" Modal */}
      {isAddModalOpen && (
        <AddUserModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newUser) => {
            setUsers((prev) => [newUser, ...prev])
            setIsAddModalOpen(false)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: "" })}
        onConfirm={confirmDelete}
        title="Kullanıcıyı Sil"
        message={`"${deleteConfirm.name}" kullanıcısını sistemden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        type="danger"
      />
    </div>
  )
}

/**
 * Yeni Kullanıcı Ekleme Form Modalı:
 * Ad, Soyad, Email, Şifre (Password Input) ve Rol (Select Box - Tüm rolleri içerecek)
 */
function AddUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (user: UserItem) => void
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "ACCOUNTANT", // Default to new office role
  })

  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg("Lütfen Ad ve Soyad alanlarını doldurunuz.")
      return
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMsg("Lütfen geçerli bir e-posta adresi giriniz.")
      return
    }

    if (!formData.password || formData.password.length < 6) {
      setErrorMsg("Şifre en az 6 karakter uzunluğunda olmalıdır.")
      return
    }

    try {
      setSubmitting(true)
      const res = await createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })

      if (res.success && res.user) {
        toast.success(res.message || "Kullanıcı başarıyla oluşturuldu")
        onSuccess(res.user as any)
      } else {
        setErrorMsg(res.error || "Kullanıcı kaydedilemedi.")
      }
    } catch (err: any) {
      setErrorMsg("İşlem hatası: Sunucuya ulaşılamadı.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <UserPlus className="w-5 h-5 text-blue-500" />
            <span>Yeni Kullanıcı Ekle</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ad & Soyad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Ad *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Örn: Ayşe"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Soyad *</label>
              <input
                type="text"
                placeholder="Örn: Yılmaz"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">E-posta Adresi *</label>
            <div className="relative">
              <input
                type="email"
                placeholder="muhasebe@sirket.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
                required
              />
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Password (with toggle) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Şifre * (En az 6 karakter)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-10 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
                required
                minLength={6}
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Role (Select Box containing ALL roles) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Kullanıcı Rolü & Yetki Seviyesi *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            >
              <optgroup label="🏢 Merkez Ofis Personelleri (Yeni Alt Roller)">
                <option value="ACCOUNTANT">Muhasebe Personeli (ACCOUNTANT) - Sadece Finans, Fatura, Hakediş</option>
                <option value="HR_STAFF">İK Personeli (HR_STAFF) - Sadece Personel, Puantaj, İzinler</option>
                <option value="PURCHASING_STAFF">Satınalma Personeli (PURCHASING_STAFF) - Sadece Tedarik, İhale, Envanter</option>
              </optgroup>

              <optgroup label="💼 Departman Müdürleri">
                <option value="MUHASEBE">Muhasebe Müdürü (MUHASEBE)</option>
                <option value="FINANCE_MANAGER">Finans Müdürü (FINANCE_MANAGER)</option>
                <option value="HR_MANAGER">İnsan Kaynakları Müdürü (HR_MANAGER)</option>
                <option value="PROCUREMENT_MANAGER">Satınalma Müdürü (PROCUREMENT_MANAGER)</option>
                <option value="EQUIPMENT_MANAGER">Demirbaş Müdürü (EQUIPMENT_MANAGER)</option>
                <option value="ISG_EXPERT">İSG Uzmanı (ISG_EXPERT)</option>
              </optgroup>

              <optgroup label="👑 Şirket Yönetimi">
                <option value="ADMIN">Firma Yöneticisi (ADMIN) - Tam Yetkili</option>
                <option value="PROJECT_MANAGER">Proje Müdürü / Koordinatör (PROJECT_MANAGER)</option>
                <option value="SUPER_ADMIN">Süper Yönetici (SUPER_ADMIN)</option>
              </optgroup>

              <optgroup label="🏗️ Saha ve Şantiye Ekibi">
                <option value="SITE_MANAGER">Şantiye Şefi (SITE_MANAGER)</option>
                <option value="ENGINEER">Saha Mühendisi (ENGINEER)</option>
                <option value="STAFF">Genel Personel (STAFF)</option>
                <option value="WORKER">Saha Çalışanı (WORKER)</option>
                <option value="SUBCONTRACTOR">Taşeron (SUBCONTRACTOR)</option>
                <option value="INSPECTION_ADMIN">Yapı Denetim Patronu (INSPECTION_ADMIN)</option>
                <option value="INSPECTOR">Saha Denetçisi (INSPECTOR)</option>
                <option value="AUDITOR">Denetçi (AUDITOR)</option>
              </optgroup>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kullanıcıyı Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}