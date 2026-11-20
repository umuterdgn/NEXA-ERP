/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * GET/POST/PATCH /api/mobile/hr/requests
 * İzin, Avans ve Masraf/Fiş Talepleri ve Yönetici Onay Uçları
 */

import { NextResponse } from "next/server"
import { getMobileAuth } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import {
  assertRecordTenantScope,
  assertTenantAndProjectAccess,
  requireAnyModule,
} from "@/lib/api-rbac"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["my_leaves", "my_salary_advances", "my_expenses", "approvals"])
    if (denied) return denied

    const { userId, role, tenantId } = auth
    const url = new URL(request.url)
    const type = url.searchParams.get("type") // "LEAVE", "ADVANCE", "EXPENSE", "ALL"

    const isApprover = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "FINANCE_MANAGER", "PROJECT_MANAGER", "SITE_MANAGER"].includes(role)
    const userFilter = isApprover ? {} : { userId }

    const [leaves, advances, expenses] = await Promise.all([
      type === "ADVANCE" || type === "EXPENSE"
        ? []
        : prisma.leaveRequest.findMany({
            where: {
              ...(tenantId ? { tenantId } : {}),
              ...userFilter,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { user: { select: { id: true, name: true } } },
          }),
      type === "LEAVE" || type === "EXPENSE"
        ? []
        : prisma.advanceRequest.findMany({
            where: {
              ...(tenantId ? { tenantId } : {}),
              ...userFilter,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { user: { select: { id: true, name: true } } },
          }),
      type === "LEAVE" || type === "ADVANCE"
        ? []
        : prisma.expenseClaim.findMany({
            where: {
              ...(tenantId ? { tenantId } : {}),
              ...userFilter,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { user: { select: { id: true, name: true } } },
          }),
    ])

    return NextResponse.json({
      success: true,
      leaves: leaves.map((l) => ({
        id: l.id,
        type: "LEAVE",
        leaveType: l.leaveType || "YILLIK",
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status,
        reason: l.reason,
        userName: l.user?.name,
        createdAt: l.createdAt,
      })),
      advances: advances.map((a) => ({
        id: a.id,
        type: "ADVANCE",
        amount: a.amount,
        deductMonth: a.deductMonth,
        status: a.status,
        reason: a.reason,
        userName: a.user?.name,
        createdAt: a.createdAt,
      })),
      expenses: expenses.map((e) => ({
        id: e.id,
        type: "EXPENSE",
        expenseType: e.expenseType,
        amount: e.amount,
        receiptUrl: e.receiptUrl,
        description: e.description,
        status: e.status,
        userName: e.user?.name,
        createdAt: e.createdAt,
      })),
    })
  } catch (error: any) {
    console.error("Mobile hr/requests GET error:", error)
    return NextResponse.json({ error: "Talepler alınamadı." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const denied = requireAnyModule(auth, ["my_leaves", "my_salary_advances", "my_expenses"])
    if (denied) return denied

    const { userId, tenantId, assignedProjectIds } = auth
    const body = await request.json().catch(() => ({}))
    const { requestType, leaveType, startDate, endDate, amount, deductMonth, expenseType, receiptUrl, description, reason, projectId: reqProjectId } = body

    if (reqProjectId) {
      const accessErr = await assertTenantAndProjectAccess(auth, reqProjectId)
      if (accessErr) return accessErr
    }

    const targetProjectId = reqProjectId || assignedProjectIds[0] || null

    if (requestType === "LEAVE") {
      if (!startDate || !endDate) {
        return NextResponse.json({ error: "Başlangıç ve bitiş tarihi zorunludur." }, { status: 400 })
      }
      const leave = await prisma.leaveRequest.create({
        data: {
          tenantId,
          userId,
          leaveType: leaveType || "YILLIK",
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason: reason || null,
          status: "PENDING",
        },
      })
      return NextResponse.json({ success: true, message: "İzin talebiniz iletildi.", request: leave })
    }

    if (requestType === "ADVANCE") {
      if (!amount || Number(amount) <= 0) {
        return NextResponse.json({ error: "Geçerli bir avans tutarı giriniz." }, { status: 400 })
      }
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const advance = await prisma.advanceRequest.create({
        data: {
          tenantId,
          userId,
          amount: Number(amount),
          deductMonth: deductMonth || currentMonth,
          reason: reason || null,
          status: "PENDING",
        },
      })
      return NextResponse.json({ success: true, message: "Avans talebiniz iletildi.", request: advance })
    }

    if (requestType === "EXPENSE") {
      if (!amount || !receiptUrl) {
        return NextResponse.json({ error: "Masraf tutarı ve fiş görseli zorunludur." }, { status: 400 })
      }
      const expense = await prisma.expenseClaim.create({
        data: {
          tenantId,
          userId,
          projectId: targetProjectId,
          expenseType: expenseType || "OTHER",
          amount: Number(amount),
          receiptUrl: receiptUrl.trim(),
          description: description || null,
          status: "PENDING",
        },
      })
      return NextResponse.json({ success: true, message: "Masraf fişiniz kaydedildi, onay bekliyor.", request: expense })
    }

    return NextResponse.json({ error: "Geçersiz talep türü (LEAVE, ADVANCE, EXPENSE)." }, { status: 400 })
  } catch (error: any) {
    console.error("Mobile hr/requests POST error:", error)
    return NextResponse.json({ error: "Talep iletilemedi." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getMobileAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Yetkisiz oturum." }, { status: 401 })
    }

    const { role } = auth
    const isApprover = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "FINANCE_MANAGER", "PROJECT_MANAGER", "SITE_MANAGER"].includes(role)
    if (!isApprover) {
      return NextResponse.json({ error: "Onaylama yetkiniz bulunmamaktadır." }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { requestType, id, action } = body // action: "APPROVE" | "REJECT"

    if (!id || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz parametreler." }, { status: 400 })
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED"

    if (requestType === "LEAVE") {
      const existing = await prisma.leaveRequest.findUnique({ where: { id } })
      if (!existing) return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 })
      const scopeErr = assertRecordTenantScope(auth, existing)
      if (scopeErr) return scopeErr
      await prisma.leaveRequest.update({ where: { id }, data: { status: newStatus } })
    } else if (requestType === "ADVANCE") {
      const existing = await prisma.advanceRequest.findUnique({ where: { id } })
      if (!existing) return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 })
      const scopeErr = assertRecordTenantScope(auth, existing)
      if (scopeErr) return scopeErr
      await prisma.advanceRequest.update({ where: { id }, data: { status: newStatus } })
    } else if (requestType === "EXPENSE") {
      const existing = await prisma.expenseClaim.findUnique({ where: { id } })
      if (!existing) return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 })
      const scopeErr = assertRecordTenantScope(auth, existing)
      if (scopeErr) return scopeErr
      await prisma.expenseClaim.update({ where: { id }, data: { status: newStatus } })
    } else {
      return NextResponse.json({ error: "Bilinmeyen talep türü." }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Talep ${action === "APPROVE" ? "onaylandı" : "reddedildi"}.`,
    })
  } catch (error: any) {
    console.error("Mobile hr/requests PATCH error:", error)
    return NextResponse.json({ error: "Onay güncellenemedi." }, { status: 500 })
  }
}

