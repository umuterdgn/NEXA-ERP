"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface FinancialChartProps {
  data: any[]
}

export default function FinancialChart({ data }: FinancialChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="month" 
          stroke="#94a3b8" 
          style={{ fontSize: 12 }}
        />
        <YAxis 
          stroke="#94a3b8" 
          style={{ fontSize: 12 }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e293b', 
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#e2e8f0'
          }}
          itemStyle={{ color: '#94a3b8' }}
        />
        <Bar dataKey="gelir" fill="#10b981" name="Gelir" />
        <Bar dataKey="gider" fill="#ef4444" name="Gider" />
      </BarChart>
    </ResponsiveContainer>
  )
}