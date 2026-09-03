/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Plus, Calendar } from "lucide-react";

interface GanttChartProps {
  projectId: string;
}

type GanttTaskRecord = {
  id?: string;
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
  progress?: number | string | null;
};

export default function GanttChart({ projectId }: GanttChartProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    progress: 0,
  });

  const getProgressColor = useCallback((progress: number) => {
    if (progress >= 100) return "#22c55e"; // green
    if (progress >= 75) return "#3b82f6"; // blue
    if (progress >= 50) return "#eab308"; // yellow
    if (progress >= 25) return "#f97316"; // orange
    return "#ef4444"; // red
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(`/api/project-tasks?projectId=${projectId}`);
      if (!response.ok) {
        setTasks([]);
        return;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        setTasks([]);
        return;
      }

      const ganttTasks = (data as GanttTaskRecord[])
        .map((task) => {
          if (!task || !task.id) return null;

          const startValue = task?.startDate ? new Date(String(task.startDate)) : new Date(Date.now());
          const endValue = task?.endDate ? new Date(String(task.endDate)) : new Date(Date.now());
          const progressValue = Number(task?.progress ?? 0);

          if (Number.isNaN(startValue.getTime()) || Number.isNaN(endValue.getTime())) {
            return null;
          }

          return {
            id: String(task.id),
            name: String(task.name || "İş Planı Görevi"),
            start: startValue,
            end: endValue,
            progress: Math.min(100, Math.max(0, progressValue)),
            type: "task" as const,
            isDisabled: false,
            styles: {
              progressColor: getProgressColor(progressValue),
              progressSelectedColor: getProgressColor(progressValue),
            },
          };
        })
        .filter((task: any): task is Task => Boolean(task) && Boolean(task.start) && Boolean(task.end));

      setTasks(ganttTasks as any);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [getProgressColor, projectId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchTasks();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/project-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectId,
          progress: parseInt(formData.progress.toString()),
        }),
      });

      if (response.ok) {
        await fetchTasks();
        setIsModalOpen(false);
        setFormData({ name: "", startDate: "", endDate: "", progress: 0 });
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return <div className="p-4 text-slate-500">Henüz iş planı oluşturulmadı.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>%100+</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>%75+</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>%50+</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>%25+</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>%0-25</span>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Görev Ekle
        </button>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
        <style jsx global>{`
          .gantt-container {
            background-color: #0f172a !important;
          }
          .gantt-chart {
            background-color: #0f172a !important;
          }
          .gantt-header {
            background-color: #1e293b !important;
            color: #e2e8f0 !important;
          }
          .gantt-task {
            background-color: #334155 !important;
            color: #e2e8f0 !important;
            border: 1px solid #475569 !important;
          }
          .gantt-task:hover {
            background-color: #475569 !important;
          }
          .gantt-timeline {
            background-color: #0f172a !important;
          }
          .gantt-timeline-date {
            color: #94a3b8 !important;
          }
          .gantt-timeline-row {
            border-color: #1e293b !important;
          }
        `}</style>
        <Gantt
          tasks={tasks}
          viewMode={ViewMode.Day}
          onDateChange={(task) => {
            console.log("Date changed:", task);
          }}
          onProgressChange={(task) => {
            console.log("Progress changed:", task);
          }}
          onDoubleClick={(task) => {
            console.log("Double clicked:", task);
          }}
          listCellWidth="155px"
          ganttHeight={400}
        />
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p>Henüz iş planı oluşturulmadı.</p>
          <p className="text-sm mt-2">İlk görevi eklemek için Yeni Görev Ekle butonuna tıklayın.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Yeni Görev Ekle</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Görev Adı *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Temel kazısı"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Başlangıç Tarihi *</label>
                  <input
                    required
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bitiş Tarihi *</label>
                  <input
                    required
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">İlerleme Yüzdesi (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-12 text-right">{formData.progress}%</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
