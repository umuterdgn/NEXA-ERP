/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { Plus, Bell, Calendar, Tag, Trash2, Edit, X, Search } from "lucide-react"

export default function AdminAnnouncementsPage() {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tag: "general",
    endDate: ""
  })

  // Mock data
  const announcements = [
    { id: 1, title: "İSG Denetimi Duyurusu", content: "Yarın sabah 09:00'da güvenlik ekipmanları kontrol edilecek. Tüm personelin hazır bulunması gerekmektedir.", tag: "isg", endDate: "2024-08-22", createdAt: "2024-08-20", author: "Admin" },
    { id: 2, title: "Beton Dökümü Planı", content: "C blokta bugün 14:00'te beton dökümü yapılacak. İlgili ekipler hazır olmalı.", tag: "general", endDate: "2024-08-21", createdAt: "2024-08-20", author: "Admin" },
    { id: 3, title: "Önemli: Yangın Tatbikatı", content: "Cuma günü saat 10:00'da yangın tatbikatı yapılacaktır. Katılım zorunludur.", tag: "important", endDate: "2024-08-23", createdAt: "2024-08-19", author: "Admin" },
    { id: 4, title: "Maaş Ödeme Takvimi", content: "Ağustos maaşları 25 Ağustos'ta ödenecektir.", tag: "general", endDate: "2024-08-25", createdAt: "2024-08-18", author: "Admin" },
  ]

  const tagColors = {
    important: "bg-red-500/20 text-red-400 border-red-500/30",
    isg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    general: "bg-blue-500/20 text-blue-400 border-blue-500/30"
  }

  const tagLabels = {
    important: "Önemli",
    isg: "İSG",
    general: "Genel"
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("New announcement:", formData)
    setShowForm(false)
    setFormData({ title: "", content: "", tag: "general", endDate: "" })
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Duyurular Yönetimi</h1>
          <p className="text-slate-400">Şirket içi duyuruları oluşturun ve yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Yeni Duyuru
        </button>
      </div>

      {/* Create Announcement Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Yeni Duyuru Oluştur</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Başlık *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Duyuru başlığı girin..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">İçerik *</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Duyuru içeriğini girin..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Etiket</label>
                  <select
                    value={formData.tag}
                    onChange={(e) => setFormData({...formData, tag: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="general">Genel</option>
                    <option value="important">Önemli</option>
                    <option value="isg">İSG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
                >
                  Duyuru Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Duyuru ara..."
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors">
          <option value="">Tüm Etiketler</option>
          <option value="important">Önemli</option>
          <option value="isg">İSG</option>
          <option value="general">Genel</option>
        </select>
      </div>

      {/* Announcements Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Bell className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Duyuru Listesi</h2>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">{announcements.length} duyuru</span>
        </div>

        <div className="divide-y divide-slate-800">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="p-6 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs border ${tagColors[announcement.tag as keyof typeof tagColors]}`}>
                      {tagLabels[announcement.tag as keyof typeof tagLabels]}
                    </span>
                  </div>
                  <p className="text-slate-400 mb-3">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Bitiş: {announcement.endDate}</span>
                    </div>
                    <span>•</span>
                    <span>Oluşturuldu: {announcement.createdAt}</span>
                    <span>•</span>
                    <span>{announcement.author}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-slate-400 text-sm">Toplam {announcements.length} duyuru</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm transition-colors">
              Önceki
            </button>
            <button className="px-3 py-1 bg-blue-600 rounded text-white text-sm">
              1
            </button>
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm transition-colors">
              Sonraki
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
