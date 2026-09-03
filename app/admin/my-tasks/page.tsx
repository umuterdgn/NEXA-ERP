"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { toast } from "react-hot-toast"
import { CheckCircle, Clock, Circle, LogOut, Wallet, Calendar as CalendarIcon, User } from "lucide-react"

export default function MyTasksPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // All authenticated users can access their own tasks
    fetchTasks()
    fetchAttendance()
    setIsLoading(false)
  }, [status, session, router])

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?workerId=${session?.user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance/personnel/me`)
      if (response.ok) {
        const data = await response.json()
        setAttendanceRecords(data)
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ))
        toast.success("Görev durumu güncellendi")
      } else {
        toast.error("Görev güncellenemedi")
      }
    } catch (error) {
      toast.error("Hata oluştu")
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  const todoTasks = tasks.filter(t => t.status === "TODO")
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS")
  const doneTasks = tasks.filter(t => t.status === "DONE")
  const recentAttendance = attendanceRecords.slice(0, 5)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Hoş Geldin, {session?.user?.name || 'Personel'}
          </h1>
          <p className="text-slate-400">Personel Portalı</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Tamamlanan Görevler</p>
              <p className="text-2xl font-bold text-white">{doneTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Devam Eden Görevler</p>
              <p className="text-2xl font-bold text-white">{inProgressTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Bu Hafta Mesai</p>
              <p className="text-2xl font-bold text-white">{recentAttendance.length} gün</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Bugünkü Görevlerin</h2>
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
              {tasks.length} görev
            </span>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TODO Column */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Circle className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-white">Bekleyenler</h3>
                <span className="ml-auto bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-sm">
                  {todoTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {todoTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={(status) => updateTaskStatus(task.id, status)}
                  />
                ))}
                {todoTasks.length === 0 && (
                  <div className="text-center text-slate-500 py-8">Görev yok</div>
                )}
              </div>
            </div>

            {/* IN_PROGRESS Column */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Yapılıyor</h3>
                <span className="ml-auto bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm">
                  {inProgressTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {inProgressTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={(status) => updateTaskStatus(task.id, status)}
                  />
                ))}
                {inProgressTasks.length === 0 && (
                  <div className="text-center text-slate-500 py-8">Görev yok</div>
                )}
              </div>
            </div>

            {/* DONE Column */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-white">Tamamlandı</h3>
                <span className="ml-auto bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm">
                  {doneTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {doneTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={(status) => updateTaskStatus(task.id, status)}
                  />
                ))}
                {doneTasks.length === 0 && (
                  <div className="text-center text-slate-500 py-8">Görev yok</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Son Mesailerim</h2>
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            {recentAttendance.length > 0 ? (
              <div className="space-y-3">
                {recentAttendance.map((record) => (
                  <div key={record.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-white font-medium">
                        {new Date(record.date).toLocaleDateString('tr-TR')}
                      </span>
                      <span className="text-green-400 text-sm">{record.dayMultiplier || 1} gün</span>
                    </div>
                    <div className="text-sm text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Giriş:</span>
                        <span>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString('tr-TR') : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Çıkış:</span>
                        <span>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString('tr-TR') : '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">
                Mesai kaydı bulunmuyor
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task, onStatusChange }: { task: any; onStatusChange: (status: string) => void }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors">
      <h3 className="text-white font-medium mb-2">{task.title}</h3>
      {task.description && (
        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex gap-2">
        {task.status !== "TODO" && (
          <button
            onClick={() => onStatusChange("TODO")}
            className="flex-1 px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded hover:bg-yellow-600/30 text-sm"
          >
            Bekle
          </button>
        )}
        {task.status !== "IN_PROGRESS" && (
          <button
            onClick={() => onStatusChange("IN_PROGRESS")}
            className="flex-1 px-3 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 text-sm"
          >
            Başla
          </button>
        )}
        {task.status !== "DONE" && (
          <button
            onClick={() => onStatusChange("DONE")}
            className="flex-1 px-3 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 text-sm"
          >
            Bitir
          </button>
        )}
      </div>
    </div>
  )
}
