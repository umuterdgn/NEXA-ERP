"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState } from "react"
import toast from "react-hot-toast"
import ConfirmModal from "@/components/ConfirmModal"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null })

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return

    try {
      const response = await fetch(`/api/admin/users/${deleteConfirm.id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success("Kullanıcı başarıyla silindi")
        setUsers(users.filter(u => u.id !== deleteConfirm.id))
      } else {
        toast.error("Kullanıcı silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  return (
    <div className="lg:mt-0 mt-16">
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-8">
        Kullanıcı Yönetimi
      </h1>

      {/* Add User Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          Yeni Kullanıcı Ekle
        </button>
      </div>

      {/* Users List */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Ad Soyad</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">E-posta</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Rol</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Yetkiler</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 text-sm font-medium text-white">{user.name}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === "ADMIN"
                      ? "bg-purple-900/50 text-purple-400"
                      : "bg-blue-900/50 text-blue-400"
                  }`}>
                    {user.role === "ADMIN" ? "Admin" : "Personel"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {Array.isArray(user.permissions) ? user.permissions.length : 0} modül
                </td>
                <td className="px-6 py-4 text-right text-sm space-x-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  Kullanıcı bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={(updatedUser: any) => {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
            setSelectedUser(null)
          }}
        />
      )}

      {/* Add User Modal */}
      {isAdding && (
        <UserModal
          onClose={() => setIsAdding(false)}
          onSave={(newUser: any) => {
            setUsers([...users, newUser])
            setIsAdding(false)
          }}
        />
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Kullanıcıyı Sil"
        message="Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </div>
  )
}

function UserModal({ user, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "STAFF",
    permissions: Array.isArray(user?.permissions) ? user.permissions : [],
    isSuperAdmin: user?.role === "SUPER_ADMIN"
  })

  const MODULES = [
    { id: "DASHBOARD", name: "📊 Dashboard & Raporlar" },
    { id: "PERSONNEL", name: "👥 Personel ve Hakediş" },
    { id: "ATTENDANCE", name: "📋 Puantaj ve Yoklama" },
    { id: "INVENTORY", name: "📦 Ambar ve Karekod" },
    { id: "FINANCE", name: "💰 Finans ve Kasa" },
    { id: "PROJECTS", name: "🏗️ Projeler ve Yapı Denetim" },
    { id: "TASKS", name: "📋 Görevler ve Kanban" }
  ]

  const handleSuperAdminToggle = (isSuper: boolean) => {
    setFormData(prev => ({
      ...prev,
      isSuperAdmin: isSuper,
      role: isSuper ? "SUPER_ADMIN" : "STAFF",
      permissions: isSuper ? [] : prev.permissions // Süper admin ise yetkiler boş
    }))
  }

  const handlePermissionToggle = (moduleId: string) => {
    if (formData.isSuperAdmin) return // Süper admin ise yetki değişikliği yapma
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(moduleId)
        ? prev.permissions.filter((m: string) => m !== moduleId)
        : [...prev.permissions, moduleId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = user?.id ? `/api/admin/users/${user.id}` : "/api/admin/users"
      const method = user?.id ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const savedUser = await response.json()
        toast.success(user?.id ? "Kullanıcı başarıyla güncellendi" : "Kullanıcı başarıyla oluşturuldu")
        onSave(savedUser)
      } else {
        toast.error("Hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-slate-800">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            {user?.id ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ad Soyad *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">E-posta *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  required
                />
              </div>
            </div>

            {!user?.id && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Şifre *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  required={!user?.id}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Rol *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                disabled={formData.isSuperAdmin}
              >
                <option value="STAFF">Personel</option>
                <option value="ADMIN">Admin</option>
                <option value="SITE_MANAGER">Şantiye Yöneticisi</option>
                <option value="MUHASEBE">Muhasebe</option>
              </select>
            </div>

            {/* Super Admin Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-white">Süper Admin Yap</h3>
                <p className="text-sm text-slate-400">Süper admin kullanıcı sistemdeki her şeye tam yetkilidir</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isSuperAdmin}
                  onChange={(e) => handleSuperAdminToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Permissions */}
            <div className={formData.isSuperAdmin ? "opacity-50 pointer-events-none" : ""}>
              <h3 className="text-lg font-semibold text-white mb-4">Yetkiler</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MODULES.map((module) => (
                  <label key={module.id} className="flex items-center space-x-2 cursor-pointer p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(module.id)}
                      onChange={() => handlePermissionToggle(module.id)}
                      disabled={formData.isSuperAdmin}
                      className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-sm text-slate-300">{module.name}</span>
                  </label>
                ))}
              </div>
              {formData.isSuperAdmin && (
                <p className="text-sm text-slate-500 mt-2 italic">Süper admin kullanıcının tüm yetkileri otomatik olarak mevcuttur</p>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}