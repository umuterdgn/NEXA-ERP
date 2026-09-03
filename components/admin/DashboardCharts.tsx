"use client"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */


import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"]

export default function DashboardCharts() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard")
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Format monthly data for chart
  const monthlyData = dashboardData?.financials 
    ? Object.entries(dashboardData.financials).map(([month, data]: [string, any]) => ({
        month: month,
        gelir: data.income,
        gider: data.expense
      }))
    : []

  // Format site distribution for pie chart
  const siteData = dashboardData?.siteDistribution
    ? Object.entries(dashboardData.siteDistribution).map(([name, value]: [string, any]) => ({
        name,
        value: Number(value)
      }))
    : []

  if (loading) {
    return (
      <div className="text-white text-center py-8">
        Yükleniyor...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue/Expense Chart */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Aylık Gelir/Gider</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="gelir" fill="#3b82f6" name="Gelir" />
                <Bar dataKey="gider" fill="#ef4444" name="Gider" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-center py-12">
              Henüz finans verisi yok
            </div>
          )}
        </div>

        {/* Personnel Distribution Chart */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Şantiye Personel Dağılımı</h3>
          {siteData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={siteData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {siteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Legend
                  wrapperStyle={{ color: "#e2e8f0" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-center py-12">
              Henüz personel verisi yok
            </div>
          )}
        </div>
      </div>

      {/* Critical Stocks and Upcoming Payments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Critical Stocks */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Kritik Stok Uyarıları</h3>
          {dashboardData?.criticalStocks?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.criticalStocks.map((stock: any) => (
                <div key={stock.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-medium text-white">{stock.name}</div>
                    <div className="text-sm text-slate-400">
                      {stock.quantity.toLocaleString("tr-TR")} {stock.unit}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-red-900/50 text-red-400 rounded-full text-xs font-medium">
                    Kritik
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">
              Kritik stok yok
            </div>
          )}
        </div>

        {/* Upcoming Payments */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Yaklaşan Ödemeler</h3>
          {dashboardData?.upcomingPayments?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.upcomingPayments.map((item: any) => (
                <div key={item.personnel.id} className="p-3 bg-slate-800 rounded-lg">
                  <div className="font-medium text-white mb-2">{item.personnel.name}</div>
                  <div className="space-y-1">
                    {item.payments.map((payment: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{payment.type}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-300">{payment.day}. gün</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            payment.isLate 
                              ? "bg-red-900/50 text-red-400" 
                              : "bg-orange-900/50 text-orange-400"
                          }`}>
                            {payment.isLate ? "Gecikti" : "Yaklaştı"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">
              Yaklaşan ödeme yok
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
