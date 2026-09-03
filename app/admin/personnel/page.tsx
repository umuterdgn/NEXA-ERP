"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { Users, MapPin, Briefcase, Phone, Mail, CheckCircle, AlertCircle, Clock, Wallet, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PersonnelPage() {
  const [personnelData, setPersonnelData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPersonnel()
  }, [])

  const fetchPersonnel = async () => {
    try {
      const response = await fetch('/api/admin/personnel')
      if (response.ok) {
        const data = await response.json()
        setPersonnelData(data)
      } else {
        // Fallback mock data if API fails
        setPersonnelData([
          { id: "P001", personnelNo: "P001", name: "Ahmet Yılmaz", department: "İnşaat", position: "Kalıpçı", phone: "0555 123 4567", email: "ahmet@nexa.com", status: "ACTIVE", currentSite: "İskenderun TOKİ", salaryStatus: "Paid" },
          { id: "P002", personnelNo: "P002", name: "Mehmet Demir", department: "Elektrik", position: "Elektrikçi", phone: "0555 234 5678", email: "mehmet@nexa.com", status: "ACTIVE", currentSite: "Arsuz Konutları", salaryStatus: "Pending" },
          { id: "P003", personnelNo: "P003", name: "Ali Kaya", department: "İnşaat", position: "Demirci", phone: "0555 345 6789", email: "ali@nexa.com", status: "ON_LEAVE", currentSite: "Dörtyol Sitesi", salaryStatus: "Paid" },
          { id: "P004", personnelNo: "P004", name: "Hasan Öztürk", department: "Mekanik", position: "Tesisatçı", phone: "0555 456 7890", email: "hasan@nexa.com", status: "ACTIVE", currentSite: "Erzin Proje", salaryStatus: "Pending" },
          { id: "P005", personnelNo: "P005", name: "İbrahim Şahin", department: "İnşaat", position: "Mimar", phone: "0555 567 8901", email: "ibrahim@nexa.com", status: "ACTIVE", currentSite: "İskenderun TOKİ", salaryStatus: "Paid" },
        ])
      }
    } catch (error) {
      console.error('Failed to fetch personnel:', error)
      // Fallback mock data on error
      setPersonnelData([
        { id: "P001", personnelNo: "P001", name: "Ahmet Yılmaz", department: "İnşaat", position: "Kalıpçı", phone: "0555 123 4567", email: "ahmet@nexa.com", status: "ACTIVE", currentSite: "İskenderun TOKİ", salaryStatus: "Paid" },
        { id: "P002", personnelNo: "P002", name: "Mehmet Demir", department: "Elektrik", position: "Elektrikçi", phone: "0555 234 5678", email: "mehmet@nexa.com", status: "ACTIVE", currentSite: "Arsuz Konutları", salaryStatus: "Pending" },
        { id: "P003", personnelNo: "P003", name: "Ali Kaya", department: "İnşaat", position: "Demirci", phone: "0555 345 6789", email: "ali@nexa.com", status: "ON_LEAVE", currentSite: "Dörtyol Sitesi", salaryStatus: "Paid" },
        { id: "P004", personnelNo: "P004", name: "Hasan Öztürk", department: "Mekanik", position: "Tesisatçı", phone: "0555 456 7890", email: "hasan@nexa.com", status: "ACTIVE", currentSite: "Erzin Proje", salaryStatus: "Pending" },
        { id: "P005", personnelNo: "P005", name: "İbrahim Şahin", department: "İnşaat", position: "Mimar", phone: "0555 567 8901", email: "ibrahim@nexa.com", status: "ACTIVE", currentSite: "İskenderun TOKİ", salaryStatus: "Paid" },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-slate-400 mt-4">Personel verileri yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-400" />
          Personel Listesi
        </h1>
        <p className="text-slate-400 mt-1">Personel yönetimi ve takibi</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="text-left p-4 text-slate-300 font-medium">Personel No</th>
              <th className="text-left p-4 text-slate-300 font-medium">Ad Soyad</th>
              <th className="text-left p-4 text-slate-300 font-medium">Departman</th>
              <th className="text-left p-4 text-slate-300 font-medium">Pozisyon</th>
              <th className="text-left p-4 text-slate-300 font-medium">Telefon</th>
              <th className="text-left p-4 text-slate-300 font-medium">E-posta</th>
              <th className="text-left p-4 text-slate-300 font-medium">Konum</th>
              <th className="text-left p-4 text-slate-300 font-medium">Durum</th>
              <th className="text-left p-4 text-slate-300 font-medium">Maaş Durumu</th>
              <th className="text-left p-4 text-slate-300 font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {personnelData.map((person) => (
              <tr key={person.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                <td className="p-4 text-white font-medium">{person.personnelNo || person.id}</td>
                <td className="p-4 text-white">{person.name}</td>
                <td className="p-4 text-slate-300">{person.department}</td>
                <td className="p-4 text-slate-300">{person.position}</td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {person.phone}
                </td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {person.email}
                </td>
                <td className="p-4 text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {person.currentSite || person.location}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    person.status === "ACTIVE" || person.status === "Active" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {(person.status === "ACTIVE" || person.status === "Active") && <CheckCircle className="w-3 h-3" />}
                    {(person.status === "ON_LEAVE" || person.status === "On Leave") && <Clock className="w-3 h-3" />}
                    {person.status === "ACTIVE" ? "Active" : person.status === "ON_LEAVE" ? "On Leave" : person.status}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    person.salaryStatus === "Paid" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-orange-500/20 text-orange-400"
                  }`}>
                    {person.salaryStatus === "Paid" && <CheckCircle className="w-3 h-3" />}
                    {person.salaryStatus === "Pending" && <Clock className="w-3 h-3" />}
                    {person.salaryStatus === "Paid" ? "Ödendi" : "Ödeme Bekliyor"}
                  </span>
                </td>
                <td className="p-4">
                  <Link
                    href={`/admin/personnel/${person.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Wallet className="w-4 h-4" />
                    Ödeme / Detay
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
