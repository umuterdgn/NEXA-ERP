/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const groupId = searchParams.get("groupId");

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (groupId) where.documentGroupId = groupId;

    const documents = await prisma.projectDocument.findMany({
      where,
      include: {
        uploadedBy: {
          select: { name: true },
        },
      },
      orderBy: [
        { documentGroupId: 'asc' },
        { revision: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching project documents:", error);
    return NextResponse.json(
      { error: "Proje dokümanları getirilirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, title, type, fileUrl, revision, status, documentGroupId } = body;

    const document = await prisma.projectDocument.create({
      data: {
        projectId,
        title,
        type,
        fileUrl,
        revision: revision || 0,
        status: status || "ACTIVE",
        documentGroupId: documentGroupId || null,
      },
      include: {
        uploadedBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating project document:", error);
    return NextResponse.json(
      { error: "Proje dokümanı oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}
