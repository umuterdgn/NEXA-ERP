"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { CheckCircle, Clock, AlertTriangle, FileText, Shield, Camera, MapPin, User } from "lucide-react"

interface TimelineEvent {
  id: string
  type: "inspection" | "deficiency" | "document" | "audit"
  title: string
  description: string
  date: Date
  status?: string
  person?: string
  severity?: string
}

interface ProjectTimelineProps {
  inspections?: any[]
  deficiencies?: any[]
  documents?: any[]
  audits?: any[]
}

export default function ProjectTimeline({ inspections = [], deficiencies = [], documents = [], audits = [] }: ProjectTimelineProps) {
  // Merge all events into a single timeline
  const events: TimelineEvent[] = []

  // Add inspections
  inspections.forEach((inspection) => {
    events.push({
      id: `inspection-${inspection.id}`,
      type: "inspection",
      title: `${inspection.type} Kontrolü`,
      description: `${inspection.floor ? `${inspection.floor} - ` : ''}${inspection.status === 'APPROVED' ? 'Onaylandı' : inspection.status === 'REJECTED' ? 'Reddedildi' : 'Beklemede'}`,
      date: new Date(inspection.inspectionDate),
      status: inspection.status,
      person: inspection.inspector?.name,
      severity: "normal"
    })
  })

  // Add deficiencies
  deficiencies.forEach((deficiency) => {
    events.push({
      id: `deficiency-${deficiency.id}`,
      type: "deficiency",
      title: `${deficiency.category} Eksikliği`,
      description: `${deficiency.element} - ${deficiency.status === 'OPEN' ? 'Açık' : deficiency.status === 'CLOSED' ? 'Kapatıldı' : 'İşlemde'}`,
      date: new Date(deficiency.createdAt),
      status: deficiency.status,
      person: deficiency.inspector?.name || deficiency.reporter?.name,
      severity: deficiency.severity
    })
  })

  // Add documents
  documents.forEach((document) => {
    events.push({
      id: `document-${document.id}`,
      type: "document",
      title: `${document.type} Belgesi`,
      description: `Versiyon ${document.version} - ${document.status === 'ACTIVE' ? 'Aktif' : document.status}`,
      date: new Date(document.createdAt),
      status: document.status,
      person: document.uploadedBy?.name,
      severity: "normal"
    })
  })

  // Add audit logs
  audits.forEach((auditLog) => {
    events.push({
      id: `audit-${auditLog.id}`,
      type: "audit",
      title: `Denetim: ${auditLog.title}`,
      description: auditLog.notes || "Açıklama yok",
      date: new Date(auditLog.createdAt),
      status: auditLog.status,
      person: auditLog.inspector?.name,
      severity: "normal"
    })
  })

  // Sort by date descending (newest first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime())

  const getEventIcon = (type: string) => {
    switch (type) {
      case "inspection": return Shield
      case "deficiency": return AlertTriangle
      case "document": return FileText
      case "audit": return Camera
      default: return Clock
    }
  }

  const getEventColor = (type: string, severity?: string) => {
    switch (type) {
      case "inspection":
        return "bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400"
      case "deficiency":
        if (severity === "CRITICAL") return "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400"
        if (severity === "HIGH") return "bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-400"
        return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-400"
      case "document":
        return "bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-400"
      case "audit":
        return "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400"
      default:
        return "bg-slate-100 dark:bg-slate-800 border-slate-500 text-slate-700 dark:text-slate-400"
    }
  }

  const getEventBadge = (status?: string) => {
    if (!status) return null
    
    const statusMap: Record<string, { label: string; color: string }> = {
      "APPROVED": { label: "Onaylandı", color: "bg-green-500/20 text-green-400" },
      "REJECTED": { label: "Reddedildi", color: "bg-red-500/20 text-red-400" },
      "PENDING": { label: "Beklemede", color: "bg-yellow-500/20 text-yellow-400" },
      "OPEN": { label: "Açık", color: "bg-red-500/20 text-red-400" },
      "CLOSED": { label: "Kapatıldı", color: "bg-green-500/20 text-green-400" },
      "FIX_PENDING": { label: "Düzeltme Bekliyor", color: "bg-orange-500/20 text-orange-400" },
      "VERIFY_PENDING": { label: "Kontrol Bekliyor", color: "bg-blue-500/20 text-blue-400" },
      "ACTIVE": { label: "Aktif", color: "bg-green-500/20 text-green-400" },
      "STATUS_CHANGE": { label: "Durum Değişikliği", color: "bg-purple-500/20 text-purple-400" },
      "PASSED": { label: "Geçti", color: "bg-green-500/20 text-green-400" },
      "FAILED": { label: "Kaldı", color: "bg-red-500/20 text-red-400" },
      "ACTION_REQUIRED": { label: "İşlem Gerekiyor", color: "bg-orange-500/20 text-orange-400" }
    }

    const badge = statusMap[status]
    if (!badge) return null

    return <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>{badge.label}</span>
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Zaman Makinesi (Timeline)</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">{events.length} olay</span>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          Henüz kayıt bulunmuyor
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = getEventIcon(event.type)
            const colorClass = getEventColor(event.type, event.severity)
            
            return (
              <div key={event.id} className="relative pl-8">
                {/* Timeline Line */}
                {index < events.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                )}
                
                {/* Timeline Dot */}
                <div className={`absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-3 h-3" />
                </div>
                
                {/* Event Card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-900 dark:text-white">{event.title}</h4>
                        {getEventBadge(event.status)}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{event.description}</p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-4">
                      {event.date.toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {event.person && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{event.person}</span>
                      </div>
                    )}
                    {event.type === "deficiency" && event.severity && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{event.severity === "CRITICAL" ? "Kritik" : event.severity === "HIGH" ? "Yüksek" : event.severity === "MEDIUM" ? "Orta" : "Düşük"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
