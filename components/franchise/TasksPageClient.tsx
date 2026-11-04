"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Franchise Görevler & Açılış Takvimi Client View with CreateTaskModal
 */

import React, { useState } from "react"
import Link from "next/link"
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Plus,
  ArrowRight,
  Sparkles,
  Filter,
  CheckSquare,
  ListTodo
} from "lucide-react"
import { toast } from "react-hot-toast"
import CreateTaskModal from "@/components/tasks/CreateTaskModal"

interface TasksPageClientProps {
  projects: any[]
  initialTasks: any[]
}

export default function TasksPageClient({ projects, initialTasks }: TasksPageClientProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCompleteTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "COMPLETED" } : t))
    )
    toast.success(`"${id}" görevi başarıyla tamamlandı olarak işaretlendi!`)
  }

  const handleTaskCreated = () => {
    toast.success("Yeni görev kritik yol takvimine eklendi.")
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            İş Planı & Kritik Yol (Critical Path)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-amber-400" />
            Görevler & Açılış Takvimi
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Yeni mağaza açılışlarında ruhsat, inşaat teslimi, raf montajı ve açılış lansman tarihlerini koordine edin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/franchise/rollout"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
          >
            <span>Rollout Kanban</span>
            <ArrowRight className="w-4 h-4 text-blue-400" />
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Görev Ekle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Toplam Görev</span>
            <ListTodo className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {tasks.length} <span className="text-xs text-slate-500 font-normal">adım</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Kritik yol takvimi aktif
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center justify-between">
            <span>Tamamlanan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {tasks.filter((t) => t.status === "COMPLETED").length} <span className="text-xs text-slate-500 font-normal">görev</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">
            Zamanında tamamlandı
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-amber-400 font-medium flex items-center justify-between">
            <span>Devam Eden</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {tasks.filter((t) => t.status === "IN_PROGRESS").length} <span className="text-xs text-slate-500 font-normal">görev</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Saha ekipleri çalışıyor
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-xs text-red-400 font-medium flex items-center justify-between">
            <span>Kritik Öncelikli</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 mt-2">
            {tasks.filter((t) => t.priority === "CRITICAL").length} <span className="text-xs text-slate-500 font-normal">adım</span>
          </div>
          <div className="text-[11px] text-red-400/80 mt-1">
            Açılışı geciktirebilecek kilitler
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-amber-400" />
          Açılış Kritik Yol Adımları
        </h2>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-amber-400 text-xs mt-0.5">{task.id}</span>
                <div>
                  <h3 className="text-base font-bold text-white">{task.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{task.store}</span>
                    <span className="text-slate-600">•</span>
                    <span>Bitiş: <strong className="text-white">{task.dueDate}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    task.priority === "CRITICAL"
                      ? "bg-red-950/60 text-red-400 border-red-800/50"
                      : task.priority === "HIGH"
                      ? "bg-amber-950/60 text-amber-400 border-amber-800/50"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {task.priority}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    task.status === "COMPLETED"
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                      : task.status === "IN_PROGRESS"
                      ? "bg-blue-950/60 text-blue-400 border-blue-800/50"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {task.status === "COMPLETED" ? "TAMAMLANDI" : task.status === "IN_PROGRESS" ? "DEVAM EDİYOR" : "BEKLEMEDE"}
                </span>

                {task.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    Tamamla
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTaskCreated}
      />
    </div>
  )
}
