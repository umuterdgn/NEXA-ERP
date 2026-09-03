"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Building2, Layers, Plus, Save } from "lucide-react"

interface StructureItem {
  id: string
  name: string
  status: "completed" | "in_progress" | "pending"
  children?: StructureItem[]
}

interface StructureTreeProps {
  projectId?: string
  structure?: StructureItem[]
}

interface ProjectTaskRecord {
  id: string
  name: string
  progress: number
  dependencies?: string | null
}

export default function StructureTree({ projectId, structure }: StructureTreeProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [fetchedTreeData, setFetchedTreeData] = useState<StructureItem[]>([])
  const [newName, setNewName] = useState("")
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const treeData = projectId ? fetchedTreeData : (structure ?? [])

  useEffect(() => {
    if (!projectId) return

    const fetchTree = async () => {
      try {
        const response = await fetch(`/api/project-tasks?projectId=${projectId}`)
        if (!response.ok) {
          setFetchedTreeData([])
          return
        }

        const data = await response.json()
        if (!Array.isArray(data)) {
          setFetchedTreeData([])
          return
        }

        const taskList = data as ProjectTaskRecord[]
        const rootTasks = taskList.filter((task) => !task.dependencies || !taskList.some((item) => item.id === task.dependencies))
        const byParent = taskList.reduce((acc: Record<string, ProjectTaskRecord[]>, task) => {
          const parentId = task.dependencies
          if (parentId) {
            acc[parentId] = acc[parentId] || []
            acc[parentId].push(task)
          }
          return acc
        }, {})

        const mapTask = (task: ProjectTaskRecord): StructureItem => ({
          id: task.id,
          name: task.name,
          status: task.progress >= 100 ? "completed" : task.progress > 0 ? "in_progress" : "pending",
          children: (byParent[task.id] || []).map(mapTask)
        })

        setFetchedTreeData(rootTasks.map(mapTask))
      } catch (error) {
        console.error("Error loading structure tree:", error)
        setFetchedTreeData([])
      }
    }

    fetchTree()
  }, [projectId, structure])

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="w-3 h-3 rounded-full bg-green-500" />
      case "in_progress":
        return <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
      case "pending":
        return <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Tamamlandı"
      case "in_progress":
        return "Devam Ediyor"
      case "pending":
        return "Bekliyor"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400"
      case "in_progress":
        return "text-orange-600 dark:text-orange-400"
      case "pending":
        return "text-slate-500 dark:text-slate-400"
      default:
        return "text-slate-600 dark:text-slate-400"
    }
  }

  const renderTreeItem = (item: StructureItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
            level > 0 ? "ml-4" : ""
          }`}
          onClick={() => hasChildren && toggleExpand(item.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )
          ) : (
            <span className="w-4 h-4" />
          )}
          
          {level === 0 ? (
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <Layers className="w-4 h-4 text-slate-400" />
          )}
          
          <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
            {item.name}
          </span>
          
          {getStatusIcon(item.status)}
          
          <span className={`text-xs ${getStatusColor(item.status)}`}>
            {getStatusLabel(item.status)}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children!.map((child) => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const handleCreateNode = async (parentId?: string | null) => {
    if (!projectId || !newName.trim()) return

    setIsSaving(true)
    const today = new Date().toISOString()
    const nextDay = new Date(Date.now() + 86400000).toISOString()

    try {
      const response = await fetch('/api/project-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: newName.trim(),
          startDate: today,
          endDate: nextDay,
          progress: 0,
          dependencies: parentId || null,
          notes: parentId ? 'Aşama alt iş kalemi' : 'Kök aşama'
        })
      })

      if (response.ok) {
        const updated = await fetch(`/api/project-tasks?projectId=${projectId}`)
        const data = await updated.json()
        if (Array.isArray(data)) {
          const taskList = data as ProjectTaskRecord[]
          const rootTasks = taskList.filter((task) => !task.dependencies || !taskList.some((item) => item.id === task.dependencies))
          const byParent = taskList.reduce((acc: Record<string, ProjectTaskRecord[]>, task) => {
            if (task.dependencies) {
              acc[task.dependencies] = acc[task.dependencies] || []
              acc[task.dependencies].push(task)
            }
            return acc
          }, {})

          setFetchedTreeData(rootTasks.map((task) => ({
            id: task.id,
            name: task.name,
            status: task.progress >= 100 ? 'completed' : task.progress > 0 ? 'in_progress' : 'pending',
            children: (byParent[task.id] || []).map((child) => ({
              id: child.id,
              name: child.name,
              status: child.progress >= 100 ? 'completed' : child.progress > 0 ? 'in_progress' : 'pending',
              children: (byParent[child.id] || []).map((nested) => ({
                id: nested.id,
                name: nested.name,
                status: nested.progress >= 100 ? 'completed' : nested.progress > 0 ? 'in_progress' : 'pending'
              }))
            }))
          })))
        }
        setNewName("")
        setIsAdding(false)
        setSelectedParentId(null)
      }
    } catch (error) {
      console.error('Failed to create tree node:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Yapı Ağacı (Dijital İkiz)
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Tamamlandı
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Devam Ediyor
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            Bekliyor
          </span>
        </div>
      </div>

      {projectId && (
        <div className="mb-4 space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Aşama Ekle
            </button>
            {selectedParentId && (
              <button
                type="button"
                onClick={() => setSelectedParentId(null)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Seçimi Kaldır
              </button>
            )}
          </div>

          {isAdding && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Aşama / alt iş kalemi adı"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleCreateNode(selectedParentId)}
                disabled={!newName.trim() || isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        {treeData.map((item) => renderTreeItem(item))}
      </div>
    </div>
  )
}
