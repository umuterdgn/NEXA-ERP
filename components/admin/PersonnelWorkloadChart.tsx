"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Personel İş Yükü (Personnel Workload) Bar Chart
 */

import React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

export interface WorkloadItem {
  name: string
  taskCount: number
  position: string
}

interface PersonnelWorkloadChartProps {
  data: WorkloadItem[]
}

const BAR_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981"]

export default function PersonnelWorkloadChart({ data }: PersonnelWorkloadChartProps) {
  if (!data || data.length === 0 || data.every(d => d.taskCount === 0)) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-400">Üzerinde açık/devam eden görev bulunan personel bulunmuyor.</p>
        <p className="text-[11px] text-slate-500 mt-1">Yeni iş emri atandığında grafik gerçek verilerle güncellenir.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
        <XAxis type="number" stroke="#94a3b8" allowDecimals={false} />
        <YAxis 
          dataKey="name" 
          type="category" 
          stroke="#94a3b8" 
          width={120} 
          tick={{ fill: "#94a3b8", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: "#1e293b", 
            border: "1px solid #334155", 
            borderRadius: "8px", 
            color: "#e2e8f0" 
          }}
          formatter={(value: any, _name: any, item: any) => [
            `${value} Aktif Görev (${item?.payload?.position || 'Saha'})`,
            "İş Yükü"
          ]}
        />
        <Bar dataKey="taskCount" radius={[0, 6, 6, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
