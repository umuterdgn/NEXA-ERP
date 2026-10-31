/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Plus } from "lucide-react"
import TenantModal from "./TenantModal"
import TenantToggle from "./TenantToggle"

export default async function TenantsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user?.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  // @ts-ignore - Tenant model exists after schema update
  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: {
          personnel: true,
          projects: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Kiracı Yönetimi</h1>
            <p className="text-slate-400 mt-1">SaaS platformu kiracılarını yönetin</p>
          </div>
          <TenantModal />
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4 text-slate-400 font-medium">Şirket Adı</th>
                <th className="text-left p-4 text-slate-400 font-medium">Domain</th>
                <th className="text-left p-4 text-slate-400 font-medium">Durum</th>
                <th className="text-left p-4 text-slate-400 font-medium">Personel</th>
                <th className="text-left p-4 text-slate-400 font-medium">Proje</th>
                <th className="text-left p-4 text-slate-400 font-medium">Oluşturulma</th>
                <th className="text-left p-4 text-slate-400 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant: any) => (
                <tr key={tenant.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="p-4 text-white font-medium">{tenant.name}</td>
                  <td className="p-4 text-slate-400">{tenant.domain || "-"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tenant.isActive 
                        ? "bg-green-900/50 text-green-400" 
                        : "bg-red-900/50 text-red-400"
                    }`}>
                      {tenant.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{tenant._count?.personnel || 0}</td>
                  <td className="p-4 text-slate-400">{tenant._count?.projects || 0}</td>
                  <td className="p-4 text-slate-400">
                    {new Date(tenant.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="p-4">
                    <TenantToggle tenantId={tenant.id} isActive={tenant.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {tenants.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              Henüz kiracı eklenmemiş.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

