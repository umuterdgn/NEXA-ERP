/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const templates = await prisma.contractTemplate.findMany({
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching contract templates:", error)
    return NextResponse.json({ error: "Failed to fetch contract templates" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, content } = body

    const template = await prisma.contractTemplate.create({
      data: {
        name,
        content
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error creating contract template:", error)
    return NextResponse.json({ error: "Failed to create contract template" }, { status: 500 })
  }
}