/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import LeaveRequestModal from "./LeaveRequestModal"

interface LeavePageClientProps {
  children: React.ReactNode
}

export default function LeavePageClient({ children }: LeavePageClientProps) {
  const [showRequestModal, setShowRequestModal] = useState(false)

  return (
    <>
      {children}
      
      {/* New Request Button */}
      <button
        onClick={() => setShowRequestModal(true)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        Yeni İzin Talep
      </button>

      {/* Modal */}
      <LeaveRequestModal 
        isOpen={showRequestModal} 
        onClose={() => setShowRequestModal(false)} 
      />
    </>
  )
}
