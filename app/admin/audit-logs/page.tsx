"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { 
  History, 
  Search,
  Filter,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  Database
} from "lucide-react"

interface AuditLog {
  id: string
  action: string
  entityId: string
  entityType: string
  reason: string
  ipAddress: string | null
  metadata: string | null
  createdAt: string
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  deficiency?: {
    id: string
    element: string
    category: string
    status: string
  }
}

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit-logs")
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data)
      } else {
        setAuditLogs([])
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
      setAuditLogs([])
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "STATUS_CHANGE":
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">DURUM DEĞİŞİKLİĞİ</span>
      case "DELETE":
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">SİLME</span>
      case "UPDATE":
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">GÜNCELLEME</span>
      case "CREATE":
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">OLUŞTURMA</span>
      default:
        return <span className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium">{action}</span>
    }
  }

  const getEntityTypeBadge = (entityType: string) => {
    switch (entityType) {
      case "DEFICIENCY":
        return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">EKSİKLİK</span>
      case "INSPECTION":
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">DENETİM</span>
      case "PROJECT":
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">PROJE</span>
      case "PERSONEL":
        return <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">PERSONEL</span>
      default:
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-xs">{entityType}</span>
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "STATUS_CHANGE": return Clock
      case "DELETE": return XCircle
      case "UPDATE": return AlertTriangle
      case "CREATE": return CheckCircle
      default: return Database
    }
  }

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.reason.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter
    return matchesSearch && matchesAction
  })

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">İşlem Geçmişi</h1>
        <p className="text-slate-400">Sistemdeki tüm değiştirilemez kayıtlar ve denetim izleri</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Kayıt ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm İşlemler</option>
            <option value="CREATE">Oluşturma</option>
            <option value="UPDATE">Güncelleme</option>
            <option value="DELETE">Silme</option>
            <option value="STATUS_CHANGE">Durum Değişikliği</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Shield className="w-4 h-4" />
          <span>Değiştirilemez Kayıtlar</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tarih & Saat</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Kullanıcı</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">İşlem Tipi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Varlık Tipi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Açıklama</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">IP Adresi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Yükleniyor...
                  </td>
                </tr>
              ) : filteredAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Henüz kayıt bulunmuyor
                  </td>
                </tr>
              ) : (
                filteredAuditLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action)
                  return (
                    <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-white text-sm">
                              {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {new Date(log.createdAt).toLocaleTimeString('tr-TR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-white text-sm font-medium">{log.user.name}</div>
                            <div className="text-slate-500 text-xs">{log.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ActionIcon className="w-4 h-4 text-slate-400" />
                          {getActionBadge(log.action)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getEntityTypeBadge(log.entityType)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-white text-sm line-clamp-2">{log.reason}</p>
                          {log.deficiency && (
                            <p className="text-slate-500 text-xs mt-1">
                              {log.deficiency.category} - {log.deficiency.element}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.ipAddress ? (
                          <div className="flex items-center gap-1 text-slate-400 text-sm">
                            <MapPin className="w-3 h-3" />
                            {log.ipAddress}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">-</span>
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

      {/* Footer Info */}
      <div className="mt-6 flex items-center justify-between text-slate-500 text-sm">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span>Toplam {auditLogs.length} kayıt</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Bu kayıtlar değiştirilemez ve hukuki delil niteliğindedir</span>
        </div>
      </div>
    </div>
  )
}
