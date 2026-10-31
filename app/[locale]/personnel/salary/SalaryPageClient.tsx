/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import AdvanceRequestModal from "./AdvanceRequestModal"

interface SalaryPageClientProps {
  children: React.ReactNode
  payslips: any[]
  advanceRequests: any[]
}

export default function SalaryPageClient({ children, payslips, advanceRequests }: SalaryPageClientProps) {
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)

  return (
    <>
      {children}
      
      {/* Yeni Talep Button - Avans Talepleri başlığının yanına */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">Avans Talepleri</h2>
        <button
          onClick={() => setShowAdvanceModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Yeni Talep
        </button>
      </div>

      {/* Modal */}
      <AdvanceRequestModal 
        isOpen={showAdvanceModal} 
        onClose={() => setShowAdvanceModal(false)} 
      />
    </>
  )
}
