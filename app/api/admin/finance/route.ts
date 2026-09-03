/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logFinancialAction } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      console.error("Finance GET: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transactions = await prisma.transaction.findMany({
      include: {
        project: true,
        company: true,
        personnel: true
      },
      orderBy: {
        date: 'desc'
      }
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Finance GET Error:", error)
    return NextResponse.json(
      { error: "İşlemler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      console.error("Finance POST: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const userName = session.user.name || "Bilinmeyen Kullanıcı"
    
    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        amount: parseFloat(data.amount.toString()),
        description: data.description,
        category: data.category,
        personnelId: data.personnelId || null,
        projectId: data.projectId || null,
        companyId: data.companyId || null
      },
      include: {
        project: true,
        company: true,
        personnel: true
      }
    })
    
    // Log the financial action with detailed information
    await logFinancialAction("EKLENDI", userName, transaction.amount, `${transaction.type} - ${transaction.description}`)
    
    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    console.error("Finance POST Error:", error)
    return NextResponse.json({ error: "İşlem kaydedilemedi" }, { status: 500 })
  }
}
