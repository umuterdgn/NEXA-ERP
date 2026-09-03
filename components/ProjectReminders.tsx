"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

interface Reminder {
  id: string
  title: string
  date: string
  isCompleted: boolean
  projectId: string
  createdAt: string
}

interface ProjectRemindersProps {
  projectId: string
}

export default function ProjectReminders({ projectId }: ProjectRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    date: ""
  })

  useEffect(() => {
    fetchReminders()
  }, [projectId])

  const fetchReminders = async () => {
    try {
      const response = await fetch(`/api/admin/reminders?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setReminders(data)
      }
    } catch (error) {
      console.error("Error fetching reminders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.date) {
      toast.error("Lütfen başlık ve tarih girin")
      return
    }

    try {
      const response = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          projectId
        })
      })

      if (response.ok) {
        toast.success("Hatırlatıcı eklendi")
        setFormData({ title: "", date: "" })
        setIsAdding(false)
        fetchReminders()
      } else {
        toast.error("Hatırlatıcı eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Hatırlatıcı eklenirken hata oluştu")
    }
  }

  const handleToggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/admin/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !isCompleted })
      })

      if (response.ok) {
        fetchReminders()
      }
    } catch (error) {
      toast.error("Durum güncellenirken hata oluştu")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reminders/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Hatırlatıcı silindi")
        fetchReminders()
      }
    } catch (error) {
      toast.error("Silinirken hata oluştu")
    }
  }

  const isOverdue = (date: string) => {
    return new Date(date) < new Date() && !reminders.find(r => r.date === date)?.isCompleted
  }

  if (isLoading) {
    return <div className="text-slate-400">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Hatırlatıcılar</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
          >
            + Ekle
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddReminder} className="bg-slate-800 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Başlık</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="Örn: Beton Dökümü"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tarih</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Kaydet
            </button>
          </div>
        </form>
      )}

      {reminders.length === 0 ? (
        <div className="text-center text-slate-500 py-8 bg-slate-800 rounded-lg">
          Henüz hatırlatıcı yok
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`bg-slate-800 rounded-lg p-4 border ${
                reminder.isCompleted
                  ? "border-green-900/50 opacity-60"
                  : isOverdue(reminder.date)
                  ? "border-red-900/50"
                  : "border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={reminder.isCompleted}
                      onChange={() => handleToggleComplete(reminder.id, reminder.isCompleted)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`font-medium ${
                        reminder.isCompleted
                          ? "text-slate-400 line-through"
                          : isOverdue(reminder.date)
                          ? "text-red-400"
                          : "text-white"
                      }`}
                    >
                      {reminder.title}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(reminder.date).toLocaleString("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    })}
                    {isOverdue(reminder.date) && !reminder.isCompleted && (
                      <span className="ml-2 text-red-400 text-xs font-medium">(Süresi Geçmiş)</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
