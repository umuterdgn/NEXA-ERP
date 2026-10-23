/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Onay Bekleyenler (Pending Approvals) Konsolu
 * Şantiye Şefi veya Proje Müdürü giriş yaptığında, alt kademeden gelen
 * ve kendi onayını bekleyen tüm işlemleri (İş Kanıtları, İzinler, Masraflar, Hakedişler) tek ekranda görür.
 */

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import ApprovalsConsole from "./_components/ApprovalsConsole"
import { CheckSquare, ShieldCheck } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ApprovalsPage() {
  const session = await auth()

  const currentUser = {
    id: session?.user?.id || "",
    name: session?.user?.name || "Kullanıcı",
    role: (session?.user?.role as string) || "STAFF",
  }

  // 1. Taşeron İş Kanıtları (WorkProof - Multi-Tier Kademeli Onay)
  let workProofs: any[] = []
  try {
    workProofs = await prisma.workProof.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                title: true,
                city: true,
                district: true,
              },
            },
          },
        },
        subcontractor: {
          select: {
            id: true,
            name: true,
            contactName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  } catch (err) {
    console.error("Failed to fetch workProofs:", err)
  }

  // Fetch reviewer names for work proofs
  const reviewerIds = Array.from(
    new Set(
      workProofs
        .flatMap((wp) => [wp.engineerId, wp.managerId])
        .filter((id): id is string => Boolean(id))
    )
  )

  let userMap = new Map<string, string>()
  if (reviewerIds.length > 0) {
    const reviewerUsers = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true },
    })
    userMap = new Map(reviewerUsers.map((u) => [u.id, u.name]))
  }

  const enrichedWorkProofs = workProofs.map((wp) => ({
    ...wp,
    engineerName: wp.engineerId ? userMap.get(wp.engineerId) || "Saha Mühendisi" : null,
    managerName: wp.managerId ? userMap.get(wp.managerId) || "Şantiye Şefi" : null,
  }))

  // 2. Bekleyen İzin Talepleri (LeaveRequest)
  let pendingLeaves: any[] = []
  try {
    pendingLeaves = await prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: {
        personel: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  } catch (err) {
    console.error("Failed to fetch pending leaves:", err)
  }

  // 3. Bekleyen Masraf Talepleri (ExpenseClaim)
  let pendingExpenses: any[] = []
  try {
    pendingExpenses = await prisma.expenseClaim.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  } catch (err) {
    console.error("Failed to fetch pending expenses:", err)
  }

  // 4. Bekleyen Hakediş Talepleri (ProgressBilling)
  let pendingBillings: any[] = []
  try {
    pendingBillings = await prisma.progressBilling.findMany({
      where: {
        status: { in: ["PENDING_APPROVAL", "DRAFT"] },
      },
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                title: true,
              },
            },
            subcontractor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  } catch (err) {
    console.error("Failed to fetch pending billings:", err)
  }

  // 5. Şantiye Talepleri (ApprovalRequest)
  let pendingApprovals: any[] = []
  try {
    pendingApprovals = await prisma.approvalRequest.findMany({
      where: { status: "PENDING" },
      include: {
        project: {
          select: { id: true, name: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  } catch (err) {
    console.error("Failed to fetch approval requests:", err)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-blue-400" />
            <span>Merkezi Onay Yönetim Konsolu</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Şantiye Şefi & Proje Müdürü Kademe Onayları, İş Kanıtları, İzinler, Masraflar ve Hakediş Denetimi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-950/80 border border-blue-800/80 text-blue-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kademeli Onay Aktif
          </span>
        </div>
      </div>

      {/* Main Console Client Component */}
      <ApprovalsConsole
        workProofs={enrichedWorkProofs}
        leaveRequests={pendingLeaves}
        expenseClaims={pendingExpenses}
        progressBillings={pendingBillings}
        approvalRequests={pendingApprovals}
        currentUser={currentUser}
      />
    </div>
  )
}
