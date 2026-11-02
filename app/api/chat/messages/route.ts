/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - Şantiye Mesajları API'si (Hem ChatChannel hem de Conversation uyumlu)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const conversationId = searchParams.get("conversationId");

    if (!channelId && !conversationId) {
      return NextResponse.json(
        { error: "channelId veya conversationId parametresi zorunludur" },
        { status: 400 }
      );
    }

    const whereClause: any = channelId ? { channelId } : { conversationId };

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      take: 60,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error("[Chat Messages GET Error]:", error);
    return NextResponse.json(
      { error: "Mesajlar getirilemedi: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, conversationId, content, body: legacyBody, audioUrl, imageUrl, senderId } =
      body || {};

    if ((!channelId && !conversationId) || !senderId) {
      return NextResponse.json(
        { error: "channelId/conversationId ve senderId zorunludur" },
        { status: 400 }
      );
    }

    // Kullanıcı kontrolü
    const user = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, name: true, role: true, profileImage: true },
    });

    const effectiveSenderId = user ? user.id : (await prisma.user.findFirst())?.id || senderId;
    const effectiveContent = content || legacyBody || null;

    const message = await prisma.message.create({
      data: {
        channelId: channelId || null,
        conversationId: conversationId || null,
        content: effectiveContent,
        body: effectiveContent,
        audioUrl: audioUrl || null,
        imageUrl: imageUrl || null,
        senderId: effectiveSenderId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error("[Chat Messages POST Error]:", error);
    return NextResponse.json(
      { error: "Mesaj gönderilemedi: " + error.message },
      { status: 500 }
    );
  }
}