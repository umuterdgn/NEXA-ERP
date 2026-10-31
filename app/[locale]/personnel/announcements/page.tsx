/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { Bell, Calendar, AlertTriangle, Info, FileText, Search, Filter } from "lucide-react"

export default function AnnouncementsPage() {
  // Mock data
  const announcements = [
    { 
      id: 1, 
      title: "İSG Denetimi Duyurusu", 
      content: "Yarın sabah 09:00'da güvenlik ekipmanları kontrol edilecek. Tüm personelin hazır bulunması gerekmektedir. Kask, güvenlik ayakkabısı ve yelek kontrolü yapılacaktır.",
      tag: "isg",
      endDate: "2024-08-22",
      createdAt: "2024-08-20",
      author: "İSG Birimi",
      isImportant: true
    },
    { 
      id: 2, 
      title: "Beton Dökümü Planı", 
      content: "C blokta bugün 14:00'te beton dökümü yapılacak. İlgili ekipler hazır olmalı. Beton miktarı 50m³ olarak planlanmıştır.",
      tag: "general",
      endDate: "2024-08-21",
      createdAt: "2024-08-20",
      author: "Şantiye Şefi",
      isImportant: false
    },
    { 
      id: 3, 
      title: "Yangın Tatbikatı", 
      content: "Cuma günü saat 10:00'da yangın tatbikatı yapılacaktır. Katılım zorunludur. Toplantı alanında toplanınız.",
      tag: "important",
      endDate: "2024-08-23",
      createdAt: "2024-08-19",
      author: "İK Departmanı",
      isImportant: true
    },
    { 
      id: 4, 
      title: "Maaş Ödeme Takvimi", 
      content: "Ağustos maaşları 25 Ağustos'ta ödenecektir. Banka hesap bilgilerini güncelleyen personel İK'ya bildirmelidir.",
      tag: "general",
      endDate: "2024-08-25",
      createdAt: "2024-08-18",
      author: "Muhasebe",
      isImportant: false
    },
    { 
      id: 5, 
      title: "Yeni Ekipman Teslimatı", 
      content: "Yeni inşaat ekipmanları teslim edildi. Kullanım talimatlarını okumadan kullanmayınız.",
      tag: "isg",
      endDate: "2024-08-30",
      createdAt: "2024-08-17",
      author: "Depo Yönetimi",
      isImportant: false
    },
  ]

  const documents = [
    { id: 1, title: "Masraf Formu", type: "form", size: "125 KB" },
    { id: 2, title: "İSG Talimatnamesi 2024", type: "pdf", size: "2.5 MB" },
    { id: 3, title: "KVKK Aydınlatma Metni", type: "pdf", size: "890 KB" },
    { id: 4, title: "İzin Talep Formu", type: "form", size: "95 KB" },
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

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'important': return <AlertTriangle className="w-4 h-4" />
      case 'isg': return <AlertTriangle className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Duyurular ve Belgeler</h1>
        <p className="text-slate-400">Şirket içi duyurular ve önemli belgeler</p>
      </div>

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
        <button className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filtrele</span>
        </button>
      </div>

      {/* Announcements Feed */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Son Duyurular</h2>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">{announcements.length} duyuru</span>
        </div>

        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-slate-900 border rounded-2xl p-6 transition-all hover:shadow-lg ${
                announcement.isImportant ? 'border-red-500/30 shadow-red-500/10' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  announcement.isImportant ? 'bg-red-500/20' : 'bg-slate-800'
                }`}>
                  {getTagIcon(announcement.tag)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs border flex items-center gap-1 ${tagColors[announcement.tag as keyof typeof tagColors]}`}>
                      {getTagIcon(announcement.tag)}
                      {tagLabels[announcement.tag as keyof typeof tagLabels]}
                    </span>
                    {announcement.isImportant && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                        Önemli
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 mb-3 leading-relaxed">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Bitiş: {announcement.endDate}</span>
                    </div>
                    <span>•</span>
                    <span>{announcement.author}</span>
                    <span>•</span>
                    <span>{announcement.createdAt}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documents Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Belgeler</h2>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">{documents.length} belge</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white font-medium mb-1 truncate">{doc.title}</h3>
              <p className="text-slate-500 text-sm">{doc.size}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
