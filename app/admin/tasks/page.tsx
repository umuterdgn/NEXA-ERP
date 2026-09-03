"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Calendar, ListTodo, Clock, MapPin, User } from "lucide-react"

export default function TasksPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [selectedWorkerId, setSelectedWorkerId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"kanban" | "calendar">("kanban")
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedTo: "",
    dueDate: "",
    dueTime: "",
    taskType: ""
  })

  useEffect(() => {
    fetchProjects()
    fetchWorkers()
    fetchAllTasks()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWorkers = async () => {
    try {
      const response = await fetch("/api/admin/personnel")
      if (response.ok) {
        const data = await response.json()
        setWorkers(data)
      }
    } catch (error) {
      console.error("Failed to fetch personnel:", error)
    }
  }

  const fetchAllTasks = async () => {
    try {
      const response = await fetch("/api/admin/tasks")
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      toast.error("Başlık zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      // Combine date and time for dueDate
      let dueDate = null
      if (formData.dueDate && formData.dueTime) {
        dueDate = new Date(`${formData.dueDate}T${formData.dueTime}`)
      } else if (formData.dueDate) {
        dueDate = new Date(formData.dueDate)
      }

      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          projectId: formData.projectId || null,
          assignedTo: formData.assignedTo || null,
          dueDate: dueDate?.toISOString() || null,
          taskType: formData.taskType || null
        })
      })

      if (response.ok) {
        toast.success("Görev başarıyla eklendi")
        fetchAllTasks()
        closeModal()
      } else {
        toast.error("Görev eklenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Görev eklenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success("Görev durumu güncellendi")
        fetchAllTasks()
      } else {
        toast.error("Görev durumu güncellenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Görev durumu güncellenirken hata oluştu")
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm("Bu görevi silmek istediğinize emin misiniz?")) return

    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Görev silindi")
        fetchAllTasks()
      } else {
        toast.error("Görev silinirken hata oluştu")
      }
    } catch (error) {
      toast.error("Görev silinirken hata oluştu")
    }
  }

  const handleEdit = (task: any) => {
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description || "",
      projectId: task.projectId || "",
      assignedTo: task.assignedTo || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      dueTime: task.dueDate ? new Date(task.dueDate).toTimeString().split(' ')[0].substring(0, 5) : "",
      taskType: task.taskType || ""
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      toast.error("Başlık zorunludur")
      return
    }

    setIsSubmitting(true)
    try {
      // Combine date and time for dueDate
      let dueDate = null
      if (formData.dueDate && formData.dueTime) {
        dueDate = new Date(`${formData.dueDate}T${formData.dueTime}`)
      } else if (formData.dueDate) {
        dueDate = new Date(formData.dueDate)
      }

      const response = await fetch(`/api/admin/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          projectId: formData.projectId || null,
          assignedTo: formData.assignedTo || null,
          dueDate: dueDate?.toISOString() || null,
          taskType: formData.taskType || null
        })
      })

      if (response.ok) {
        toast.success("Görev güncellendi")
        fetchAllTasks()
        closeEditModal()
      } else {
        toast.error("Görev güncellenirken hata oluştu")
      }
    } catch (error) {
      toast.error("Görev güncellenirken hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedTask(null)
    setFormData({
      title: "",
      description: "",
      projectId: "",
      assignedTo: "",
      dueDate: "",
      dueTime: "",
      taskType: ""
    })
  }

  const openModal = () => {
    setFormData({
      title: "",
      description: "",
      projectId: selectedProjectId,
      assignedTo: "",
      dueDate: "",
      dueTime: "",
      taskType: ""
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({
      title: "",
      description: "",
      projectId: selectedProjectId,
      assignedTo: "",
      dueDate: "",
      dueTime: "",
      taskType: ""
    })
  }

  const filteredTasks = selectedProjectId 
    ? tasks.filter(task => task.projectId === selectedProjectId)
    : tasks.filter(task => !selectedWorkerId || task.assignedTo === selectedWorkerId)

  const todoTasks = filteredTasks.filter(task => task.status === "TODO")
  const inProgressTasks = filteredTasks.filter(task => task.status === "IN_PROGRESS")
  const inReviewTasks = filteredTasks.filter(task => task.status === "IN_REVIEW")
  const doneTasks = filteredTasks.filter(task => task.status === "DONE")

  const isTaskOverdue = (task: any) => {
    if (!task.dueDate || task.status === "DONE") return false
    const dueDate = new Date(task.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dueDate < today
  }

  // Calendar View Functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()
    return { daysInMonth, startDayOfWeek }
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return taskDate.toDateString() === date.toDateString()
    })
  }

  const getDailySchedule = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return tasks
      .filter(task => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.toDateString() === today.toDateString()
      })
      .map(task => ({
        ...task,
        time: task.dueDate ? new Date(task.dueDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Belirtilmemiş'
      }))
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "TODO": return "IN_PROGRESS"
      case "IN_PROGRESS": return "IN_REVIEW"
      case "IN_REVIEW": return "DONE"
      case "DONE": return "TODO"
      default: return "TODO"
    }
  }

  const getButtonLabel = (status: string) => {
    switch (status) {
      case "TODO": return "Başla →"
      case "IN_PROGRESS": return "Kontrol →"
      case "IN_REVIEW": return "Onayla →"
      case "DONE": return "Yeniden"
      default: return "İleri →"
    }
  }

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))
  }

  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
  const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]

  if (isLoading) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="lg:mt-0 mt-16">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          📋 Görevler & Takvim
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${
              viewMode === "kanban" 
                ? "bg-blue-600 text-white" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <ListTodo className="w-5 h-5" />
            Kanban
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${
              viewMode === "calendar" 
                ? "bg-blue-600 text-white" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Calendar className="w-5 h-5" />
            Takvim
          </button>
          <button
            onClick={openModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Görev Ekle
          </button>
        </div>
      </div>

      {/* Project and Worker Filters */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <label className="block text-sm font-medium text-slate-300 mb-2">Proje Filtrele</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Tüm Projeler</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.title}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <label className="block text-sm font-medium text-slate-300 mb-2">Personel Filtrele</label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            >
              <option value="">Tüm Personel</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* TODO Column */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-slate-500 rounded-full"></span>
              Yapılacaklar
              <span className="text-slate-400 text-sm">({todoTasks.length})</span>
            </h2>
          </div>
          <div className="space-y-3">
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleUpdateStatus}
                onDelete={handleDelete}
                onEdit={handleEdit}
                isOverdue={isTaskOverdue(task)}
              />
            ))}
            {todoTasks.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                Görev yok
              </div>
            )}
          </div>
        </div>

        {/* IN_PROGRESS Column */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              Devam Edenler
              <span className="text-slate-400 text-sm">({inProgressTasks.length})</span>
            </h2>
          </div>
          <div className="space-y-3">
            {inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleUpdateStatus}
                onDelete={handleDelete}
                onEdit={handleEdit}
                isOverdue={isTaskOverdue(task)}
              />
            ))}
            {inProgressTasks.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                Görev yok
              </div>
            )}
          </div>
        </div>

        {/* IN_REVIEW Column */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              Kontrol Bekleyenler
              <span className="text-slate-400 text-sm">({inReviewTasks.length})</span>
            </h2>
          </div>
          <div className="space-y-3">
            {inReviewTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleUpdateStatus}
                onDelete={handleDelete}
                onEdit={handleEdit}
                isOverdue={isTaskOverdue(task)}
              />
            ))}
            {inReviewTasks.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                Görev yok
              </div>
            )}
          </div>
        </div>

        {/* DONE Column */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Tamamlananlar
              <span className="text-slate-400 text-sm">({doneTasks.length})</span>
            </h2>
          </div>
          <div className="space-y-3">
            {doneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleUpdateStatus}
                onDelete={handleDelete}
                onEdit={handleEdit}
                isOverdue={false}
              />
            ))}
            {doneTasks.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                Görev yok
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="space-y-6">
          {/* Daily Schedule */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Bugünün Görev Planı
            </h2>
            <div className="space-y-3">
              {getDailySchedule().length > 0 ? (
                getDailySchedule().map((task) => (
                  <div key={task.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-400 font-medium">{task.time}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300 font-medium">{task.title}</span>
                        </div>
                        {task.description && (
                          <p className="text-slate-400 text-sm mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {task.project && (
                            <span className="bg-slate-700 px-2 py-1 rounded flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {task.project.name || task.project.title}
                            </span>
                          )}
                          {task.worker && (
                            <span className="bg-slate-700 px-2 py-1 rounded flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {task.worker.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(task.id, getNextStatus(task.status))}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                        >
                          {getButtonLabel(task.status)}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Bugün için planlanmış görev yok
                </div>
              )}
            </div>
          </div>

          {/* Monthly Calendar */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={prevMonth}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold text-white">
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h2>
              <button
                onClick={nextMonth}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <div className="grid grid-cols-7 gap-2 min-w-[800px]">
                {(() => {
                  const { daysInMonth, startDayOfWeek } = getDaysInMonth(selectedDate)
                  const calendarDays = []
                  
                  // Empty cells for days before the first day of the month
                  for (let i = 0; i < startDayOfWeek; i++) {
                    calendarDays.push(
                      <div key={`empty-${i}`} className="h-24 bg-slate-800/50 rounded-lg"></div>
                    )
                  }
                  
                  // Actual days of the month
                  for (let i = 0; i < daysInMonth; i++) {
                    const day = i + 1
                    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
                    const dayTasks = getTasksForDate(date)
                    const isToday = date.toDateString() === new Date().toDateString()

                    calendarDays.push(
                      <div
                        key={day}
                        className={`h-24 bg-slate-800 rounded-lg p-2 overflow-hidden hover:bg-slate-700 transition-colors cursor-pointer ${
                          isToday ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        <div className="text-sm text-slate-300 mb-1">{day}</div>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 2).map((task) => (
                            <div
                              key={task.id}
                              className="text-xs truncate p-1 rounded mb-1 bg-blue-900/30 text-blue-400"
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="text-xs text-slate-500">
                              +{dayTasks.length - 2} daha
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  
                  return calendarDays
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">Görev Düzenle</h3>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Başlık *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje (Opsiyonel)</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Proje Seçin</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Atanan Kişi (Opsiyonel)</label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Kişi Seçin</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Son Tarih (Opsiyonel)</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Saat (Opsiyonel)</label>
                <input
                  type="time"
                  name="dueTime"
                  value={formData.dueTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Görev Tipi (Opsiyonel)</label>
                <select
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Görev Tipi Seçin</option>
                  <option value="Beton Kontrolü">Beton Kontrolü</option>
                  <option value="Demir Kontrolü">Demir Kontrolü</option>
                  <option value="Evrak Teslimi">Evrak Teslimi</option>
                  <option value="Saha Denetimi">Saha Denetimi</option>
                  <option value="Malzeme Kontrolü">Malzeme Kontrolü</option>
                  <option value="İSG Kontrolü">İSG Kontrolü</option>
                  <option value="Toplantı">Toplantı</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Güncelleniyor..." : "Güncelle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">Yeni Görev Ekle</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Başlık *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proje (Opsiyonel)</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Proje Seçin</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Atanan Kişi (Opsiyonel)</label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Kişi Seçin</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Son Tarih (Opsiyonel)</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Saat (Opsiyonel)</label>
                <input
                  type="time"
                  name="dueTime"
                  value={formData.dueTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Görev Tipi (Opsiyonel)</label>
                <select
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Görev Tipi Seçin</option>
                  <option value="Beton Kontrolü">Beton Kontrolü</option>
                  <option value="Demir Kontrolü">Demir Kontrolü</option>
                  <option value="Evrak Teslimi">Evrak Teslimi</option>
                  <option value="Saha Denetimi">Saha Denetimi</option>
                  <option value="Malzeme Kontrolü">Malzeme Kontrolü</option>
                  <option value="İSG Kontrolü">İSG Kontrolü</option>
                  <option value="Toplantı">Toplantı</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Ekleniyor..." : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, onStatusChange, onDelete, isOverdue, onEdit }: any) {
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "TODO": return "IN_PROGRESS"
      case "IN_PROGRESS": return "IN_REVIEW"
      case "IN_REVIEW": return "DONE"
      case "DONE": return "TODO"
      default: return "TODO"
    }
  }

  const getButtonLabel = (status: string) => {
    switch (status) {
      case "TODO": return "Başla →"
      case "IN_PROGRESS": return "Kontrol →"
      case "IN_REVIEW": return "Onayla →"
      case "DONE": return "Yeniden"
      default: return "İleri →"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO": return "bg-slate-700"
      case "IN_PROGRESS": return "bg-blue-900/30 border-blue-800"
      case "IN_REVIEW": return "bg-yellow-900/30 border-yellow-800"
      case "DONE": return "bg-green-900/30 border-green-800"
      default: return "bg-slate-700"
    }
  }

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor(task.status)} hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-white font-medium text-sm flex-1">{task.title}</h3>
        {isOverdue && (
          <span className="px-2 py-0.5 bg-red-900/50 text-red-400 text-xs rounded-full font-medium whitespace-nowrap">
            Süresi Geçmiş
          </span>
        )}
      </div>
      
      {task.description && (
        <p className="text-slate-400 text-xs mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        {task.project && (
          <span className="bg-slate-800 px-2 py-1 rounded">
            {task.project.name || task.project.title}
          </span>
        )}
        {task.worker && (
          <span className="bg-slate-800 px-2 py-1 rounded">
            {task.worker.name}
          </span>
        )}
        {task.dueDate && (
          <span className={isOverdue ? "text-red-400" : ""}>
            {new Date(task.dueDate).toLocaleDateString("tr-TR")}
          </span>
        )}
      </div>

      {/* Onay Butonları (IN_REVIEW durumu için) */}
      {task.status === "IN_REVIEW" && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => onStatusChange(task.id, "DONE")}
            className="flex-1 px-2 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded transition-colors"
          >
            ✓ Onayla
          </button>
          <button
            onClick={() => onStatusChange(task.id, "IN_PROGRESS")}
            className="flex-1 px-2 py-1.5 bg-orange-700 hover:bg-orange-600 text-white text-xs rounded transition-colors"
          >
            ← Geri Gönder
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {task.status !== "IN_REVIEW" && (
          <button
            onClick={() => onStatusChange(task.id, getNextStatus(task.status))}
            className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
          >
            {getButtonLabel(task.status)}
          </button>
        )}
        <button
          onClick={() => onEdit(task)}
          className="px-2 py-1.5 bg-blue-900/50 hover:bg-blue-900 text-blue-400 text-xs rounded transition-colors"
        >
          Düzenle
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="px-2 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-400 text-xs rounded transition-colors"
        >
          Sil
        </button>
      </div>
    </div>
  )
}
