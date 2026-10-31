/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { getBillings, getBillingStats } from "@/app/actions/billing"
import { motion } from "framer-motion"
import { Building2, FileText, TrendingDown, Calendar, DollarSign, Clock } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function BillingsPage() {
  const billingsResult = await getBillings()
  const statsResult = await getBillingStats()

  const billings = billingsResult.success ? (billingsResult.data ?? []) : []
  const stats = statsResult.success ? (statsResult.data ?? { totalGross: 0, pendingApprovals: 0, totalDeductions: 0 }) : { totalGross: 0, pendingApprovals: 0, totalDeductions: 0 }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      DRAFT: { bg: 'bg-gray-500/20', text: 'text-gray-300', label: 'Taslak' },
      PENDING_APPROVAL: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Onay Bekliyor' },
      APPROVED: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Onaylandı' },
      PAID: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Ödendi' }
    }

    const config = statusConfig[status] || statusConfig.DRAFT
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Hakediş Yönetimi</h1>
          <p className="text-slate-400">Taşeron ödemelerini ve hakedişleri takip edin</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <DollarSign className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-xs text-slate-400">Kümülatif Toplam</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats?.totalGross ?? 0)}</p>
            <p className="text-sm text-slate-400">Toplam Hakediş Tutarı</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs text-slate-400">Bekleyen</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats?.pendingApprovals ?? 0}</p>
            <p className="text-sm text-slate-400">Onay Bekleyen Hakediş</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-500/20 rounded-xl">
                <TrendingDown className="w-6 h-6 text-rose-400" />
              </div>
              <span className="text-xs text-slate-400">Kesintiler</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats?.totalDeductions ?? 0)}</p>
            <p className="text-sm text-slate-400">Toplam Kesinti Tutarı</p>
          </motion.div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white">Hakediş Listesi</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Taşeron
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Hakediş No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Dönem
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Brüt Tutar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Kesintiler
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Net Ödenecek
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {!billings || billings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-12 h-12 text-slate-600" />
                        <p>Henüz hakediş kaydı bulunmuyor</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  billings.map((billing: any) => (
                    <tr
                      key={billing.id}
                      className="hover:bg-slate-700/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <Building2 className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {billing.contract?.subcontractor?.name || '-'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {billing.contract?.project?.name || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-white font-medium">
                          #{billing.billingNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          {new Date(billing.period).toLocaleDateString('tr-TR', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-white font-medium">
                          {formatCurrency(billing.grossAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-rose-400">
                          {formatCurrency(
                            billing.advanceDeduction + billing.penaltyDeduction + billing.retentionDeduction
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-emerald-400 font-semibold">
                          {formatCurrency(billing.netPayable)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(billing.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
