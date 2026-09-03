"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import ConfirmModal from "@/components/ConfirmModal"

export default function AdminSettingsPage() {
  const [driveFolderId, setDriveFolderId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Profession management state
  const [professions, setProfessions] = useState<any[]>([])
  const [newProfession, setNewProfession] = useState("")
  const [isAddingProfession, setIsAddingProfession] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null })
  
  // Profile editing state
  const [activeTab, setActiveTab] = useState<"profile" | "drive" | "professions">("profile")
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    profileImage: ""
  })
  const [isProfileSaving, setIsProfileSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchProfessions()
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/admin/user/profile")
      if (response.ok) {
        const data = await response.json()
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          profileImage: data.profileImage || ""
        })
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setDriveFolderId(data.driveFolderId || "")
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProfessions = async () => {
    try {
      const response = await fetch("/api/admin/professions")
      if (response.ok) {
        const data = await response.json()
        setProfessions(data)
      }
    } catch (error) {
      console.error("Failed to fetch professions:", error)
    }
  }

  const handleAddProfession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProfession.trim()) return

    setIsAddingProfession(true)
    try {
      const response = await fetch("/api/admin/professions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProfession.trim() })
      })

      if (response.ok) {
        toast.success("Meslek başarıyla eklendi")
        setNewProfession("")
        fetchProfessions()
      } else {
        toast.error("Meslek eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    } finally {
      setIsAddingProfession(false)
    }
  }

  const handleDeleteProfession = async (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDeleteProfession = async () => {
    if (!deleteConfirm.id) return

    try {
      const response = await fetch(`/api/admin/professions/${deleteConfirm.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Meslek başarıyla silindi")
        fetchProfessions()
      } else {
        const data = await response.json()
        toast.error(data.error || "Meslek silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveFolderId })
      })

      if (response.ok) {
        toast.success("Ayarlar kaydedildi")
      } else {
        toast.error("Hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProfileSaving(true)

    try {
      const response = await fetch("/api/admin/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        toast.success("Profil başarıyla güncellendi")
      } else {
        toast.error("Profil güncellenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData(prev => ({ ...prev, profileImage: data.url }))
        toast.success("Fotoğraf yüklendi")
      } else {
        toast.error("Fotoğraf yüklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  return (
    <div className="lg:mt-0 mt-16">
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-8">
        Ayarlar
      </h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "profile"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Profil Düzenleme
        </button>
        <button
          onClick={() => setActiveTab("drive")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "drive"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Google Drive
        </button>
        <button
          onClick={() => setActiveTab("professions")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "professions"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Meslek Yönetimi
        </button>
      </div>

      <div className="space-y-8">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 max-w-2xl">
            <h2 className="text-xl font-semibold text-white mb-6">Profil Düzenleme</h2>
            
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-700">
                    {profileData.profileImage ? (
                      <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-slate-500">{profileData.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Profil fotoğrafını değiştirmek için ikona tıklayın</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">E-posta</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isProfileSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                  {isProfileSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Google Drive Settings */}
        {activeTab === "drive" && (
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 max-w-2xl">
            <h2 className="text-xl font-semibold text-white mb-6">Google Drive Arşiv Ayarları</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Google Drive Klasör ID / Linki
                </label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="https://drive.google.com/drive/folders/..."
                  disabled={isLoading}
                />
                <p className="text-sm text-slate-400 mt-2">
                  PDF dosyalarının yükleneceği Google Drive klasörünün ID'si veya tam linki.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Profession Management */}
        {activeTab === "professions" && (
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 max-w-2xl">
            <h2 className="text-xl font-semibold text-white mb-6">Birim / Meslek Yönetimi</h2>
            
            {/* Add New Profession Form */}
            <form onSubmit={handleAddProfession} className="mb-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newProfession}
                  onChange={(e) => setNewProfession(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  placeholder="Yeni meslek adı (Örn: Kalıpçı, Elektrikçi)"
                  disabled={isAddingProfession}
                />
                <button
                  type="submit"
                  disabled={isAddingProfession || !newProfession.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                >
                  {isAddingProfession ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>

            {/* Professions List */}
            <div className="space-y-2">
              {professions.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Henüz meslek eklenmedi</p>
              ) : (
                professions.map((prof) => (
                  <div
                    key={prof.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <span className="text-white">{prof.name}</span>
                    <button
                      onClick={() => handleDeleteProfession(prof.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
          onConfirm={confirmDeleteProfession}
          title="Mesleği Sil"
          message="Bu mesleği silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          confirmText="Sil"
          cancelText="İptal"
          type="danger"
        />
      </div>
    </div>
  )
}
