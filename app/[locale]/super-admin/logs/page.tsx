"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "react-hot-toast"
import { AlertTriangle, Info, AlertCircle, Search, Filter } from "lucide-react"

export default function SystemLogsPage() {
  const router = useRouter()
  const session = useSession()
  const sessionData = session?.data
  const status = session?.status
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState("ALL")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (sessionData?.user?.role !== "SUPER_ADMIN") {
      toast.error("Bu sayfaya erişim izniniz yok")
      router.push("/admin")
      return
    }

    fetchLogs()
  }, [sessionData, status, router])

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/super-admin/logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === "ALL" || log.errorType === filter
    const matchesSearch = searchTerm === "" || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getErrorIcon = (type: string) => {
    switch (type) {
      case "ERROR":
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      case "WARNING":
        return <AlertCircle className="w-5 h-5 text-amber-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getErrorColor = (type: string) => {
    switch (type) {
      case "ERROR":
        return "bg-red-900/20 border-red-500/30"
      case "WARNING":
        return "bg-amber-900/20 border-amber-500/30"
      default:
        return "bg-blue-900/20 border-blue-500/30"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Sistem Logları</h1>
          <p className="text-slate-400 mt-1">Platform genel sistem logları ve hata raporları</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Log ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "ALL" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setFilter("ERROR")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "ERROR" 
                    ? "bg-red-600 text-white" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Hatalar
              </button>
              <button
                onClick={() => setFilter("WARNING")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "WARNING" 
                    ? "bg-amber-600 text-white" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Uyarılar
              </button>
              <button
                onClick={() => setFilter("INFO")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "INFO" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Bilgi
              </button>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="bg-slate-900 rounded-2xl p-12 border border-slate-800 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Log bulunamadı</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`bg-slate-900 rounded-xl p-6 border ${getErrorColor(log.errorType || "INFO")}`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    {getErrorIcon(log.errorType || "INFO")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{log.action}</h3>
                      <span className="text-slate-400 text-sm">
                        {new Date(log.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-2">{log.details}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>Kullanıcı: {log.user}</span>
                      {log.tenant && <span>Tenant: {log.tenant.name}</span>}
                    </div>
                    {log.stackTrace && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-slate-400 text-sm hover:text-white">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 p-3 bg-slate-950 rounded-lg text-xs text-slate-400 overflow-x-auto">
                          {log.stackTrace}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
