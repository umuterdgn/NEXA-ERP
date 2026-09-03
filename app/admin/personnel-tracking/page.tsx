"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { MapPin, Clock, AlertCircle } from "lucide-react"

export default function PersonnelTrackingPage() {
  const trackingData = [
    { id: "P001", name: "Ahmet Yılmaz", location: "İskenderun TOKİ", status: "Active", lastSeen: "10:45" },
    { id: "P002", name: "Mehmet Demir", location: "Arsuz Konutları", status: "Active", lastSeen: "10:42" },
    { id: "P003", name: "Ali Kaya", location: "Dörtyol Sitesi", status: "Break", lastSeen: "10:30" },
    { id: "P004", name: "Hasan Öztürk", location: "Erzin Proje", status: "Active", lastSeen: "10:48" },
    { id: "P005", name: "İbrahim Şahin", location: "İskenderun TOKİ", status: "Offline", lastSeen: "09:15" },
  ]

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <MapPin className="w-8 h-8 text-blue-400" />
          Personel Takibi
        </h1>
        <p className="text-slate-400 mt-1">Personel konum ve durum takibi</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="text-left p-4 text-slate-300 font-medium">Personel No</th>
              <th className="text-left p-4 text-slate-300 font-medium">Ad Soyad</th>
              <th className="text-left p-4 text-slate-300 font-medium">Konum</th>
              <th className="text-left p-4 text-slate-300 font-medium">Durum</th>
              <th className="text-left p-4 text-slate-300 font-medium">Son Görülme</th>
            </tr>
          </thead>
          <tbody>
            {trackingData.map((person) => (
              <tr key={person.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                <td className="p-4 text-white font-medium">{person.id}</td>
                <td className="p-4 text-white">{person.name}</td>
                <td className="p-4 text-slate-300">{person.location}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    person.status === "Active" 
                      ? "bg-green-500/20 text-green-400" 
                      : person.status === "Break"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {person.status === "Active" && <Clock className="w-3 h-3" />}
                    {person.status === "Offline" && <AlertCircle className="w-3 h-3" />}
                    {person.status}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{person.lastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
