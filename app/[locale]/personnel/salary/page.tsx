/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { Wallet, Download, FileText, Calendar, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import NewAdvanceRequestButton from "./NewAdvanceRequestButton"

// TL formatlama
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount)
}

// Durum konfigürasyonu
function getStatusConfig(status: string) {
  const statusConfigs: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: "Bekliyor", color: "text-amber-400 bg-amber-500/20", icon: Clock },
    APPROVED: { label: "Onaylandı", color: "text-green-400 bg-green-500/20", icon: CheckCircle },
    REJECTED: { label: "Reddedildi", color: "text-red-400 bg-red-500/20", icon: XCircle }
  }
  return statusConfigs[status] || { label: status, color: "text-slate-400 bg-slate-500/20", icon: Clock }
}

async function getSalaryData(userId: string) {
  const personel = await prisma.personel.findFirst({
    where: { userId },
    select: { id: true, salary: true }
  })

  if (!personel) {
    return {
      salarySummary: {
        currentMonth: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
        grossSalary: 0,
        netSalary: 0,
        totalDeductions: 0,
        activeAdvance: 0
      },
      payslips: [],
      advanceRequests: []
    }
  }

  // Maaş ödemelerini çek (son 6 ay)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const salaryPayments = await prisma.personelPayment.findMany({
    where: {
      personelId: personel.id,
      type: { in: ["MAAS", "SALARY"] },
      date: { gte: sixMonthsAgo }
    },
    orderBy: {
      date: "desc"
    }
  })

  // Avans taleplerini çek
  const advancePayments = await prisma.personelPayment.findMany({
    where: {
      personelId: personel.id,
      type: "AVANS"
    },
    orderBy: {
      date: "desc"
    }
  })

  // Aktif avans (PENDING durumu)
  const activeAdvance = advancePayments
    .filter((p: any) => p.status === "PENDING")
    .reduce((sum: number, p: any) => sum + p.amount, 0)

  // Brüt maaş (personel tablosundan veya son ödemeden)
  const grossSalary = personel.salary || (salaryPayments[0]?.amount || 0)
  // Net maaş (yaklaşık %85 brüt)
  const netSalary = grossSalary * 0.85
  const totalDeductions = grossSalary - netSalary

  // Maaş bordrolarını formatla
  const payslips = salaryPayments.map((payment: any) => ({
    id: payment.id,
    month: payment.period || new Date(payment.date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    gross: payment.amount,
    net: payment.amount * 0.85,
    status: payment.isPaid ? "paid" : "pending"
  }))

  // Avans taleplerini formatla
  const advanceRequests = advancePayments.map((payment: any) => ({
    id: payment.id,
    amount: payment.amount,
    date: new Date(payment.date).toISOString().split('T')[0],
    reason: payment.description || "-",
    status: payment.status?.toLowerCase() || "pending"
  }))

  return {
    salarySummary: {
      currentMonth: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
      grossSalary,
      netSalary,
      totalDeductions,
      activeAdvance
    },
    payslips,
    advanceRequests
  }
}

export default async function SalaryPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { salarySummary, payslips, advanceRequests } = await getSalaryData(session.user.id)

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Maaş ve Avans</h1>
        <p className="text-slate-400">Maaş bordrolarınız ve avans talepleriniz</p>
      </div>

      {/* Salary Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-blue-400" />
            <p className="text-blue-300 text-sm">Brüt Maaş</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(salarySummary.grossSalary)}</p>
          <p className="text-blue-300/60 text-xs mt-1">{salarySummary.currentMonth}</p>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <p className="text-green-300 text-sm">Net Maaş</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(salarySummary.netSalary)}</p>
          <p className="text-green-300/60 text-xs mt-1">Kesintiler sonrası</p>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300 text-sm">Toplam Kesinti</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(salarySummary.totalDeductions)}</p>
          <p className="text-red-300/60 text-xs mt-1">Vergi + SGK</p>
        </div>

        <div className="bg-gradient-to-br from-amber-600/20 to-orange-700/20 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            <p className="text-amber-300 text-sm">Aktif Avans</p>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(salarySummary.activeAdvance)}</p>
          <p className="text-amber-300/60 text-xs mt-1">Borçlu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payslips */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">Maaş Bordroları</h2>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {payslips.map((payslip) => (
              <div key={payslip.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{payslip.month}</p>
                    <p className="text-slate-400 text-sm">Brüt: {formatCurrency(payslip.gross)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">{formatCurrency(payslip.net)}</p>
                      <p className="text-slate-500 text-xs">Net</p>
                    </div>
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advance Requests */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">Avans Talepleri</h2>
            </div>
            <NewAdvanceRequestButton />
          </div>

          <div className="divide-y divide-slate-800">
            {advanceRequests.map((request: any) => {
              const status = getStatusConfig(request.status.toUpperCase())
              const StatusIcon = status.icon
              return (
                <div key={request.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold">{formatCurrency(request.amount)}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{request.reason}</p>
                      <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {request.date}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
