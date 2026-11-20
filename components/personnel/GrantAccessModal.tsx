"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Merkezi Sisteme Giriş Yetkisi / Şifre Belirle Modalı (GrantAccessModal)
 * Müteahhit, Yapı Denetim ve Franchise işletme tiplerine göre dinamik rol listesi sunar.
 */

import React, { useState, useEffect } from "react"
import { Key, X, User, Lock, Shield, Building, Check, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import {
  getAssignableRolesForTenant,
  type TenantType,
  type SystemRole,
} from "@/lib/rbac/permissions"

export interface GrantAccessPerson {
  id: string
  name: string
  username?: string | null
  email?: string | null
  role?: string | null
  department?: string | null
  projectId?: string | null
  assignedProjectIds?: string[]
}

interface GrantAccessModalProps {
  person: GrantAccessPerson
  tenantType: TenantType
  projects?: Array<{ id: string; name: string; title?: string }>
  onClose: () => void
  onSuccess: () => void
}

export default function GrantAccessModal({
  person,
  tenantType,
  projects = [],
  onClose,
  onSuccess,
}: GrantAccessModalProps) {
  const assignableRoles = getAssignableRolesForTenant(tenantType)

  // İlk rol seçimi
  const initialRole =
    person.role && assignableRoles.some((r) => r.role === person.role)
      ? (person.role as SystemRole)
      : assignableRoles[0]?.role || "STAFF"

  const [formData, setFormData] = useState({
    username: person.username || person.email || person.name.toLowerCase().replace(/[^a-z0-9]/g, ".") + "@saha.nexa",
    password: "",
    role: initialRole,
  })

  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    person.assignedProjectIds && person.assignedProjectIds.length > 0
      ? person.assignedProjectIds
      : person.projectId
      ? [person.projectId]
      : []
  )

  const [availableProjects, setAvailableProjects] = useState(projects)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Eğer projeler prop olarak gelmediyse API'den çek
  useEffect(() => {
    if (projects.length === 0) {
      fetch("/api/admin/projects")
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.projects
          if (Array.isArray(list)) {
            setAvailableProjects(
              list.map((p: any) => ({
                id: p.id,
                name: p.name || p.title || "İsimsiz Proje",
              }))
            )
          }
        })
        .catch(() => {})
    }
  }, [projects.length])

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error("Kullanıcı adı ve şifre zorunludur.")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.")
      return
    }

    setIsSubmitting(true)

    const email = formData.username.includes("@")
      ? formData.username.trim()
      : `${formData.username.trim()}@nexa.internal`

    try {
      const res = await fetch(`/api/admin/personnel/${person.id}/grant-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role,
          email,
          assignedProjectIds: selectedProjects,
        }),
      })

      if (res.ok) {
        toast.success(`"${person.name}" için giriş hesabı başarıyla tanımlandı!`, { icon: "🔑" })
        onSuccess()
      } else {
        const err = await res.json()
        toast.error(err.error || "Giriş yetkisi tanımlanamadı.")
      }
    } catch {
      toast.error("Bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div data-testid="grant-access-modal" className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Giriş Yetkisi / Şifre Belirle</h3>
              <p className="text-xs text-amber-400">
                {person.name} ({person.department || "Personel"}) • İşletme: {tenantType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Kullanıcı Adı */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Kullanıcı Adı veya E-posta *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Örn: ahmet.yilmaz"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                required
              />
            </div>
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Giriş Şifresi *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="En az 6 karakter"
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                required
              />
            </div>
          </div>

          {/* Sistem Rolü (Dinamik ve İzolasyonlu) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Sistem Rolü *
            </label>
            <select
              data-testid="grant-access-role-select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as SystemRole })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            >
              {assignableRoles.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.title} ({r.role})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Seçilen rol:{" "}
              <span className="text-amber-300">
                {assignableRoles.find((r) => r.role === formData.role)?.description}
              </span>
            </p>
          </div>

          {/* Atanacak Şantiye / Projeler */}
          {availableProjects.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                Erişebileceği Şantiye / Şubeler
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-800/60 rounded-xl border border-slate-700/60">
                {availableProjects.map((p) => {
                  const isChecked = selectedProjects.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProject(p.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-all ${
                        isChecked
                          ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
                          : "bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-750"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          isChecked ? "bg-amber-500 text-slate-950 font-bold" : "border border-slate-600"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{p.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Aksiyon Butonları */}
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-600/30 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <span>Hesabı Tanımla</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
