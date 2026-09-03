/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    
    const payments = await prisma.progressPayment.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching progress payments:", error);
    return NextResponse.json({ error: "Hakedişler yüklenirken hata oluştu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, description, quantity, unit, unitPrice, date } = data;
    
    const totalPrice = unitPrice ? quantity * unitPrice : null;

    const payment = await prisma.progressPayment.create({
      data: { 
        title,
        description,
        quantity,
        unit,
        unitPrice,
        totalPrice,
        date: date ? new Date(date) : new Date()
      }
    });
    
    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error creating progress payment:", error);
    return NextResponse.json({ error: "Hakediş oluşturulamadı" }, { status: 500 });
  }
}