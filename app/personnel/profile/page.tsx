/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { User, Mail, Phone, MapPin, Briefcase, Droplet, AlertCircle, Bell, Lock, Camera, CreditCard, Shield, Calendar, FileText } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import ContactInfoForm from "./ContactInfoForm"
import EmergencyContactForm from "./EmergencyContactForm"
import BankInfoForm from "./BankInfoForm"
import PasswordChangeForm from "./PasswordChangeForm"

// Tarih formatlama (dd MMMM yyyy)
function formatDate(date: Date): string {
  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

async function getProfileData(userId: string) {
  const personel = await prisma.personel.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      personnelNo: true,
      position: true,
      department: true,
      email: true,
      phone: true,
      currentSite: true,
      bloodType: true,
      hireDate: true,
      tcNo: true,
      sgkNo: true,
      birthDate: true,
      bankName: true,
      iban: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      emergencyContactRelation: true
    }
  })

  if (!personel) {
    return {
      profile: {
        name: "-",
        title: "-",
        department: "-",
        email: "",
        phone: "",
        location: "-",
        bloodType: "-",
        employeeId: "-",
        joinDate: "-"
      },
      emergencyContact: {
        name: "-",
        relationship: "-",
        phone: "-"
      }
    }
  }

  return {
    profile: {
      name: personel.name || "-",
      title: personel.position || "-",
      department: personel.department || "-",
      email: personel.email || "",
      phone: personel.phone || "",
      location: personel.currentSite || "-",
      bloodType: personel.bloodType || "-",
      employeeId: personel.personnelNo || "-",
      joinDate: personel.hireDate ? formatDate(new Date(personel.hireDate)) : "-",
      tcNo: personel.tcNo || "-",
      sgkNo: personel.sgkNo || "-",
      birthDate: personel.birthDate ? formatDate(new Date(personel.birthDate)) : "-",
      bankName: personel.bankName || "",
      iban: personel.iban || ""
    },
    emergencyContact: {
      name: personel.emergencyContactName || "-",
      relationship: personel.emergencyContactRelation || "-",
      phone: personel.emergencyContactPhone || "-"
    }
  }
}

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { profile, emergencyContact } = await getProfileData(session.user.id)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profil ve Ayarlar</h1>
        <p className="text-slate-400">Kişisel bilgilerinizi ve tercihlerinizi yönetin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-3xl">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <button className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{profile.name}</h2>
              <p className="text-slate-400">{profile.title}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Briefcase className="w-5 h-5 text-slate-500" />
                <span className="text-sm">{profile.department}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin className="w-5 h-5 text-slate-500" />
                <span className="text-sm">{profile.location}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Droplet className="w-5 h-5 text-red-400" />
                <span className="text-sm">Kan Grubu: {profile.bloodType}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Personel No</p>
                  <p className="text-white font-medium text-sm">{profile.employeeId}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">İşe Giriş</p>
                  <p className="text-white font-medium text-sm">{profile.joinDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Official Information Card */}
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Resmi Bilgiler</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-xs mb-1">T.C. Kimlik No</p>
                <p className="text-white font-medium">{profile.tcNo}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">SGK No</p>
                <p className="text-white">{profile.sgkNo}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Doğum Tarihi</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <p className="text-white">{profile.birthDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Card */}
          <div className="bg-gradient-to-br from-red-600/10 to-orange-600/10 border border-red-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Acil Durum Kişisi</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-xs mb-1">Ad Soyad</p>
                <p className="text-white font-medium">{emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Yakınlık</p>
                <p className="text-white">{emergencyContact.relationship}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Telefon</p>
                <p className="text-white">{emergencyContact.phone}</p>
              </div>
            </div>
            <EmergencyContactForm currentData={emergencyContact} />
          </div>
        </div>

        {/* Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <ContactInfoForm currentData={profile} />

          {/* Bank Information */}
          <BankInfoForm 
            currentData={{
              ...profile,
              bankName: profile.bankName || "",
              iban: profile.iban || ""
            }} 
          />

          {/* Account Security */}
          <PasswordChangeForm />
        </div>
      </div>
    </div>
  )
}
