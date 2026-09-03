"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useState, useEffect } from "react"
import { Bell, CheckCircle, AlertTriangle, Info, AlertCircle, Check, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS" | "URGENT"
  isRead: boolean
  link?: string
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/admin/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true })
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      })
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "URGENT":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case "ERROR":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case "WARNING":
        return <AlertTriangle className="w-5 h-5 text-orange-400" />
      case "SUCCESS":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "URGENT":
      case "ERROR":
        return "border-red-700 bg-red-900/20"
      case "WARNING":
        return "border-orange-700 bg-orange-900/20"
      case "SUCCESS":
        return "border-green-700 bg-green-900/20"
      default:
        return "border-blue-700 bg-blue-900/20"
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Az önce"
    if (minutes < 60) return `${minutes} dk önce`
    if (hours < 24) return `${hours} saat önce`
    return `${days} gün önce`
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "ALL") return true
    if (filter === "UNREAD") return !n.isRead
    if (filter === "READ") return n.isRead
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="lg:mt-0 mt-16">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">Bildirimler</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} okunmamış
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === "ALL" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter("UNREAD")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === "UNREAD" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Okunmamış
            </button>
            <button
              onClick={() => setFilter("READ")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === "READ" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Okunmuş
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              Tümünü Okundu İşaretle
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-slate-400 text-sm">Yükleniyor...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Bildirim bulunmuyor</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-800/50 transition-colors ${
                  !notification.isRead ? "bg-slate-800/30" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg border ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                            title="Okundu İşaretle"
                          >
                            <Check className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">{formatTime(notification.createdAt)}</span>
                      {notification.link && (
                        <Link href={notification.link} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                          <ExternalLink className="w-3 h-3" />
                          <span>Görüntüle</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}